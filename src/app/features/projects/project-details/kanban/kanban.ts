import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  CdkDragDrop, 
  moveItemInArray, 
  transferArrayItem, 
  DragDropModule 
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { Task, TaskService } from '../../../../services/task.service';
import { TaskDialogComponent } from '../task-dialog/task-dialog';

interface KanbanColumn {
  id: string;
  title: string;
  status: Task['status'];
  tasks: Task[];
  icon: string;
  color: string;
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './kanban.html',
  styleUrl: './kanban.css',
})
export class KanbanComponent implements OnChanges {
  @Input() projectId!: string;
  @Input() tasks: Task[] = [];
  @Input() members: any[] = [];
  @Output() updated = new EventEmitter<void>();

  columns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', status: 'pending', tasks: [], icon: 'list', color: '#ea580c' },
    { id: 'progress', title: 'In Progress', status: 'in-progress', tasks: [], icon: 'sync', color: '#4f46e5' },
    { id: 'review', title: 'Review', status: 'review', tasks: [], icon: 'rate_review', color: '#db2777' },
    { id: 'done', title: 'Done', status: 'completed', tasks: [], icon: 'check_circle', color: '#16a34a' }
  ];

  private taskService = inject(TaskService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.distributeTasks();
    }
  }

  distributeTasks(): void {
    // Reset columns
    this.columns.forEach(col => col.tasks = []);
    
    // Map tasks to columns
    this.tasks.forEach(task => {
      const col = this.columns.find(c => c.status === task.status);
      if (col) col.tasks.push(task);
    });
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = this.columns.find(c => c.id === event.container.id)?.status;

      if (!newStatus || !task.id) return;

      // Optimistic UI Update
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Backend update
      this.updateTaskStatus(task.id, newStatus);
    }
  }

  updateTaskStatus(taskId: string, status: Task['status']): void {
    this.taskService.updateTaskStatus(taskId, status).subscribe({
      next: () => {
        this.updated.emit(); // Notify parent to refresh stats/project progress
      },
      error: (err) => {
        console.error('Error updating task status:', err);
        this.snackBar.open('Failed to update task status', 'Close', { duration: 3000 });
        this.updated.emit(); // Force refresh to revert UI if needed
      }
    });
  }

  getMemberInitials(member: any): string {
    if (!member?.name) return '?';
    return member.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 1);
  }

  createTask(status: Task['status']): void {
    this.openTaskDialog(undefined, status);
  }

  editTask(task: Task): void {
    this.openTaskDialog(task);
  }

  openTaskDialog(task?: Task, initialStatus?: Task['status']): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '550px',
      data: {
        task: task ? { ...task, status: initialStatus || task.status } : undefined,
        projectId: this.projectId,
        projectMembers: this.members
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updated.emit();
      }
    });
  }

  deleteTask(task: Task): void {
    if (!task.id) return;
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.snackBar.open('Task deleted', 'OK', { duration: 2000 });
        this.updated.emit();
      }
    });
  }
}
