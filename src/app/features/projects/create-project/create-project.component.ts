import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
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
import { Router, ActivatedRoute } from '@angular/router';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.css'
})
export class CreateProjectComponent implements OnInit {
  projectForm: FormGroup;
  isLoading = false;
  users: User[] = [];

  isEditMode = false;
  projectId: string | null = null;
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      objectives: [''],
      startDate: [null],
      endDate: [null],
      members: [[]],
      status: ['planning'],
      progress: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();

    this.projectId = this.route.snapshot.paramMap.get('id');

    if (this.projectId) {
      this.isEditMode = true;
      this.loadProject();
    }
  }

  loadProject() {
    if (!this.projectId) return;

    this.isLoading = true;

    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        this.projectForm.patchValue({
          title: project.title || '',
          description: project.description || '',
          objectives: project.objectives || '',
          startDate: project.startDate ? new Date(project.startDate) : null,
          endDate: project.endDate ? new Date(project.endDate) : null,
          members: (project.members || []).map((m: any) => m._id || m),
          status: project.status || 'planning',
          progress: project.progress || 0
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("ERROR loading project:", err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadUsers(): void {
    this.projectService.getUsers().subscribe({
      next: (data) => {
        this.users = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const rawValue = this.projectForm.value;

    const projectData: Project = {
      title: rawValue.title.trim(),
      description: rawValue.description || '',
      objectives: rawValue.objectives || '',
      startDate: rawValue.startDate ? new Date(rawValue.startDate).toISOString() : null,
      endDate: rawValue.endDate ? new Date(rawValue.endDate).toISOString() : null,
      members: (Array.isArray(rawValue.members) ? rawValue.members : []).map((m: any) => String(m)),
      status: rawValue.status || 'planning',
      progress: Number(rawValue.progress) || 0
    };

    if (this.isEditMode && this.projectId) {
      this.projectService.updateProject(this.projectId, projectData).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackBar.open('Project updated successfully!', 'OK', { duration: 3000 });
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackBar.open(err.error?.message || 'Error updating project', 'Close');
        }
      });
    } else {
      this.projectService.createProject(projectData).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackBar.open('Project created successfully!', 'OK', { duration: 3000 });
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackBar.open(err.error?.message || 'Error creating project', 'Close');
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }
}