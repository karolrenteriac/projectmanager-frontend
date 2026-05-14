import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { ProjectService, Project } from '../../services/project.service';
import { TasksWorkspaceService, Task } from '../tasks-workspace/services/tasks-workspace.service';
import { ConfirmDialogComponent } from '../projects/confirm-dialog/confirm-dialog.component';

interface SectionCard {
  id: string;
  label: string;
  icon: string;
  description: string;
  route: string;
  color: string;
  badge?: string | number;
}

@Component({
  selector: 'app-project-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.css',
})
export class ProjectOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private tasksService = inject(TasksWorkspaceService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  projectId = signal<string | null>(null);
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  loading = signal(true);
  tasksLoading = signal(true);
  error = signal<string | null>(null);

  // Computed stats
  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() => this.tasks().filter(t => t.status === 'done').length);
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'in-progress').length);
  reviewTasks = computed(() => this.tasks().filter(t => t.status === 'review').length);
  todoTasks = computed(() => this.tasks().filter(t => t.status === 'todo' || t.status === 'blocked').length);
  teamMembers = computed(() =>
    (this.project()?.principalResearchers?.length ?? 0) +
    (this.project()?.coResearchers?.length ?? 0)
  );
  completionRate = computed(() => {
    const total = this.totalTasks();
    if (total === 0) return 0;
    return Math.round((this.completedTasks() / total) * 100);
  });

  sections = computed<SectionCard[]>(() => {
    const id = this.projectId();
    return [
      {
        id: 'tasks',
        label: 'Tasks',
        icon: 'task_alt',
        description: 'Kanban board · manage and track tasks',
        route: `/projects/${id}/tasks`,
        color: '#6366f1',
        badge: this.totalTasks() > 0 ? this.totalTasks() : undefined,
      },
      {
        id: 'team',
        label: 'Team',
        icon: 'group',
        description: 'Members · roles · permissions',
        route: `/projects/${id}/team`,
        color: '#10b981',
        badge: this.teamMembers() > 0 ? this.teamMembers() : undefined,
      },
      {
        id: 'files',
        label: 'Files',
        icon: 'folder_open',
        description: 'Documents · attachments · assets',
        route: `/projects/${id}/files`,
        color: '#f59e0b',
      },
      {
        id: 'activity',
        label: 'Activity',
        icon: 'timeline',
        description: 'Audit log · updates · history',
        route: `/projects/${id}/activity`,
        color: '#3b82f6',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        description: 'Configure project preferences',
        route: `/projects/edit/${id}`,
        color: '#8b5cf6',
      },
    ];
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('projectId') || params.get('id');
      if (id) {
        this.projectId.set(id);
        this.loadProject(id);
        this.loadTasks(id);
      }
    });
  }

  loadProject(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.projectService.getProjectById(id).subscribe({
      next: proj => {
        this.project.set(proj);
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Failed to load project details.');
        this.loading.set(false);
      },
    });
  }

  loadTasks(id: string) {
    this.tasksLoading.set(true);
    this.tasksService.getTasksByProject(id).subscribe({
      next: tasks => {
        this.tasks.set(tasks);
        this.tasksLoading.set(false);
      },
      error: () => {
        this.tasks.set([]);
        this.tasksLoading.set(false);
      },
    });
  }

  openTasks() {
    const id = this.projectId();
    if (id) this.router.navigate(['/projects', id, 'tasks']);
  }

  editProject() {
    const id = this.projectId();
    if (id) this.router.navigate(['/projects/edit', id]);
  }

  exportProject() {
    const id = this.projectId();
    if (!id) return;
    this.projectService.exportProject(id).subscribe({
      next: data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-${this.project()?.title?.replace(/\s+/g, '_') || id}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.snackBar.open('Project exported successfully', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to export project', 'Close', { duration: 4000 }),
    });
  }

  confirmDelete() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${this.project()?.title}"? This action can be undone by an administrator.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const id = this.projectId();
        if (!id) return;
        this.projectService.deleteProject(id).subscribe({
          next: () => {
            this.snackBar.open('Project deleted', 'OK', { duration: 3000 });
            this.router.navigate(['/projects']);
          },
          error: err =>
            this.snackBar.open(err.error?.message || 'Failed to delete project', 'Close', {
              duration: 4000,
            }),
        });
      }
    });
  }

  navigateToSection(section: SectionCard) {
    this.router.navigateByUrl(section.route);
  }

  backToProjects() {
    this.router.navigate(['/projects']);
  }

  getMemberInitials(member: any): string {
    if (!member?.name) return '?';
    return member.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getMemberColor(index: number): string {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
    return colors[index % colors.length];
  }

  getStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      planning: 'Planning',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };
    return map[status || ''] || 'Unknown';
  }

  getStatusIcon(status?: string): string {
    const map: Record<string, string> = {
      planning: 'pending_actions',
      'in-progress': 'play_circle',
      completed: 'check_circle',
    };
    return map[status || ''] || 'help_outline';
  }

  formatDate(date?: string | null): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  getDaysLeft(): string {
    const end = this.project()?.endDate;
    if (!end) return '—';
    const diff = new Date(end).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    return `${days} days left`;
  }

  getDaysLeftClass(): string {
    const end = this.project()?.endDate;
    if (!end) return '';
    const diff = new Date(end).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'overdue';
    if (days <= 7) return 'due-soon';
    return 'on-track';
  }
}
