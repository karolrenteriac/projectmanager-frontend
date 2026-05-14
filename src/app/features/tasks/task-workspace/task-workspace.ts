import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { ProjectService, Project } from '../../../services/project.service';
import { TaskService, Task } from '../../../services/task.service';
import { KanbanComponent } from '../../projects/project-details/kanban/kanban';

@Component({
  selector: 'app-task-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    KanbanComponent
  ],
  templateUrl: './task-workspace.html',
  styleUrl: './task-workspace.css',
})
export class TaskWorkspaceComponent implements OnInit, OnDestroy {
  project: Project | null = null;
  tasks: Task[] = [];
  isLoading = true;

  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProjectData(id);
    } else {
      this.router.navigate(['/tasks']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjectData(id: string): void {
    this.isLoading = true;
    this.projectService.getProjectById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.project = project;
          this.loadTasks(id);
        },
        error: (err) => {
          console.error('Error loading project:', err);
          this.snackBar.open('Project not found', 'Close', { duration: 4000 });
          this.router.navigate(['/tasks']);
        }
      });
  }

  loadTasks(projectId: string): void {
    this.taskService.getTasksByProject(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.tasks = res.tasks || [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading tasks:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onTaskUpdated(): void {
    const id = this.project?.id || this.project?._id;
    if (id) {
      this.loadTasks(id);
    }
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}
