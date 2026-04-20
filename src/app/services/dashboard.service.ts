import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProgressData {
  labels: string[];
  datasets: {
    data: number[];
    label: string;
  }[];
}

export interface DistributionData {
  labels: string[];
  data: number[];
}

export interface ActivityData {
  labels: string[];
  data: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }

  getProgress(): Observable<ProgressData> {
    return this.http.get<ProgressData>(`${this.apiUrl}/progress`);
  }

  getTaskDistribution(): Observable<DistributionData> {
    return this.http.get<DistributionData>(`${this.apiUrl}/task-distribution`);
  }

  getUserActivity(): Observable<ActivityData> {
    return this.http.get<ActivityData>(`${this.apiUrl}/user-activity`);
  }

  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications`);
  }
}

