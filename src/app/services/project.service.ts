import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Project {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  objectives?: string;
  startDate?: string | null;
  endDate?: string | null;
  members?: any[];
  status?: string;
  progress?: number;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface ProjectExport {
  project: Project;
  tasks: any[];
  members: any[];
  exportedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;
  private userUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getProjects(search?: string): Observable<{ projects: Project[] }> {
    let params = new HttpParams();
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.http.get<{ projects: Project[] }>(this.apiUrl, { params });
  }

  // ✅ CORREGIDO
  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(data: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, data);
  }

  updateProject(id: string, data: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, data);
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  exportProject(id: string): Observable<ProjectExport> {
    return this.http.get<ProjectExport>(`${this.apiUrl}/${id}/export`);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.userUrl);
  }
}