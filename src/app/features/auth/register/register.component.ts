import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="auth-wrapper">
      <mat-card class="saas-card auth-card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Join your workspace</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="name" placeholder="Jane Doe" />
              <mat-error *ngIf="registerForm.get('name')?.hasError('required')">Name is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="you@example.com" />
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">Invalid email format</mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>

            <button mat-flat-button color="primary" type="submit" class="full-width submit-btn" [disabled]="registerForm.invalid || isLoading">
              {{ isLoading ? 'Registering...' : 'Register' }}
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions class="auth-actions">
          <span>Already have an account? <a routerLink="/auth/login">Sign in</a></span>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--mat-sys-surface-container-high);
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 32px 24px;
      text-align: center;
    }
    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }
    mat-card-title {
      font-size: 28px !important;
      font-weight: 700 !important;
      margin-bottom: 8px !important;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .full-width {
      width: 100%;
    }
    .submit-btn {
      padding: 24px 0;
      font-size: 16px;
      margin-top: 16px;
    }
    .auth-actions {
      justify-content: center;
      margin-top: 16px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }
    .auth-actions a {
      color: var(--mat-sys-primary);
      text-decoration: none;
      font-weight: 500;
    }
    .error-message {
      color: var(--mat-sys-error);
      margin-bottom: 16px;
      font-size: 14px;
    }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  invitationToken: string | null = null;
  isLoading = false;
  errorMessage = '';

  registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.invitationToken = params['token'];
      }
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const payload = {
        ...this.registerForm.value,
        token: this.invitationToken
      };
      
      this.authService.register(payload).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'Registration failed. Please check your details.';
        }
      });
    }
  }
}
