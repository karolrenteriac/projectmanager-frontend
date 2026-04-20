import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProjectService, Project, User } from '../../../services/project.service';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.css'
})
export class CreateProjectComponent implements OnInit {
  projectForm: FormGroup;
  isLoading = false;
  users: User[] = [];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      objectives: [''],
      startDate: [null],
      endDate: [null],
      members: [[]] // Initialized as empty array
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.projectService.getUsers().subscribe({
      next: (data) => {
        this.users = data || [];
        console.log("Team members available:", this.users.length);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.snackBar.open('Failed to load team members', 'Close', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // Prepare data ensuring strictly correct formats
    const rawValue = this.projectForm.value;
    
    const projectData: Project = {
      title: rawValue.title.trim(),
      description: rawValue.description || '',
      objectives: rawValue.objectives || '',
      startDate: rawValue.startDate ? new Date(rawValue.startDate).toISOString() : null,
      endDate: rawValue.endDate ? new Date(rawValue.endDate).toISOString() : null,
      // CRITICAL: Ensure members is always an array of IDs (strings)
      members: Array.isArray(rawValue.members) ? rawValue.members : []
    };

    console.log("Sending project data:", projectData);

    this.projectService.createProject(projectData).subscribe({
      next: (project) => {
        this.isLoading = false;
        this.snackBar.open('Project created successfully!', 'Success', { duration: 3000 });
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err.error?.message || 'Server error creating project';
        this.snackBar.open(errorMessage, 'Error', { duration: 5000 });
        console.error("Backend Error:", err);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }
}
