import {
  Component,
  OnInit,
  Inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import {
  AdminGovernanceService,
  ProjectReport,
  GovernanceProject,
} from '../../../services/admin-governance.service';

export interface ProjectReportDialogData {
  project: GovernanceProject;
}

@Component({
  selector: 'app-project-report-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="report-shell">

      <!-- Header -->
      <div class="report-header">
        <div class="header-left">
          <mat-icon class="header-icon">analytics</mat-icon>
          <div>
            <h2 class="report-title">Executive Report</h2>
            <p class="report-subtitle">{{ data.project.title }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-center">
        <mat-spinner diameter="48"></mat-spinner>
        <p class="loading-text">Generating executive report...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error() && !loading()" class="error-state">
        <mat-icon>error_outline</mat-icon>
        <p>Failed to load report. Please try again.</p>
        <button mat-stroked-button (click)="load()">Retry</button>
      </div>

      <!-- Report content -->
      <div class="report-body" *ngIf="report() && !loading() && !error()">
        <ng-container *ngIf="report() as r">

          <!-- Project summary strip -->
          <div class="summary-strip">
            <div class="summary-item">
              <span class="summary-label">Status</span>
              <span class="status-badge" [ngClass]="'status-' + r.projectSummary.status">
                {{ r.projectSummary.status | titlecase }}
              </span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Health</span>
              <span class="health-badge" [ngClass]="'health-' + r.projectSummary.health">
                {{ r.projectSummary.health | titlecase }}
              </span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Progress</span>
              <span class="summary-value">{{ r.projectSummary.progress }}%</span>
            </div>
            <div class="summary-item" *ngIf="r.projectSummary.startDate">
              <span class="summary-label">Start</span>
              <span class="summary-value">{{ r.projectSummary.startDate | date:'mediumDate' }}</span>
            </div>
            <div class="summary-item" *ngIf="r.projectSummary.endDate">
              <span class="summary-label">Deadline</span>
              <span class="summary-value">{{ r.projectSummary.endDate | date:'mediumDate' }}</span>
            </div>
          </div>

          <!-- Coordinator -->
          <div class="section" *ngIf="r.coordinatorInfo">
            <h3 class="section-title">
              <mat-icon class="section-icon">person_pin</mat-icon>
              Coordinator
            </h3>
            <div class="coord-card">
              <div class="coord-avatar">{{ r.coordinatorInfo.name.charAt(0).toUpperCase() }}</div>
              <div class="coord-info">
                <span class="coord-name">{{ r.coordinatorInfo.name }}</span>
                <span class="coord-email">{{ r.coordinatorInfo.email }}</span>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Task metrics -->
          <div class="section">
            <h3 class="section-title">
              <mat-icon class="section-icon">task_alt</mat-icon>
              Task Metrics
            </h3>
            <div class="metrics-grid">
              <div class="metric-tile tile-total">
                <span class="tile-value">{{ r.taskMetrics.total }}</span>
                <span class="tile-label">Total</span>
              </div>
              <div class="metric-tile tile-done">
                <span class="tile-value">{{ r.taskMetrics.completed }}</span>
                <span class="tile-label">Completed</span>
              </div>
              <div class="metric-tile tile-progress">
                <span class="tile-value">{{ r.taskMetrics.inProgress }}</span>
                <span class="tile-label">In Progress</span>
              </div>
              <div class="metric-tile tile-review">
                <span class="tile-value">{{ r.taskMetrics.review }}</span>
                <span class="tile-label">In Review</span>
              </div>
              <div class="metric-tile tile-blocked">
                <span class="tile-value">{{ r.taskMetrics.blocked }}</span>
                <span class="tile-label">Blocked</span>
              </div>
              <div class="metric-tile tile-todo">
                <span class="tile-value">{{ r.taskMetrics.todo }}</span>
                <span class="tile-label">To Do</span>
              </div>
            </div>

            <!-- Completion bar -->
            <div class="completion-bar-wrap">
              <div class="completion-bar-labels">
                <span>Completion</span>
                <span class="completion-pct">{{ r.completionPercentage }}%</span>
              </div>
              <div class="completion-bar">
                <div class="completion-fill" [style.width.%]="r.completionPercentage"></div>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Timeline performance -->
          <div class="section">
            <h3 class="section-title">
              <mat-icon class="section-icon">schedule</mat-icon>
              Timeline Performance
            </h3>
            <div class="timeline-grid">
              <div class="timeline-item good">
                <mat-icon>check_circle</mat-icon>
                <span class="tl-value">{{ r.timelinePerformance.onTimeRate }}%</span>
                <span class="tl-label">On Time</span>
              </div>
              <div class="timeline-item bad">
                <mat-icon>warning</mat-icon>
                <span class="tl-value">{{ r.timelinePerformance.overdueRate }}%</span>
                <span class="tl-label">Overdue</span>
              </div>
              <div class="timeline-item neutral">
                <mat-icon>calendar_today</mat-icon>
                <span class="tl-value">{{ r.timelinePerformance.totalWithDueDate }}</span>
                <span class="tl-label">With Deadline</span>
              </div>
            </div>
          </div>

          <!-- Review bottlenecks -->
          <ng-container *ngIf="r.reviewBottlenecks.length > 0">
            <mat-divider></mat-divider>
            <div class="section">
              <h3 class="section-title">
                <mat-icon class="section-icon warning-icon">hourglass_empty</mat-icon>
                Review Bottlenecks
              </h3>
              <div class="bottleneck-list">
                <div class="bottleneck-row" *ngFor="let b of r.reviewBottlenecks">
                  <span class="priority-dot" [ngClass]="'prio-' + b.priority"></span>
                  <span class="bt-title">{{ b.title }}</span>
                  <span class="bt-user">{{ b.assignedTo?.name || 'Unassigned' }}</span>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Overdue analysis -->
          <ng-container *ngIf="r.overdueAnalysis.count > 0">
            <mat-divider></mat-divider>
            <div class="section">
              <h3 class="section-title">
                <mat-icon class="section-icon danger-icon">report_problem</mat-icon>
                Overdue Analysis ({{ r.overdueAnalysis.count }})
              </h3>
              <div class="overdue-list">
                <div class="overdue-row" *ngFor="let t of r.overdueAnalysis.tasks">
                  <div class="overdue-info">
                    <span class="priority-dot" [ngClass]="'prio-' + t.priority"></span>
                    <span class="ov-title">{{ t.title }}</span>
                  </div>
                  <div class="overdue-meta">
                    <span class="ov-user">{{ t.assignedTo?.name || 'Unassigned' }}</span>
                    <span class="overdue-badge">{{ t.daysOverdue }}d overdue</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Workload distribution -->
          <ng-container *ngIf="r.workloadDistribution.length > 0">
            <mat-divider></mat-divider>
            <div class="section">
              <h3 class="section-title">
                <mat-icon class="section-icon">groups</mat-icon>
                Workload Distribution
              </h3>
              <div class="workload-list">
                <div class="workload-row" *ngFor="let w of r.workloadDistribution">
                  <div class="wl-user">
                    <div class="wl-avatar">{{ w.user.name.charAt(0).toUpperCase() }}</div>
                    <div class="wl-name-email">
                      <span class="wl-name">{{ w.user.name }}</span>
                      <span class="wl-email">{{ w.user.email }}</span>
                    </div>
                  </div>
                  <div class="wl-stats">
                    <span class="wl-stat" title="Total">{{ w.total }} tasks</span>
                    <span class="wl-stat done" title="Done">{{ w.done }} done</span>
                    <span class="wl-stat overdue" *ngIf="w.overdue > 0" title="Overdue">
                      {{ w.overdue }} overdue
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

        </ng-container>
      </div>

      <!-- Footer -->
      <div class="report-footer" *ngIf="!loading()">
        <span class="generated-at">Generated {{ now | date:'medium' }}</span>
        <button mat-flat-button color="primary" (click)="close()">Close</button>
      </div>

    </div>
  `,
  styles: [`
    .report-shell {
      display: flex;
      flex-direction: column;
      width: 680px;
      max-width: 95vw;
      max-height: 90vh;
    }

    /* Header */
    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f0f0f0;
      flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-icon { font-size: 30px; width: 30px; height: 30px; color: #1565c0; }
    .report-title { margin: 0; font-size: 18px; font-weight: 700; color: #0f1923; }
    .report-subtitle { margin: 2px 0 0; font-size: 13px; color: #888; }

    /* Loading/error */
    .loading-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 0;
    }
    .loading-text { color: #888; font-size: 14px; }
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 0;
      color: #c62828;
    }

    /* Body */
    .report-body {
      overflow-y: auto;
      flex: 1;
      padding: 0 24px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* Summary strip */
    .summary-strip {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 16px 0;
      flex-wrap: wrap;
    }
    .summary-item { display: flex; flex-direction: column; gap: 4px; }
    .summary-label { font-size: 11px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.4px; }
    .summary-value { font-size: 14px; font-weight: 600; color: #0f1923; }

    /* Status badge */
    .status-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
    }
    .status-planning    { background: #e3f2fd; color: #1565c0; }
    .status-in-progress { background: #fff3e0; color: #e65100; }
    .status-completed   { background: #e8f5e9; color: #2e7d32; }

    /* Health badge */
    .health-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
    }
    .health-healthy  { background: #e8f5e9; color: #2e7d32; }
    .health-delayed  { background: #fffde7; color: #f57f17; }
    .health-blocked  { background: #fff3e0; color: #e65100; }
    .health-critical { background: #ffebee; color: #c62828; }

    /* Section */
    .section { padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #0f1923;
      margin: 0;
    }
    .section-icon { font-size: 18px; width: 18px; height: 18px; color: #1565c0; }
    .warning-icon { color: #f57f17; }
    .danger-icon  { color: #c62828; }

    /* Coordinator card */
    .coord-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .coord-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1565c0;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .coord-name  { font-weight: 600; font-size: 14px; color: #0f1923; display: block; }
    .coord-email { font-size: 12px; color: #888; }

    /* Metrics grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .metric-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      border-radius: 10px;
      padding: 14px;
      border: 1.5px solid transparent;
    }
    .tile-value { font-size: 24px; font-weight: 700; }
    .tile-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }

    .tile-total    { background: #f5f7fa; border-color: #e0e0e0; color: #0f1923; }
    .tile-done     { background: #e8f5e9; border-color: #81c784; color: #2e7d32; }
    .tile-progress { background: #e3f2fd; border-color: #90caf9; color: #1565c0; }
    .tile-review   { background: #fff3e0; border-color: #ffcc80; color: #e65100; }
    .tile-blocked  { background: #ffebee; border-color: #ef9a9a; color: #c62828; }
    .tile-todo     { background: #f3e5f5; border-color: #ce93d8; color: #6a1b9a; }

    /* Completion bar */
    .completion-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
    .completion-bar-labels { display: flex; justify-content: space-between; font-size: 13px; color: #555; }
    .completion-pct { font-weight: 700; color: #2e7d32; }
    .completion-bar { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
    .completion-fill { height: 100%; background: linear-gradient(90deg, #43a047, #66bb6a); border-radius: 4px; transition: width 0.4s ease; }

    /* Timeline */
    .timeline-grid { display: flex; gap: 16px; flex-wrap: wrap; }
    .timeline-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 14px 20px;
      border-radius: 10px;
      flex: 1;
      min-width: 100px;
    }
    .timeline-item mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .tl-value { font-size: 20px; font-weight: 700; }
    .tl-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
    .good    { background: #e8f5e9; color: #2e7d32; }
    .bad     { background: #ffebee; color: #c62828; }
    .neutral { background: #e3f2fd; color: #1565c0; }

    /* Bottlenecks */
    .bottleneck-list { display: flex; flex-direction: column; gap: 8px; }
    .bottleneck-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #fff8e1;
      border-radius: 8px;
      border-left: 3px solid #f9a825;
    }
    .bt-title  { flex: 1; font-size: 13px; color: #0f1923; }
    .bt-user   { font-size: 12px; color: #888; }

    /* Overdue */
    .overdue-list { display: flex; flex-direction: column; gap: 8px; }
    .overdue-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #ffebee;
      border-radius: 8px;
      border-left: 3px solid #e53935;
    }
    .overdue-info { display: flex; align-items: center; gap: 10px; }
    .overdue-meta { display: flex; align-items: center; gap: 10px; }
    .ov-title  { font-size: 13px; color: #0f1923; }
    .ov-user   { font-size: 12px; color: #888; }
    .overdue-badge {
      background: #e53935;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
    }

    /* Priority dot */
    .priority-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .prio-low    { background: #9e9e9e; }
    .prio-medium { background: #42a5f5; }
    .prio-high   { background: #ffa726; }
    .prio-urgent { background: #ef5350; }

    /* Workload */
    .workload-list { display: flex; flex-direction: column; gap: 8px; }
    .workload-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #f5f7fa;
      border-radius: 8px;
    }
    .wl-user { display: flex; align-items: center; gap: 10px; }
    .wl-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #1565c0;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .wl-name  { font-size: 13px; font-weight: 600; color: #0f1923; display: block; }
    .wl-email { font-size: 11px; color: #aaa; }
    .wl-stats { display: flex; align-items: center; gap: 10px; }
    .wl-stat  { font-size: 12px; color: #555; }
    .wl-stat.done    { color: #2e7d32; font-weight: 600; }
    .wl-stat.overdue { color: #c62828; font-weight: 600; }

    /* Footer */
    .report-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      border-top: 1px solid #f0f0f0;
      flex-shrink: 0;
    }
    .generated-at { font-size: 12px; color: #aaa; }
  `],
})
export class ProjectReportDialogComponent implements OnInit {
  loading = signal(true);
  error = signal(false);
  report = signal<ProjectReport | null>(null);
  now = new Date();

  constructor(
    public dialogRef: MatDialogRef<ProjectReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProjectReportDialogData,
    private governanceService: AdminGovernanceService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.governanceService.getProjectReport(this.data.project.id).subscribe({
      next: ({ report }) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
