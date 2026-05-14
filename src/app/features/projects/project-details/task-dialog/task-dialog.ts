import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup, 
  Validators 
} from '@angular/forms';
import { 
  MatDialogModule, 
  MatDialogRef, 
  MAT_DIALOG_DATA 
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Task, TaskService } from '../../../../services/task.service';
import { ProjectService } from '../../../../services/project.service';

export interface TaskDialogData {
  task?: Task;
  projectId: string;
  projectMembers?: any[];
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './task-dialog.html',
  styleUrl: './task-dialog.css',
})
export class TaskDialogComponent implements OnInit {
  taskForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  members: any[] = [];

  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  
  constructor(
    public dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDialogData
  ) {
    this.isEditMode = !!data.task;
    this.members = data.projectMembers || [];

    this.taskForm = this.fb.group({
      title: [data.task?.title || '', [Validators.required, Validators.minLength(3)]],
      description: [data.task?.description || ''],
      status: [data.task?.status || 'pending', Validators.required],
      assignedTo: [data.task?.assignedTo?._id || data.task?.assignedTo || ''],
    });
  }

  ngOnInit(): void {
    if (!this.members.length) {
      this.loadMembers();
    }
  }

  loadMembers(): void {
    // If not passed in data, we could fetch them here
    // For now we assume they are passed or fetched from projectService
  }

  onSubmit(): void {
    if (this.taskForm.invalid) return;

    this.isLoading = true;
    const formValue = this.taskForm.value;
    
    const taskData: Partial<Task> = {
      ...formValue,
      project: this.data.projectId
    };

    if (this.isEditMode && this.data.task?._id) {
      this.taskService.updateTask(this.data.task._id, taskData).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.dialogRef.close(res.task);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error updating task:', err);
        }
      });
    } else {
      this.taskService.createTask(taskData).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.dialogRef.close(res.task);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error creating task:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
