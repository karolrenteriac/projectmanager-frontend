import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
}

export interface ProjectTeam {
  coordinator: User | null;
  principalResearchers: User[];
  coResearchers: User[];
}

export interface Project {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  objectives?: string;
  startDate?: string | null;
  endDate?: string | null;
  projectCoordinator?: User | null;
  principalResearchers?: User[];
  coResearchers?: User[];
  status?: string;
  progress?: number;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectExport {
  project: Project;
  team: ProjectTeam;
  tasks: any[];
  exportedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;
  private userUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getProjects(search?: string): Observable<{ projects: Project[] }> {
    let params = new HttpParams();
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.http.get<{ projects: Project[] }>(this.apiUrl, { params });
  }

  getProjectById(id: string): Observable<Project> {
    return this.http.get<{ project: Project }>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.project));
  }

  createProject(data: Partial<Project>): Observable<Project> {
    return this.http.post<{ project: Project }>(this.apiUrl, data)
      .pipe(map(res => res.project));
  }

  updateProject(id: string, data: Partial<Project>): Observable<Project> {
    return this.http.put<{ project: Project }>(`${this.apiUrl}/${id}`, data)
      .pipe(map(res => res.project));
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
