import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saas-card">
      <h1>Calendar</h1>
      <p>View your upcoming events and deadlines.</p>
    </div>
  `
})
export class CalendarComponent {}
