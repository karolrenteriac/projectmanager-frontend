import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService } from '../../../../services/dashboard.service';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './notifications-panel.component.html',
  styleUrl: './notifications-panel.component.css'
})
export class NotificationsPanelComponent implements OnInit {
  notifications: any[] = [];
  private cdr = inject(ChangeDetectorRef);

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.fetchNotifications();
  }

  fetchNotifications(): void {
    this.dashboardService.getNotifications().subscribe({
      next: (data: any) => {
        this.notifications = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
      }
    });
  }
}
