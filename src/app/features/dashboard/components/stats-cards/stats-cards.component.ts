import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DashboardService } from '../../../../services/dashboard.service';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTooltipModule],
  templateUrl: './stats-cards.component.html',
  styleUrl: './stats-cards.component.css'
})
export class StatsCardsComponent implements OnInit {
  // Essential variables for data tracking (as requested)
  projects = 0;
  tasks = 0;
  users = 0;
  progress = 0;

  // Stats array initialized with default values to ensure immediate rendering
  stats: any[] = [
    {
      title: 'Total Projects',
      value: 0,
      trend: '0%',
      trendPositive: true,
      subtitle: 'No data yet',
      icon: 'folder',
      color: '#6366F1',
      route: '/projects',
      tooltip: 'Total number of active and archived projects',
      sparkline: [0, 0, 0, 0, 0, 0, 0]
    },
    {
      title: 'Total Tasks',
      value: 0,
      trend: '0%',
      trendPositive: true,
      subtitle: 'No data yet',
      icon: 'assignment',
      color: '#8B5CF6',
      route: '/tasks',
      tooltip: 'Tasks assigned to your teams',
      sparkline: [0, 0, 0, 0, 0, 0, 0]
    },
    {
      title: 'Active Users',
      value: 0,
      trend: '0%',
      trendPositive: true,
      subtitle: 'No data yet',
      icon: 'people',
      color: '#06B6D4',
      route: '/users',
      tooltip: 'Currently active users in the system',
      sparkline: [0, 0, 0, 0, 0, 0, 0]
    },
    {
      title: 'Overall Progress',
      value: '0%',
      trend: '0%',
      trendPositive: true,
      subtitle: 'No data yet',
      icon: 'trending_up',
      color: '#10B981',
      route: '/reports',
      tooltip: 'Average completion rate across all projects',
      sparkline: [0, 0, 0, 0, 0, 0, 0]
    }
  ];

  constructor(private router: Router, private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.dashboardService.getSummary().subscribe({
      next: (data: any) => {
        // Safe data assignment as requested
        this.projects = data?.totalProjects ?? 0;
        this.tasks = data?.totalTasks ?? 0;
        this.users = data?.activeUsers ?? 0;
        this.progress = data?.progress ?? 0;

        // Map to stats array for UI rendering
        this.updateUI(data);
      },
      error: (err) => {
        console.error('Error loading stats summary:', err);
        // Stats remain with default 0 values, cards stay visible
      }
    });
  }

  private updateUI(data: any): void {
    if (!data) return;

    // Projects Card
    this.stats[0].value = data.totalProjects ?? 0;
    this.stats[0].trend = `${data.projectsTrend >= 0 ? '+' : ''}${data.projectsTrend ?? 0}%`;
    this.stats[0].trendPositive = (data.projectsTrend ?? 0) >= 0;
    this.stats[0].subtitle = data.totalProjects > 0 ? 'vs last month' : 'No data yet';

    // Tasks Card
    this.stats[1].value = data.totalTasks ?? 0;
    this.stats[1].trend = `${data.tasksTrend >= 0 ? '+' : ''}${data.tasksTrend ?? 0}%`;
    this.stats[1].trendPositive = (data.tasksTrend ?? 0) >= 0;
    this.stats[1].subtitle = data.totalTasks > 0 ? 'vs last week' : 'No data yet';

    // Users Card
    this.stats[2].value = data.activeUsers ?? 0;
    this.stats[2].trend = `${data.usersTrend >= 0 ? '+' : ''}${data.usersTrend ?? 0}%`;
    this.stats[2].trendPositive = (data.usersTrend ?? 0) >= 0;
    this.stats[2].subtitle = data.activeUsers > 0 ? 'since yesterday' : 'No data yet';

    // Progress Card
    this.stats[3].value = `${data.progress ?? 0}%`;
    this.stats[3].trend = `${data.progressTrend >= 0 ? '+' : ''}${data.progressTrend ?? 0}%`;
    this.stats[3].trendPositive = (data.progressTrend ?? 0) >= 0;
    this.stats[3].subtitle = (data.progress ?? 0) > 0 ? 'from last update' : 'No data yet';
  }

  navigateTo(route: string) {
    if (route) {
      this.router.navigate([route]);
    }
  }

  getSparklinePoints(data: number[]): string {
    const width = 100;
    const height = 30;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1; 
    
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  }
}
