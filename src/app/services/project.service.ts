import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Standard interfaces for Project and User
export interface Project {
  _id?: string;
  title: string;
  description?: string;
  objectives?: string;
  startDate?: string | null;
  endDate?: string | null;
  members?: string[];
  status?: string;
  progress?: number;
  createdBy?: any;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;
  private userUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * ✅ GET PROJECTS
   * Fetches all projects for the authenticated user's organization
   */
  getProjects(): Observable<{ projects: Project[] }> {
    return this.http.get<{ projects: Project[] }>(this.apiUrl);
  }

  /**
   * ✅ GET PROJECT BY ID
   */
  getProjectById(id: string): Observable<{ project: Project }> {
    return this.http.get<{ project: Project }>(`${this.apiUrl}/${id}`);
  }

  /**
   * ✅ CREATE PROJECT
   * Sends new project data to the backend
   */
  createProject(data: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, data);
  }

  /**
   * ✅ UPDATE PROJECT
   */
  updateProject(id: string, data: Partial<Project>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  /**
   * ✅ DELETE PROJECT
   */
  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * ✅ GET USERS
   * Fetches list of users in the same organization to be used as team members
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.userUrl);
  }
}