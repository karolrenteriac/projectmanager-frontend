import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';

import { ProjectService, Project } from '../../services/project.service';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatRippleModule,
    MatDividerModule,
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  isLoading = true;
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProjects('');

    // Debounced search → calls backend
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((term) => {
        this.loadProjects(term);
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadProjects(search: string = ''): void {
    this.isLoading = true;
    this.projectService.getProjects(search).subscribe({
      next: (res) => {
        this.projects = res.projects || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.snackBar.open('Failed to load projects', 'Close', {
          duration: 4000,
          panelClass: ['snackbar-error'],
        });
        this.projects = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value || '');
  }

  createNewProject(): void {
    this.router.navigate(['/projects/new']);
  }

  editProject(project: Project): void {
    const id = project.id || project._id;
    this.router.navigate(['/projects/edit', id]);
  }

  confirmDelete(project: Project): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${project.title}"? This action can be undone by an administrator.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteProject(project);
      }
    });
  }

  private deleteProject(project: Project): void {
    const id = project.id || project._id;
    if (!id) return;

    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.snackBar.open('Project deleted successfully', 'OK', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
        this.loadProjects(this.searchTerm);
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to delete project';
        this.snackBar.open(msg, 'Close', {
          duration: 4000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  exportProject(project: Project): void {
    const id = project.id || project._id;
    if (!id) return;

    this.projectService.exportProject(id).subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-${project.title?.replace(/\s+/g, '_') || id}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.snackBar.open('Project exported successfully', 'OK', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to export project';
        this.snackBar.open(msg, 'Close', {
          duration: 4000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      planning: 'Planning',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };
    return labels[status || ''] || 'Unknown';
  }

  getStatusClass(status?: string): string {
    const classes: Record<string, string> = {
      planning: 'status-planning',
      'in-progress': 'status-in-progress',
      completed: 'status-completed',
    };
    return classes[status || ''] || 'status-unknown';
  }

  getProgressColor(progress?: number): string {
    const p = progress || 0;
    if (p >= 80) return '#10b981';
    if (p >= 50) return '#6366f1';
    if (p >= 25) return '#f59e0b';
    return '#94a3b8';
  }

  formatDate(date?: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  trackByProjectId(index: number, project: Project): string {
    return project.id || project._id || index.toString();
  }
}
