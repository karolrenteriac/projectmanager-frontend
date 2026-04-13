import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saas-card">
      <h1>Reports</h1>
      <p>Analyze performance metrics and generated reports.</p>
    </div>
  `
})
export class ReportsComponent {}
