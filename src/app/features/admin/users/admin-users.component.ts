import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import {
  AdminUserService,
  AdminUser,
  AdminUserFilters,
  OrgStats,
  UserRole,
} from '../services/admin-user.service';
import { AdminUserFiltersComponent } from './components/admin-user-filters/admin-user-filters.component';
import { AdminUserTableComponent } from './components/admin-user-table/admin-user-table.component';
import { AdminUserProfileDialogComponent } from './components/admin-user-profile-dialog/admin-user-profile-dialog.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    AdminUserFiltersComponent,
    AdminUserTableComponent,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
})
export class AdminUsersComponent implements OnInit {
  users   = signal<AdminUser[]>([]);
  total   = signal(0);
  loading = signal(true);
  stats   = signal<OrgStats | null>(null);

  page  = signal(0);
  limit = signal(20);

  private filters = signal<Partial<AdminUserFilters>>({});

  roleGroups = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const order: UserRole[] = ['admin', 'coordinator', 'principal', 'co-researcher'];
    return order.map(r => ({
      role: r,
      total: s.byRole[r]?.total ?? 0,
      active: s.byRole[r]?.active ?? 0,
    }));
  });

  constructor(
    private adminUserService: AdminUserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.adminUserService
      .getUsers(this.filters(), this.page() + 1, this.limit())
      .subscribe({
        next: ({ users, pagination, stats }) => {
          this.users.set(users);
          this.total.set(pagination.total);
          this.stats.set(stats);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Failed to load users', 'Dismiss', { duration: 4000 });
          this.cdr.markForCheck();
        },
      });
  }

  onFiltersChange(f: AdminUserFilters): void {
    this.filters.set(f);
    this.page.set(0);
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.limit.set(event.pageSize);
    this.load();
  }

  onViewProfile(userId: string): void {
    const ref = this.dialog.open(AdminUserProfileDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { userId },
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.action === 'roleChanged') {
        this.users.update(list =>
          list.map(u => u.id === result.userId ? { ...u, role: result.role } : u)
        );
        this.cdr.markForCheck();
        this.load(); // refresh stats
      } else if (result.action === 'statusChanged') {
        this.users.update(list =>
          list.map(u => u.id === result.userId ? { ...u, isActive: result.isActive } : u)
        );
        this.cdr.markForCheck();
        this.load(); // refresh stats
      }
    });
  }

  onRoleChange(event: { userId: string; role: UserRole }): void {
    this.adminUserService.updateUserRole(event.userId, event.role).subscribe({
      next: ({ user: updated }) => {
        this.users.update(list =>
          list.map(u => u.id === updated.id ? { ...u, role: updated.role } : u)
        );
        this.snackBar.open(`Role updated to ${updated.role}`, 'Close', { duration: 3000 });
        this.cdr.markForCheck();
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Role update failed', 'Dismiss', { duration: 4000 });
      },
    });
  }

  onStatusChange(event: { userId: string; isActive: boolean }): void {
    this.adminUserService.updateUserStatus(event.userId, event.isActive).subscribe({
      next: ({ user: updated }) => {
        this.users.update(list =>
          list.map(u => u.id === updated.id ? { ...u, isActive: updated.isActive } : u)
        );
        const label = updated.isActive ? 'activated' : 'deactivated';
        this.snackBar.open(`User ${label}`, 'Close', { duration: 3000 });
        this.cdr.markForCheck();
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Status update failed', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
