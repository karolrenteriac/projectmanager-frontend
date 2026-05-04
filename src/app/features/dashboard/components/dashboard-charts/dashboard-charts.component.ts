import { Component, OnInit, ViewChildren, QueryList, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { MatCardModule } from '@angular/material/card';

import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../../../services/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BaseChartDirective, MatCardModule],
  templateUrl: './dashboard-charts.component.html',
  styleUrl: './dashboard-charts.component.css'
})
export class DashboardChartsComponent implements OnInit {

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  public isLoading = true;
  private cdr = inject(ChangeDetectorRef);

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadData();
  }

  // 🔵 LINE CHART
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Project Progress (%)',
        fill: true,
        tension: 0.4,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        pointBackgroundColor: '#6366F1',
        pointBorderColor: '#fff',
      },
      {
        data: [],
        label: 'Tasks Completed',
        fill: true,
        tension: 0.4,
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: '#fff',
      }
    ]
  };

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  // 🟣 DONUT CHART
  public donutChartData: ChartData<'doughnut'> = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [],
        backgroundColor: ['#10B981', '#6366F1', '#EF4444'],
        hoverBackgroundColor: ['#059669', '#4F46E5', '#DC2626'],
        borderWidth: 0,
      }
    ]
  };

  public donutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 16
        }
      }
    }
  };

  // 🟢 BAR CHART
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'User Activity',
        backgroundColor: '#6366F1',
        borderRadius: 8,
        barThickness: 12
      }
    ]
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  // 🚀 CARGA DE DATOS
  private loadData(): void {
    this.isLoading = true;

    // 🔵 LINE CHART
    this.dashboardService.getProgress().subscribe({
      next: (res: any) => {

        this.lineChartData.labels = res?.months || res?.labels || [];

        this.lineChartData.datasets[0].data =
          res?.projectProgress || res?.datasets?.[0]?.data || [];

        this.lineChartData.datasets[1].data =
          res?.tasksCompleted || res?.datasets?.[1]?.data || [];

        this.updateCharts();
      },
      error: (err) => console.error('Error loading progress:', err)
    });

    // 🟣 DONUT CHART
    this.dashboardService.getTaskDistribution().subscribe({
      next: (res: any) => {

        this.donutChartData.labels = res?.labels || ['Completed', 'Pending', 'Overdue'];

        this.donutChartData.datasets[0].data =
          res?.data || [
            res?.completed || 0,
            res?.pending || 0,
            res?.overdue || 0
          ];

        this.updateCharts();
      },
      error: (err) => console.error('Error loading distribution:', err)
    });

    // 🟢 BAR CHART
    this.dashboardService.getUserActivity().subscribe({
      next: (res: any) => {

        this.barChartData.labels = res?.days || res?.labels || [];

        this.barChartData.datasets[0].data =
          res?.activity || res?.data || [];

        this.updateCharts();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading activity:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // 🔥 ACTUALIZAR TODOS LOS CHARTS
  private updateCharts(): void {
    if (this.charts) {
      this.charts.forEach(chart => chart.update());
    }
  }
}