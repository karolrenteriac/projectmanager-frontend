import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ProjectService, Project } from '../../../services/project.service';

export type ProjectHealth = 'healthy' | 'delayed' | 'blocked' | 'critical';
export type ProjectStatus = 'planning' | 'in-progress' | 'completed';

export interface GovernanceCoordinator {
  id: string;
  name: string;
  email: string;
}

export interface GovernanceProject {
  id: string;
  title: string;
  description: string;
  coordinator: GovernanceCoordinator | null;
  status: ProjectStatus;
  progress: number;
  health: ProjectHealth;
  totalTasks: number;
  completedTasks: number;
  reviewTasks: number;
  overdueTasks: number;
  activeWorkers: number;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceResponse {
  projects: GovernanceProject[];
}

export interface ReviewBottleneck {
  id: string;
  title: string;
  priority: string;
  assignedTo: { name: string; email: string } | null;
  updatedAt: string;
}

export interface OverdueTask {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  daysOverdue: number;
  assignedTo: { name: string; email: string } | null;
  status: string;
}

export interface WorkloadEntry {
  user: { id: string; name: string; email: string };
  total: number;
  done: number;
  inProgress: number;
  review: number;
  overdue: number;
}

export interface ProjectReport {
  projectSummary: {
    id: string;
    title: string;
    description: string;
    objectives: string;
    status: ProjectStatus;
    progress: number;
    health: ProjectHealth;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
  };
  coordinatorInfo: { id: string; name: string; email: string; role: string } | null;
  taskMetrics: {
    total: number;
    completed: number;
    inProgress: number;
    review: number;
    todo: number;
    blocked: number;
    cancelled: number;
    completionRate: number;
    overdueRate: number;
  };
  reviewBottlenecks: ReviewBottleneck[];
  overdueAnalysis: { count: number; tasks: OverdueTask[] };
  workloadDistribution: WorkloadEntry[];
  completionPercentage: number;
  timelinePerformance: {
    overdueRate: number;
    onTimeRate: number;
    totalWithDueDate: number;
  };
}

export interface AvailableCoordinator {
  id: string;
  name: string;
  email: string;
  coordinatedProjectsCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminGovernanceService {
  private http = inject(HttpClient);
  private projectService = inject(ProjectService);
  private base = `${environment.apiUrl}/admin/projects`;
  private usersBase = `${environment.apiUrl}/users`;

  getGovernanceData(): Observable<GovernanceResponse> {
    return this.projectService.getProjects().pipe(
      map(({ projects }) => ({
        projects: projects.map(p => this.mapToGovernanceProject(p)),
      }))
    );
  }

  private mapToGovernanceProject(p: Project): GovernanceProject {
    const raw = p as any;
    const id = raw.id || raw._id || '';

    const coord = p.projectCoordinator as any;
    const coordinator: GovernanceCoordinator | null = coord
      ? { id: coord.id || coord._id || '', name: coord.name || '', email: coord.email || '' }
      : null;

    const now = Date.now();
    const updatedAt = p.updatedAt || p.createdAt || new Date().toISOString();
    const createdAt = p.createdAt || new Date().toISOString();

    return {
      id,
      title: p.title,
      description: p.description || '',
      coordinator,
      status: (p.status || 'planning') as ProjectStatus,
      progress: p.progress || 0,
      health: this.deriveHealth(p),
      totalTasks: 0,
      completedTasks: 0,
      reviewTasks: 0,
      overdueTasks: 0,
      activeWorkers: 0,
      lastActivity: updatedAt,
      createdAt,
      updatedAt,
    };
  }

  private deriveHealth(p: Project): ProjectHealth {
    if (p.status === 'completed') return 'healthy';
    const end = p.endDate ? new Date(p.endDate).getTime() : null;
    const progress = p.progress || 0;
    const now = Date.now();
    if (end && end < now) {
      return progress < 30 ? 'critical' : 'delayed';
    }
    if (p.status === 'in-progress' && progress < 10) return 'blocked';
    return 'healthy';
  }

  getProjectReport(projectId: string): Observable<{ report: ProjectReport }> {
    return this.http.get<{ report: ProjectReport }>(`${this.base}/${projectId}/report`);
  }

  assignCoordinator(
    projectId: string,
    coordinatorId: string
  ): Observable<{ projectId: string; coordinator: GovernanceCoordinator }> {
    return this.http.patch<{ projectId: string; coordinator: GovernanceCoordinator }>(
      `${this.base}/${projectId}/coordinator`,
      { coordinatorId }
    );
  }

  getAvailableCoordinators(): Observable<{ users: any[]; pagination: any; stats: any }> {
    return this.http.get<{ users: any[]; pagination: any; stats: any }>(
      `${this.usersBase}/admin/list`,
      { params: { role: 'coordinator', limit: '100', page: '1' } }
    );
  }
}
