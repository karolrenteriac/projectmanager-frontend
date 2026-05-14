import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type UserRole = 'admin' | 'coordinator' | 'principal' | 'co-researcher';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  assignedTasksCount: number;
  completedTasksCount: number;
  reviewTasksCount: number;
  coordinatedProjectsCount: number;
  memberProjectsCount: number;
  assignedProjectsCount: number;
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  progress: number;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  coordinatedProjects: ProjectSummary[];
  memberProjects: ProjectSummary[];
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    blocked: number;
    cancelled: number;
  };
}

export interface AdminUserFilters {
  search: string;
  role: string;
  active: string;
}

export interface OrgStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: Record<UserRole, { total: number; active: number }>;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: { total: number; page: number; limit: number; pages: number };
  stats: OrgStats;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users/admin`;

  getUsers(
    filters: Partial<AdminUserFilters> = {},
    page = 1,
    limit = 20
  ): Observable<AdminUserListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.role)   params = params.set('role',   filters.role);
    if (filters.active !== undefined && filters.active !== '')
      params = params.set('active', filters.active);

    return this.http.get<AdminUserListResponse>(`${this.base}/list`, { params });
  }

  getUserById(userId: string): Observable<{ user: AdminUserDetail }> {
    return this.http.get<{ user: AdminUserDetail }>(`${this.base}/${userId}`);
  }

  updateUserRole(userId: string, role: UserRole): Observable<{ user: AdminUser }> {
    return this.http.patch<{ user: AdminUser }>(`${this.base}/${userId}/role`, { role });
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<{ user: AdminUser }> {
    return this.http.patch<{ user: AdminUser }>(`${this.base}/${userId}/status`, { isActive });
  }
}
