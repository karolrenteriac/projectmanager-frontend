import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saas-card">
      <h1>Tasks</h1>
      <p>Keep track of your tasks and to-dos.</p>
    </div>
  `
})
export class TasksComponent {}
