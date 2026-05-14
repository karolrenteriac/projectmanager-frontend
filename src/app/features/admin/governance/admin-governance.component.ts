import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import {
  AdminGovernanceService,
  GovernanceProject,
  ProjectHealth,
  ProjectStatus,
} from '../services/admin-governance.service';
import { ProjectReportDialogComponent } from './components/project-report-dialog/project-report-dialog.component';
import { AssignCoordinatorDialogComponent } from './components/assign-coordinator-dialog/assign-coordinator-dialog.component';

@Component({
  selector: 'app-admin-governance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  templateUrl: './admin-governance.component.html',
  styleUrl: './admin-governance.component.css',
})
export class AdminGovernanceComponent implements OnInit {
  projects = signal<GovernanceProject[]>([]);
  loading = signal(true);
  loadError = signal(false);

  searchQuery = signal('');
  filterHealth = signal<ProjectHealth | ''>('');
  filterStatus = signal<ProjectStatus | ''>('');
  filterCoordinator = signal('');

  healthOptions: { value: ProjectHealth | ''; label: string }[] = [
    { value: '', label: 'All Health' },
    { value: 'healthy', label: 'Healthy' },
    { value: 'delayed', label: 'Delayed' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'critical', label: 'Critical' },
  ];

  statusOptions: { value: ProjectStatus | ''; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: 'planning', label: 'Planning' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  // ── Computed stats ─────────────────────────────────────────────────────────

  summaryStats = computed(() => {
    const all = this.projects();
    return {
      total: all.length,
      healthy: all.filter((p) => p.health === 'healthy').length,
      delayed: all.filter((p) => p.health === 'delayed').length,
      blocked: all.filter((p) => p.health === 'blocked').length,
      critical: all.filter((p) => p.health === 'critical').length,
      overdueTasks: all.reduce((s, p) => s + p.overdueTasks, 0),
    };
  });

  coordinatorOptions = computed(() => {
    const seen = new Set<string>();
    const options: { id: string; name: string }[] = [];
    for (const p of this.projects()) {
      if (p.coordinator && !seen.has(p.coordinator.id)) {
        seen.add(p.coordinator.id);
        options.push({ id: p.coordinator.id, name: p.coordinator.name });
      }
    }
    return options;
  });

  filteredProjects = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const h = this.filterHealth();
    const s = this.filterStatus();
    const c = this.filterCoordinator();

    return this.projects().filter((p) => {
      if (q && !p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      if (h && p.health !== h) return false;
      if (s && p.status !== s) return false;
      if (c && p.coordinator?.id !== c) return false;
      return true;
    });
  });

  constructor(
    private governanceService: AdminGovernanceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.governanceService.getGovernanceData().subscribe({
      next: ({ projects }) => {
        this.projects.set(projects);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.projects.set([]);
        this.loading.set(false);
        this.loadError.set(true);
        this.cdr.markForCheck();
      },
    });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  openReport(project: GovernanceProject): void {
    this.dialog.open(ProjectReportDialogComponent, {
      data: { project },
      width: '700px',
      maxWidth: '96vw',
      maxHeight: '92vh',
    });
  }

  openAssignCoordinator(project: GovernanceProject): void {
    const ref = this.dialog.open(AssignCoordinatorDialogComponent, {
      data: { project },
      width: '500px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result?.coordinatorId) return;
      this.governanceService
        .assignCoordinator(project.id, result.coordinatorId)
        .subscribe({
          next: ({ coordinator }) => {
            this.projects.update((list) =>
              list.map((p) =>
                p.id === project.id ? { ...p, coordinator } : p
              )
            );
            this.snackBar.open(
              `${coordinator.name} assigned as coordinator`,
              'Close',
              { duration: 3500 }
            );
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.snackBar.open(
              err?.error?.message ?? 'Assignment failed',
              'Dismiss',
              { duration: 4000 }
            );
          },
        });
    });
  }

  trackById(_: number, p: GovernanceProject): string {
    return p.id;
  }

  healthLabel(h: ProjectHealth): string {
    return h.charAt(0).toUpperCase() + h.slice(1);
  }

  progressColor(progress: number): string {
    if (progress >= 75) return 'primary';
    if (progress >= 40) return 'accent';
    return 'warn';
  }

  relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }
}
