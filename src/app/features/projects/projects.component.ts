import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="projects-container">
      <header class="projects-header">
        <div class="header-info">
          <h1>Projects</h1>
          <p>Manage all your ongoing and completed projects.</p>
        </div>
        <button mat-flat-button color="primary" (click)="createNewProject()">
          <mat-icon>add</mat-icon>
          <span>New Project</span>
        </button>
      </header>

      <div class="saas-card">
        <p>Your projects list will appear here.</p>
      </div>
    </div>
  `,
  styles: [`
    .projects-container {
      padding: 2rem;
    }
    .projects-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .header-info h1 {
      font-size: 1.875rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .header-info p {
      color: #64748b;
    }
    button[color="primary"] {
      background-color: #6366f1;
    }
    .saas-card {
      background: white;
      padding: 3rem;
      border-radius: 16px;
      text-align: center;
      border: 1px solid rgba(0,0,0,0.05);
      color: #64748b;
    }
  `]
})
export class ProjectsComponent {
  constructor(private router: Router) {}

  createNewProject() {
    this.router.navigate(['/projects/new']);
  }
}
