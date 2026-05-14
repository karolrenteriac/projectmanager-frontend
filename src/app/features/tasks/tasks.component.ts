import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ProjectService, Project } from '../../services/project.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatRippleModule
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  isLoading = true;
  searchTerm = '';

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadProjects();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.loadProjects(term);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects(search: string = ''): void {
    this.isLoading = true;
    this.projectService.getProjects(search).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.projects = res.projects || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  selectProject(project: Project): void {
    const id = project.id || project._id;
    this.router.navigate(['/tasks', id]);
  }
}
