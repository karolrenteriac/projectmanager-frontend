import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TasksWorkspaceService, Task } from './services/tasks-workspace.service';
import { ProjectService, Project, User } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { KanbanColumnComponent } from './components/kanban-column/kanban-column.component';
import { TaskFormDialog } from './components/dialogs/create-task-dialog/create-task-dialog';

@Component({
  selector: 'app-tasks-workspace',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    DragDropModule,
    MatDialogModule,
    KanbanColumnComponent
  ],
  templateUrl: './tasks-workspace.component.html',
  styleUrl: './tasks-workspace.component.css'
})
export class TasksWorkspaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tasksService = inject(TasksWorkspaceService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private dialog = inject(MatDialog);

  projectId = signal<string | null>(null);
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  searchControl = new FormControl('');
  assigneeFilter = new FormControl('');
  priorityFilter = new FormControl('');

  // Grouped tasks
  todoTasks = signal<Task[]>([]);
  inProgressTasks = signal<Task[]>([]);
  reviewTasks = signal<Task[]>([]);
  doneTasks = signal<Task[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('projectId') || params.get('id');
      if (id) {
        this.projectId.set(id);
        this.loadData(id);
        this.setupSockets(id);
      }
    });

    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.assigneeFilter.valueChanges.subscribe(() => this.applyFilters());
    this.priorityFilter.valueChanges.subscribe(() => this.applyFilters());
  }

  setupSockets(projectId: string) {
    this.socketService.joinProject(projectId);
    this.socketService.onTaskCreated().subscribe(() => this.loadData(projectId));
    this.socketService.onTaskUpdated().subscribe(() => this.loadData(projectId));
    this.socketService.onTaskDeleted().subscribe(() => this.loadData(projectId));
    this.socketService.onReviewRequested().subscribe(() => this.loadData(projectId));
  }

  loadData(id: string) {
    this.loading.set(true);
    this.error.set(null);

    // Load Project Details
    this.projectService.getProjectById(id).subscribe({
      next: (proj) => this.project.set(proj),
      error: (err) => console.error('Error loading project:', err)
    });

    // Load Tasks
    this.tasksService.getTasksByProject(id).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.groupTasks(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load tasks. Please try again.');
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = this.tasks();
    const search = this.searchControl.value?.toLowerCase();
    const assignee = this.assigneeFilter.value;
    const priority = this.priorityFilter.value;

    if (search) {
      filtered = filtered.filter(t => t.title.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));
    }
    if (assignee) {
      filtered = filtered.filter(t => (t.assignedTo as any)?.id === assignee || (t.assignedTo as any)?._id === assignee);
    }
    if (priority) {
      filtered = filtered.filter(t => t.priority === priority);
    }

    this.groupTasks(filtered);
  }

  groupTasks(tasks: Task[]) {
    this.todoTasks.set(tasks.filter(t => t.status === 'todo' || t.status === 'blocked'));
    this.inProgressTasks.set(tasks.filter(t => t.status === 'in-progress'));
    this.reviewTasks.set(tasks.filter(t => t.status === 'review'));
    this.doneTasks.set(tasks.filter(t => t.status === 'done' || t.status === 'cancelled'));
  }

  backToOverview(): void {
    const id = this.projectId();
    if (id) this.router.navigate(['/projects', id]);
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  openCreateTaskDialog() {
    const user = this.authService.getUser();
    const dialogRef = this.dialog.open(TaskFormDialog, {
      width: '640px',
      data: {
        mode: 'create',
        projectId: this.projectId(),
        currentUserId: user?.id || user?._id,
        currentUserRole: user?.role,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      // result: TaskFormResult { mode: 'create', payload }
      this.tasksService.createTask(result.payload).subscribe({
        next: () => this.loadData(this.projectId()!),
        error: (err) => console.error('[Workspace] Error creating task', err)
      });
    });
  }

  onTaskDropped(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const task = event.container.data[event.currentIndex];
      const newStatus = event.container.id as Task['status'];

      // Business Logic constraints:
      // IN_PROGRESS -> REVIEW requires evidence or completion comment (mocked here, should check attachments)
      // REVIEW -> DONE requires coordinator/admin approval.
      // For now, we update backend and let backend enforce or we do it optimistically
      task.status = newStatus;
      this.tasksService.updateTaskStatus(task.id, newStatus).subscribe({
        next: (updatedTask) => {
          // Task updated
        },
        error: (err) => {
          console.error('Failed to update task status', err);
          // Revert drag
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex,
          );
        }
      });
    }
  }
}
