import {
  Component,
  OnInit,
  Inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import {
  AdminGovernanceService,
  GovernanceProject,
} from '../../../services/admin-governance.service';

export interface AssignCoordinatorDialogData {
  project: GovernanceProject;
}

@Component({
  selector: 'app-assign-coordinator-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-header">
        <mat-icon class="header-icon">swap_horiz</mat-icon>
        <div>
          <h2 class="dialog-title">Assign Coordinator</h2>
          <p class="dialog-subtitle">{{ data.project.title }}</p>
        </div>
      </div>

      <div class="dialog-body">
        <div *ngIf="loading()" class="loading-center">
          <mat-spinner diameter="36"></mat-spinner>
        </div>

        <ng-container *ngIf="!loading()">
          <div class="current-coordinator" *ngIf="data.project.coordinator">
            <span class="cc-label">Current coordinator</span>
            <div class="cc-value">
              <mat-icon class="cc-icon">person</mat-icon>
              <span>{{ data.project.coordinator.name }}</span>
              <span class="cc-email">{{ data.project.coordinator.email }}</span>
            </div>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Select new coordinator</mat-label>
            <mat-select [(ngModel)]="selectedId">
              <mat-option
                *ngFor="let c of coordinators()"
                [value]="c.id"
                [disabled]="c.id === data.project.coordinator?.id"
              >
                <span class="option-name">{{ c.name }}</span>
                <span class="option-email"> — {{ c.email }}</span>
              </mat-option>
            </mat-select>
          </mat-form-field>

          <p class="no-coords" *ngIf="coordinators().length === 0">
            No coordinators available in the organization.
          </p>
        </ng-container>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="cancel()">Cancel</button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="!selectedId || saving()"
          (click)="confirm()"
        >
          <mat-spinner *ngIf="saving()" diameter="18" class="btn-spinner"></mat-spinner>
          {{ saving() ? 'Assigning...' : 'Assign Coordinator' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-shell { padding: 0; min-width: 420px; max-width: 520px; }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 24px 24px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .header-icon { font-size: 28px; width: 28px; height: 28px; color: #1565c0; }

    .dialog-title { margin: 0; font-size: 18px; font-weight: 700; color: #0f1923; }
    .dialog-subtitle { margin: 2px 0 0; font-size: 13px; color: #888; }

    .dialog-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

    .loading-center { display: flex; justify-content: center; padding: 24px 0; }

    .current-coordinator {
      background: #f5f7fa;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .cc-label { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .cc-value { display: flex; align-items: center; gap: 8px; }
    .cc-icon { font-size: 18px; width: 18px; height: 18px; color: #1565c0; }
    .cc-email { font-size: 12px; color: #888; }

    .full-width { width: 100%; }

    .option-name { font-weight: 500; }
    .option-email { font-size: 12px; color: #888; }

    .no-coords { color: #888; font-size: 14px; text-align: center; padding: 12px 0; }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 12px 24px 20px;
      border-top: 1px solid #f0f0f0;
    }

    .btn-spinner { display: inline-block; margin-right: 6px; vertical-align: middle; }
  `],
})
export class AssignCoordinatorDialogComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  coordinators = signal<any[]>([]);
  selectedId: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AssignCoordinatorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignCoordinatorDialogData,
    private governanceService: AdminGovernanceService
  ) {}

  ngOnInit(): void {
    this.governanceService.getAvailableCoordinators().subscribe({
      next: ({ users }) => {
        this.coordinators.set(
          users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            coordinatedProjectsCount: u.coordinatedProjectsCount,
          }))
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    if (!this.selectedId) return;
    this.saving.set(true);
    this.dialogRef.close({ coordinatorId: this.selectedId });
  }
}
