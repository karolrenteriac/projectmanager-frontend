import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Output() navClick = new EventEmitter<void>();

  private authService = inject(AuthService);

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

  ngOnInit() {
    const user = this.authService.getUser();

    // 🔥 SOLO ADMIN VE INVITATIONS
    if (user && user.role === 'admin') {
      this.menuItems.splice(1, 0, {
        label: 'Invitations',
        icon: 'mail',
        route: '/invitations'
      });
    }
  }

  onNavClick() {
    if (window.innerWidth < 960) {
      this.navClick.emit();
    }
  }
}