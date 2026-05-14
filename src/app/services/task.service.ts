import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Task {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'review';
  assignedTo?: any;
  project: string;
  organization?: string;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) { }

  getTasksByProject(projectId: string): Observable<{ tasks: Task[] }> {
    return this.http.get<{ tasks: Task[] }>(`${this.apiUrl}/project/${projectId}`);
  }

  getTaskById(id: string): Observable<{ task: Task }> {
    return this.http.get<{ task: Task }>(`${this.apiUrl}/${id}`);
  }

  createTask(task: Partial<Task>): Observable<{ task: Task }> {
    return this.http.post<{ task: Task }>(this.apiUrl, task);
  }

  updateTask(id: string, task: Partial<Task>): Observable<{ task: Task }> {
    return this.http.put<{ task: Task }>(`${this.apiUrl}/${id}`, task);
  }

  updateTaskStatus(id: string, status: string): Observable<{ task: Task }> {
    return this.http.patch<{ task: Task }>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteTask(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
