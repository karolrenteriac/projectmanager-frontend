import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatBadgeModule],
  template: `
    <mat-toolbar class="topbar">
      <button mat-icon-button (click)="toggleSidenav.emit()" aria-label="Toggle sidenav" class="menu-button">
        <mat-icon>menu</mat-icon>
      </button>
      
      <div class="search-container">
        <div class="search-box">
          <mat-icon class="search-icon">search</mat-icon>
          <input placeholder="Search everywhere..." class="search-input" />
        </div>
      </div>
      
      <span class="spacer"></span>
      
      <button mat-icon-button (click)="themeService.toggleTheme()" aria-label="Toggle Theme" class="nav-button">
        <mat-icon>{{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>
      
      <button mat-icon-button aria-label="Notifications" (click)="goToNotifications()" class="nav-button notification-btn">
        <mat-icon aria-hidden="false" [matBadge]="notificationCount > 0 ? notificationCount : null" matBadgeColor="warn">notifications</mat-icon>
      </button>

      <button mat-icon-button class="avatar-btn">
        <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" class="avatar" />
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .topbar {
      background-color: var(--mat-sys-surface, #ffffff);
      border-bottom: 1px solid var(--mat-sys-outline-variant, #e2e8f0);
      box-shadow: none;
      height: 64px;
      padding: 0 16px;
    }
    .menu-button {
      margin-right: 8px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .search-container {
      margin-left: 16px;
      flex: 1;
      max-width: 400px;
    }
    .search-box {
      display: flex;
      align-items: center;
      background-color: var(--mat-sys-surface-container-high, #f1f5f9);
      border-radius: 20px;
      padding: 0 16px;
      height: 40px;
      transition: background-color 0.2s;
    }
    .search-box:focus-within {
      background-color: var(--mat-sys-surface-container-highest, #e2e8f0);
    }
    .search-icon {
      color: var(--mat-sys-on-surface-variant);
      margin-right: 8px;
    }
    .search-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      color: var(--mat-sys-on-surface);
      font-size: 14px;
    }
    .search-input::placeholder {
      color: var(--mat-sys-on-surface-variant);
    }
    .nav-button {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .nav-button:hover {
      background-color: rgba(0, 0, 0, 0.04);
      transform: scale(1.1);
    }
    .notification-btn:hover mat-icon {
      color: #6366f1;
    }
    .avatar-btn {
      margin-left: 8px;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid transparent;
      transition: border-color 0.3s;
    }
    .avatar-btn:hover .avatar {
      border-color: #6366f1;
    }
    @media (max-width: 599px) {
      .search-container {
        display: none;
      }
    }
  `]
})
export class TopbarComponent implements OnInit {
  @Output() toggleSidenav = new EventEmitter<void>();
  
  themeService = inject(ThemeService);
  private router = inject(Router);
  private dashboardService = inject(DashboardService);

  notificationCount = 0;

  ngOnInit(): void {
    this.loadNotificationCount();
  }

  loadNotificationCount(): void {
    this.dashboardService.getNotifications().subscribe({
      next: (data) => {
        this.notificationCount = data?.length || 0;
      },
      error: () => {
        this.notificationCount = 0;
      }
    });
  }

  goToNotifications(): void {
    this.router.navigate(['/dashboard/notifications']);
  }
}
