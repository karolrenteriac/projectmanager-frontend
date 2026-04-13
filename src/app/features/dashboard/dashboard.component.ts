import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saas-card">
      <h1>Dashboard</h1>
      <p>Welcome back! Here is an overview of your activity.</p>
    </div>
  `
})
export class DashboardComponent {}
