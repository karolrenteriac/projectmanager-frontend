import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Task } from '../../services/tasks-workspace.service';
import { AuthService } from '../../../../services/auth.service';
import { TaskDetailsDialog } from '../dialogs/task-details-dialog/task-details-dialog';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.css'
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;

  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  openDetails() {
    const user = this.authService.getUser();
    this.dialog.open(TaskDetailsDialog, {
      width: '1100px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'task-detail-panel',
      data: {
        task: this.task,
        currentUserId: user?.id || user?._id,
        currentUserRole: user?.role
      }
    });
  }
}
