import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saas-card">
      <h1>Projects</h1>
      <p>Manage all your ongoing projects here.</p>
    </div>
  `
})
export class ProjectsComponent {}
