import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  template: `
    <div class="logo-container">
      <mat-icon color="primary" class="logo-icon">layers</mat-icon>
      <span class="logo-text">SaaSBase</span>
    </div>
    <mat-nav-list class="nav-list">
      @for (item of menuItems; track item.route) {
        <a mat-list-item [routerLink]="item.route" routerLinkActive="active-nav-item" (click)="onNavClick()">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <div matListItemTitle>{{ item.label }}</div>
        </a>
      }
    </mat-nav-list>
  `,
  styles: [`
    .logo-container {
      display: flex;
      align-items: center;
      padding: 24px 16px;
      gap: 12px;
    }
    .logo-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      letter-spacing: -0.5px;
    }
    .nav-list {
      padding-top: 0;
    }
    .nav-list a {
      margin: 4px 12px;
      border-radius: var(--border-radius-md, 8px);
    }
    .active-nav-item {
      background-color: var(--mat-sys-secondary-container, #e2e8f0);
      color: var(--mat-sys-on-secondary-container, #0f172a);
      font-weight: 600;
    }
  `]
})
export class SidebarComponent {
  @Output() navClick = new EventEmitter<void>();

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Projects', icon: 'folder', route: '/projects' },
    { label: 'Tasks', icon: 'task', route: '/tasks' },
    { label: 'Calendar', icon: 'calendar_today', route: '/calendar' },
    { label: 'Documents', icon: 'description', route: '/documents' },
    { label: 'Chat', icon: 'chat', route: '/chat' },
    { label: 'Reports', icon: 'assessment', route: '/reports' },
    { label: 'Settings', icon: 'settings', route: '/settings' }
  ];

  onNavClick() {
    if (window.innerWidth < 960) {
      this.navClick.emit();
    }
  }
}
