import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string | null;
  completedBy?: { id: string; name: string; email: string } | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project: any;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  commentsCount?: number;
  attachmentsCount?: number;
  progress?: number;
  tags?: string[];
  attachments?: any[];
  comments?: any[];
  // Checklist & estimation (backend Phase 2)
  estimatedHours?: number | null;
  checklist?: ChecklistItem[];
  checklistProgress?: number;
  completedChecklistItems?: number;
  totalChecklistItems?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TasksWorkspaceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tasks`;

  getTasksByProject(projectId: string): Observable<Task[]> {
    return this.http.get<{ tasks: Task[] }>(`${this.apiUrl}/project/${projectId}`).pipe(
      map(response => response.tasks)
    );
  }

  createTask(taskData: any): Observable<Task> {
    return this.http.post<{ task: Task }>(this.apiUrl, taskData).pipe(
      map(response => response.task)
    );
  }

  updateTaskStatus(taskId: string, status: string): Observable<Task> {
    return this.http.patch<{ task: Task }>(`${this.apiUrl}/${taskId}/status`, { status }).pipe(
      map(response => response.task)
    );
  }

  updateTask(taskId: string, payload: any): Observable<Task> {
    return this.http.put<{ task: Task }>(`${this.apiUrl}/${taskId}`, payload).pipe(
      map(response => response.task)
    );
  }

  submitForReview(taskId: string, payload: any): Observable<Task> {
    return this.http.patch<{ task: Task }>(`${this.apiUrl}/${taskId}/submit`, payload).pipe(
      map(response => response.task)
    );
  }

  reviewTask(taskId: string, payload: any): Observable<Task> {
    return this.http.patch<{ task: Task }>(`${this.apiUrl}/${taskId}/review`, payload).pipe(
      map(response => response.task)
    );
  }

  addComment(taskId: string, content: string): Observable<Task> {
    return this.http.post<{ task: Task }>(`${this.apiUrl}/${taskId}/comments`, { content }).pipe(
      map(response => response.task)
    );
  }

  deleteTask(taskId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${taskId}`);
  }

  /**
   * Upload evidence files to a task.
   * Returns an Observable of HttpEvents so callers can track upload progress.
   */
  uploadEvidence(taskId: string, formData: FormData): Observable<HttpEvent<{ task: Task; uploaded: number }>> {
    const req = new HttpRequest(
      'POST',
      `${this.apiUrl}/${taskId}/evidence`,
      formData,
      { reportProgress: true }
    );
    return this.http.request<{ task: Task; uploaded: number }>(req);
  }

  /** Delete a single evidence file from a task. */
  deleteEvidence(taskId: string, evidenceId: string): Observable<Task> {
    return this.http.delete<{ task: Task }>(`${this.apiUrl}/${taskId}/evidence/${evidenceId}`).pipe(
      map(res => res.task)
    );
  }
}
