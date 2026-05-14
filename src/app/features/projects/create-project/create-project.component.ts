import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectService, User } from '../../../services/project.service';

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
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.css',
})
export class CreateProjectComponent implements OnInit {
  projectForm: FormGroup;
  isLoading = false;
  usersLoading = false;

  coordinators: User[] = [];
  principals: User[] = [];
  coResearcherUsers: User[] = [];

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
      status: ['planning'],
      progress: [0, [Validators.min(0), Validators.max(100)]],
      projectCoordinator: ['', Validators.required],
      principalResearchers: [[], Validators.required],
      coResearchers: [[]],
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

  loadUsers(): void {
    this.usersLoading = true;
    this.projectService.getUsers().subscribe({
      next: (users) => {
        const all = users || [];
        this.coordinators = all.filter((u) => u.role === 'coordinator');
        this.principals = all.filter((u) => u.role === 'principal');
        this.coResearcherUsers = all.filter((u) => u.role === 'co-researcher');
        this.usersLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.usersLoading = false;
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      },
    });
  }

  loadProject(): void {
    if (!this.projectId) return;
    this.isLoading = true;
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        const coordId =
          (project.projectCoordinator as any)?._id ||
          (project.projectCoordinator as any)?.id ||
          project.projectCoordinator || '';

        this.projectForm.patchValue({
          title: project.title || '',
          description: project.description || '',
          objectives: project.objectives || '',
          startDate: project.startDate ? new Date(project.startDate) : null,
          endDate: project.endDate ? new Date(project.endDate) : null,
          status: project.status || 'planning',
          progress: project.progress || 0,
          projectCoordinator: coordId,
          principalResearchers: (project.principalResearchers || []).map(
            (m: any) => m._id || m.id || m
          ),
          coResearchers: (project.coResearchers || []).map(
            (m: any) => m._id || m.id || m
          ),
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load project', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const raw = this.projectForm.value;

    const payload = {
      title: raw.title.trim(),
      description: raw.description || '',
      objectives: raw.objectives || '',
      startDate: raw.startDate ? new Date(raw.startDate).toISOString() : null,
      endDate: raw.endDate ? new Date(raw.endDate).toISOString() : null,
      status: raw.status || 'planning',
      progress: Number(raw.progress) || 0,
      projectCoordinator: raw.projectCoordinator,
      principalResearchers: Array.isArray(raw.principalResearchers)
        ? raw.principalResearchers.map(String)
        : [],
      coResearchers: Array.isArray(raw.coResearchers)
        ? raw.coResearchers.map(String)
        : [],
    };

    if (this.isEditMode && this.projectId) {
      this.projectService.updateProject(this.projectId, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackBar.open('Project updated successfully!', 'OK', { duration: 3000 });
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackBar.open(err.error?.message || 'Error updating project', 'Close', { duration: 5000 });
        },
      });
    } else {
      this.projectService.createProject(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackBar.open('Project created successfully!', 'OK', { duration: 3000 });
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackBar.open(err.error?.message || 'Error creating project', 'Close', { duration: 5000 });
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }

  getUserInitial(user: User): string {
    return user?.name?.charAt(0)?.toUpperCase() || '?';
  }

  getPrincipalName(id: string): string {
    return this.principals.find((u) => (u._id || u.id) === id)?.name || id;
  }

  getCoResearcherName(id: string): string {
    return this.coResearcherUsers.find((u) => (u._id || u.id) === id)?.name || id;
  }
}
