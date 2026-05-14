import {
  Component,
  Inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import {
  AdminUserService,
  AdminUserDetail,
  UserRole,
} from '../../../services/admin-user.service';

export interface AdminUserProfileDialogData {
  userId: string;
}

@Component({
  selector: 'app-admin-user-profile-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './admin-user-profile-dialog.component.html',
  styleUrl: './admin-user-profile-dialog.component.css',
})
export class AdminUserProfileDialogComponent implements OnInit {
  user = signal<AdminUserDetail | null>(null);
  loading = signal(true);
  savingRole = signal(false);
  savingStatus = signal(false);
  selectedRole = signal<UserRole>('principal');

  readonly roles: { value: UserRole; label: string }[] = [
    { value: 'admin',         label: 'Admin' },
    { value: 'coordinator',   label: 'Coordinator' },
    { value: 'principal',     label: 'Principal' },
    { value: 'co-researcher', label: 'Co-Researcher' },
  ];

  get selectedRoleValue(): UserRole { return this.selectedRole(); }
  set selectedRoleValue(v: UserRole) { this.selectedRole.set(v); }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdminUserProfileDialogData,
    public dialogRef: MatDialogRef<AdminUserProfileDialogComponent>,
    private adminUserService: AdminUserService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  private loadUser(): void {
    this.loading.set(true);
    this.adminUserService.getUserById(this.data.userId).subscribe({
      next: ({ user }) => {
        this.user.set(user);
        this.selectedRole.set(user.role);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load user profile', 'Dismiss', { duration: 4000 });
      },
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  changeRole(): void {
    const u = this.user();
    if (!u || this.selectedRole() === u.role) return;
    this.savingRole.set(true);
    this.adminUserService.updateUserRole(u.id, this.selectedRole()).subscribe({
      next: ({ user: updated }) => {
        this.user.update(prev => prev ? { ...prev, role: updated.role } : prev);
        this.savingRole.set(false);
        this.snackBar.open(`Role updated to ${updated.role}`, 'Close', { duration: 3000 });
        this.dialogRef.close({ action: 'roleChanged', userId: u.id, role: updated.role });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.savingRole.set(false);
        this.snackBar.open(err?.error?.message ?? 'Role update failed', 'Dismiss', { duration: 4000 });
      },
    });
  }

  toggleStatus(): void {
    const u = this.user();
    if (!u) return;
    this.savingStatus.set(true);
    const newStatus = !u.isActive;
    this.adminUserService.updateUserStatus(u.id, newStatus).subscribe({
      next: ({ user: updated }) => {
        this.user.update(prev => prev ? { ...prev, isActive: updated.isActive } : prev);
        this.savingStatus.set(false);
        const label = updated.isActive ? 'activated' : 'deactivated';
        this.snackBar.open(`User ${label}`, 'Close', { duration: 3000 });
        this.dialogRef.close({ action: 'statusChanged', userId: u.id, isActive: updated.isActive });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.savingStatus.set(false);
        this.snackBar.open(err?.error?.message ?? 'Status update failed', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
