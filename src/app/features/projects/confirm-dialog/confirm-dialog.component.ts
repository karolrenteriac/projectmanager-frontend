import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-icon-wrapper">
        <mat-icon class="dialog-icon">warning_amber</mat-icon>
      </div>
      <h2 class="dialog-title">{{ data.title }}</h2>
      <p class="dialog-message">{{ data.message }}</p>
      <div class="dialog-actions">
        <button mat-stroked-button class="btn-cancel" (click)="onCancel()" id="btn-confirm-cancel">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-flat-button class="btn-confirm" (click)="onConfirm()" id="btn-confirm-delete">
          <mat-icon>delete_outline</mat-icon>
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 1.5rem;
      text-align: center;
    }

    .dialog-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .dialog-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #ef4444;
    }

    .dialog-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem;
    }

    .dialog-message {
      font-size: 0.9375rem;
      color: #64748b;
      line-height: 1.6;
      margin: 0 0 1.5rem;
    }

    .dialog-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .btn-cancel {
      border-radius: 10px !important;
      padding: 0 24px !important;
      height: 40px !important;
      font-weight: 600 !important;
      border-color: #e2e8f0 !important;
      color: #64748b !important;
    }

    .btn-confirm {
      border-radius: 10px !important;
      padding: 0 24px !important;
      height: 40px !important;
      font-weight: 600 !important;
      background: linear-gradient(135deg, #ef4444, #dc2626) !important;
      color: #fff !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn-confirm mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .btn-confirm:hover {
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
