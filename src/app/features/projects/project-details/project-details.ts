import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { ProjectService, Project } from '../../../services/project.service';
import { TaskService, Task } from '../../../services/task.service';
import { KanbanComponent } from './kanban/kanban';

@Component({
  selector: 'app-project-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    KanbanComponent
  ],
  templateUrl: './project-details.html',
  styleUrl: './project-details.css',
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  project: Project | null = null;
  tasks: Task[] = [];
  isLoading = true;
  stats = {
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    percent: 0
  };

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
      this.router.navigate(['/projects']);
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
          this.router.navigate(['/projects']);
        }
      });
  }

  loadTasks(projectId: string): void {
    this.taskService.getTasksByProject(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.tasks = res.tasks || [];
          this.calculateStats();
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

  calculateStats(): void {
    const total = this.tasks.length;
    const todo = this.tasks.filter(t => t.status === 'pending').length;
    const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
    const review = this.tasks.filter(t => t.status === 'review').length;
    const done = this.tasks.filter(t => t.status === 'completed').length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    this.stats = { total, todo, inProgress, review, done, percent };
  }

  onTaskUpdated(): void {
    const id = this.project?.id || this.project?._id;
    if (id) {
      // Reload everything to keep progress in sync
      this.loadProjectData(id);
    }
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      planning: 'Planning',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };
    return labels[status || ''] || 'Unknown';
  }

  getMemberInitials(member: any): string {
    if (!member?.name) return '?';
    return member.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  editProject(): void {
    const id = this.project?.id || this.project?._id;
    this.router.navigate(['/projects/edit', id]);
  }
}
