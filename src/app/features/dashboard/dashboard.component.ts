import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsCardsComponent } from './components/stats-cards/stats-cards.component';
import { DashboardChartsComponent } from './components/dashboard-charts/dashboard-charts.component';
import { NotificationsPanelComponent } from './components/notifications-panel/notifications-panel.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatsCardsComponent,
    DashboardChartsComponent,
    NotificationsPanelComponent
  ],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-info">
          <h1>Dashboard Overview</h1>

          <!-- 🔥 TEXTO DINÁMICO -->
          <p>
            Welcome back, <strong>{{ userName }}</strong>  <br />
            Here's what's happening with your projects today.
          </p>
        </div>
      </header>

      <section class="stats-section">
        <app-stats-cards></app-stats-cards>
      </section>

      <div class="dashboard-main-grid">
        <div class="analytics-column">
          <app-dashboard-charts></app-dashboard-charts>
        </div>

        <div class="side-column">
          <app-notifications-panel></app-notifications-panel>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
      background-color: #f8fafc;
      min-height: 100vh;
    }

    .dashboard-header {
      margin-bottom: 2.5rem;
    }

    .dashboard-header h1 {
      font-size: 1.875rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .dashboard-header p {
      color: #64748b;
      font-size: 1rem;
      line-height: 1.5;
    }

    .dashboard-header strong {
      color: #6366f1;
      font-weight: 700;
    }

    .dashboard-main-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    @media (min-width: 1280px) {
      .dashboard-main-grid {
        grid-template-columns: 3fr 1fr;
      }
    }

    .analytics-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .side-column {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class DashboardComponent implements OnInit {

  userName: string = '';

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName = user?.name || 'User';
  }
}