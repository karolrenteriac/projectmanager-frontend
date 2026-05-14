import {
  Component,
  Inject,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  computed,
  WritableSignal,
  Signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { HttpEventType } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Task, TasksWorkspaceService } from '../../../services/tasks-workspace.service';
import { TaskFormDialog } from '../create-task-dialog/create-task-dialog';

export interface TaskDetailsDialogData {
  task: Task;
  currentUserId: string;
  currentUserRole: string;
}

// Accepted MIME types (must match backend upload.js ALLOWED_MIMES)
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

@Component({
  selector: 'app-task-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  templateUrl: './task-details-dialog.html',
  styleUrl: './task-details-dialog.css',
})
export class TaskDetailsDialog implements OnDestroy {
  // ─── Reactive state ───────────────────────────────────────────────────────
  // Initialized in constructor so that this.data is already assigned
  task!:           WritableSignal<Task>;
  isManager!:      Signal<boolean>;
  canUpload!:      Signal<boolean>;

  isUploading       = signal(false);
  uploadProgress    = signal(0);
  isDragOver        = signal(false);
  isSubmitting      = signal(false);
  isConfirmingDelete = signal(false);
  isDeleting        = signal(false);

  // ─── Forms ────────────────────────────────────────────────────────────────
  commentForm: FormGroup;

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private tasksService: TasksWorkspaceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<TaskDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDetailsDialogData
  ) {
    // data is available here — safe to reference in signal/computed initializers
    this.task = signal<Task>(this.data.task);

    this.isManager = computed(() =>
      ['admin', 'coordinator'].includes(this.data.currentUserRole)
    );

    this.canUpload = computed(() => {
      if (this.isManager()) return true;
      const t = this.task();
      const uid = this.data.currentUserId;
      return (t.assignedTo as any)?.id === uid || (t.createdBy as any)?.id === uid;
    });

    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Display helpers ──────────────────────────────────────────────────────

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getFileIcon(mimeType: string): string {
    if (!mimeType) return 'insert_drive_file';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table_chart';
    if (mimeType.includes('zip')) return 'folder_zip';
    if (mimeType === 'text/plain') return 'text_snippet';
    return 'insert_drive_file';
  }

  getFileIconColor(mimeType: string): string {
    if (!mimeType) return '#90a4ae';
    if (mimeType === 'application/pdf') return '#e53935';
    if (mimeType.startsWith('image/')) return '#8e24aa';
    if (mimeType.includes('word')) return '#1976d2';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '#2e7d32';
    if (mimeType.includes('zip')) return '#f57c00';
    return '#607d8b';
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1_024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  canDeleteEvidence(evidence: any): boolean {
    if (this.isManager()) return true;
    return evidence?.uploadedBy?.id === this.data.currentUserId;
  }

  // ─── File upload — drag & drop events ────────────────────────────────────

  triggerFileInput(): void {
    console.log('[TaskDetailsDialog] triggerFileInput called');
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    console.log('[TaskDetailsDialog] Files selected via input:', files.map(f => f.name));
    this.validateAndUpload(files);
    input.value = ''; // reset so same file can be re-selected
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (!files.length) return;
    console.log('[TaskDetailsDialog] Files dropped:', files.map(f => f.name));
    this.validateAndUpload(files);
  }

  // ─── File validation ──────────────────────────────────────────────────────

  private validateAndUpload(files: File[]): void {
    for (const file of files) {
      if (!ALLOWED_MIMES.includes(file.type)) {
        this.snackBar.open(
          `"${file.name}" has an unsupported file type. Allowed: PDF, DOCX, XLSX, PNG, JPG, ZIP, TXT`,
          'Dismiss',
          { duration: 5000, panelClass: ['snack-error'] }
        );
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        this.snackBar.open(
          `"${file.name}" exceeds the 25 MB limit (${this.formatFileSize(file.size)})`,
          'Dismiss',
          { duration: 5000, panelClass: ['snack-error'] }
        );
        return;
      }
    }
    this.doUpload(files);
  }

  // ─── Actual upload via FormData + progress tracking ───────────────────────

  private doUpload(files: File[]): void {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    console.log('[TaskDetailsDialog] Uploading', files.length, 'file(s) to task', this.task().id);

    this.tasksService.uploadEvidence(this.task().id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const pct = Math.round(100 * (event.loaded / (event.total ?? event.loaded)));
            this.uploadProgress.set(pct);
            console.log('[TaskDetailsDialog] Upload progress:', pct + '%');
          } else if (event.type === HttpEventType.Response) {
            const body = event.body as { task: Task; uploaded: number };
            console.log('[TaskDetailsDialog] Upload complete — task:', body.task, 'uploaded:', body.uploaded);
            this.task.set(body.task);
            this.isUploading.set(false);
            this.snackBar.open(
              `${body.uploaded} file${body.uploaded !== 1 ? 's' : ''} uploaded successfully`,
              'Close',
              { duration: 3000, panelClass: ['snack-success'] }
            );
          }
        },
        error: (err) => {
          console.error('[TaskDetailsDialog] Upload error:', err);
          this.isUploading.set(false);
          const msg = err?.error?.message ?? 'Upload failed. Please try again.';
          this.snackBar.open(msg, 'Dismiss', { duration: 5000, panelClass: ['snack-error'] });
        }
      });
  }

  // ─── Delete evidence ──────────────────────────────────────────────────────

  deleteEvidence(evidenceId: string, filename: string): void {
    console.log('[TaskDetailsDialog] Deleting evidence', evidenceId, filename);
    this.tasksService.deleteEvidence(this.task().id, evidenceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTask) => {
          this.task.set(updatedTask);
          this.snackBar.open('File deleted', 'Close', { duration: 2500 });
        },
        error: (err) => {
          console.error('[TaskDetailsDialog] Delete evidence error:', err);
          this.snackBar.open(
            err?.error?.message ?? 'Could not delete file',
            'Dismiss',
            { duration: 4000, panelClass: ['snack-error'] }
          );
        }
      });
  }

  // ─── Task actions ─────────────────────────────────────────────────────────

  updateStatus(status: string): void {
    this.isSubmitting.set(true);
    this.tasksService.updateTaskStatus(this.task().id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('[TaskDetailsDialog] Status update error:', err);
          this.snackBar.open(err?.error?.message ?? 'Status update failed', 'Dismiss', { duration: 4000 });
        }
      });
  }

  submitForReview(): void {
    this.isSubmitting.set(true);
    this.tasksService.submitForReview(this.task().id, { comment: 'Submitted for review.' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('[TaskDetailsDialog] Submit for review error:', err);
          this.snackBar.open(err?.error?.message ?? 'Submission failed', 'Dismiss', { duration: 4000 });
        }
      });
  }

  reviewTask(approved: boolean): void {
    const comment = approved ? 'Task approved.' : 'Task rejected — please revise.';
    this.isSubmitting.set(true);
    this.tasksService.reviewTask(this.task().id, { approved, comment })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('[TaskDetailsDialog] Review error:', err);
          this.snackBar.open(err?.error?.message ?? 'Review failed', 'Dismiss', { duration: 4000 });
        }
      });
  }

  // ─── Edit form ────────────────────────────────────────────────────────────────

  /** Returns true if the current user may edit this task */
  canEdit(): boolean {
    if (this.isManager()) return true;
    const t = this.task();
    const uid = this.data.currentUserId;
    return (t.assignedTo as any)?.id === uid || (t.createdBy as any)?.id === uid;
  }

  private getProjectId(): string {
    const p = this.task().project;
    if (!p) return '';
    if (typeof p === 'string') return p;
    return (p as any).id || (p as any)._id || '';
  }

  openEditForm(): void {
    const projectId = this.getProjectId();
    const formRef = this.dialog.open(TaskFormDialog, {
      width: '640px',
      data: {
        mode: 'edit',
        projectId,
        task: this.task(),
        currentUserId: this.data.currentUserId,
        currentUserRole: this.data.currentUserRole,
      },
    });

    formRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (!result) return;
        const { taskId, payload } = result;
        this.tasksService.updateTask(taskId, payload)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedTask) => {
              this.task.set(updatedTask);
              this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
              console.log('[TaskDetailsDialog] Task updated:', updatedTask.id);
            },
            error: (err) => {
              console.error('[TaskDetailsDialog] Update error:', err);
              this.snackBar.open(
                err?.error?.message ?? 'Update failed',
                'Dismiss',
                { duration: 4000 }
              );
            },
          });
      });
  }

  addComment(): void {
    if (this.commentForm.invalid) return;
    const content: string = this.commentForm.value.content.trim();
    this.tasksService.addComment(this.task().id, content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTask) => {
          this.task.set(updatedTask);
          this.commentForm.reset();
        },
        error: (err) => {
          console.error('[TaskDetailsDialog] Add comment error:', err);
          this.snackBar.open(err?.error?.message ?? 'Failed to add comment', 'Dismiss', { duration: 4000 });
        }
      });
  }

  // ─── Delete task ──────────────────────────────────────────────────────────

  confirmDelete(): void {
    this.isConfirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.isConfirmingDelete.set(false);
  }

  deleteTask(): void {
    this.isDeleting.set(true);
    this.tasksService.deleteTask(this.task().id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.snackBar.open('Task deleted', 'Close', { duration: 2500 });
          this.dialogRef.close('deleted');
        },
        error: (err) => {
          this.isDeleting.set(false);
          console.error('[TaskDetailsDialog] Delete task error:', err);
          this.snackBar.open(err?.error?.message ?? 'Could not delete task', 'Dismiss', { duration: 4000, panelClass: ['snack-error'] });
          this.isConfirmingDelete.set(false);
        }
      });
  }
}
