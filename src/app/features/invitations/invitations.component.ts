import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InvitationService, Invitation } from '../../services/invitation.service';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-invitations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    DatePipe
  ],
  templateUrl: './invitations.component.html',
  styleUrl: './invitations.component.css'
})
export class InvitationsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private invitationService = inject(InvitationService);
  private snackBar = inject(MatSnackBar);

  invitations: Invitation[] = [];
  displayedColumns: string[] = ['email', 'role', 'status', 'createdAt', 'expiresAt'];
  isLoading = false;
  isSending = false;
  today = new Date();

  invitationForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required]
  });

  ngOnInit() {
    this.loadInvitations();
  }

  loadInvitations() {
    this.isLoading = true;
    this.invitationService.getInvitations().subscribe({
      next: (res: any) => {
        this.invitations = res.data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading invitations:', err);
        this.snackBar.open('Failed to load invitations', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.invitationForm.invalid) {
      return;
    }

    this.isSending = true;
    const data = this.invitationForm.value;

    this.invitationService.createInvitation(data).subscribe({
      next: (res: any) => {
        this.snackBar.open('Invitation sent successfully', 'Close', { duration: 3000 });
        this.invitationForm.reset();
        Object.keys(this.invitationForm.controls).forEach(key => {
          this.invitationForm.get(key)?.setErrors(null) ;
        });
        this.loadInvitations();
        this.isSending = false;
      },
      error: (err: any) => {
        console.error('Error sending invitation:', err);
        const errorMsg = err.error?.message || 'Failed to send invitation';
        this.snackBar.open(errorMsg, 'Close', { duration: 4000 });
        this.isSending = false;
      }
    });
  }
}
