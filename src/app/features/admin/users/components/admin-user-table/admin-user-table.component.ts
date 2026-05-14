import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AdminUser, UserRole } from '../../../services/admin-user.service';

@Component({
  selector: 'app-admin-user-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './admin-user-table.component.html',
  styleUrl: './admin-user-table.component.css',
})
export class AdminUserTableComponent {
  @Input() users: AdminUser[] = [];
  @Input() totalCount = 0;
  @Input() loading = false;
  @Input() pageIndex = 0;
  @Input() pageSize = 20;

  @Output() pageChange    = new EventEmitter<PageEvent>();
  @Output() roleChange    = new EventEmitter<{ userId: string; role: UserRole }>();
  @Output() statusChange  = new EventEmitter<{ userId: string; isActive: boolean }>();
  @Output() viewProfile   = new EventEmitter<string>();

  displayedColumns = ['avatar', 'name', 'role', 'status', 'projects', 'tasks', 'createdAt', 'actions'];

  readonly availableRoles: { value: UserRole; label: string }[] = [
    { value: 'admin',         label: 'Admin' },
    { value: 'coordinator',   label: 'Coordinator' },
    { value: 'principal',     label: 'Principal' },
    { value: 'co-researcher', label: 'Co-Researcher' },
  ];

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  onPage(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onRoleChange(user: AdminUser, role: UserRole): void {
    this.roleChange.emit({ userId: user.id, role });
  }

  onToggleStatus(user: AdminUser): void {
    this.statusChange.emit({ userId: user.id, isActive: !user.isActive });
  }

  onViewProfile(userId: string): void {
    this.viewProfile.emit(userId);
  }
}
