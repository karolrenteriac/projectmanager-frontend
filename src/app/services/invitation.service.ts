import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Invitation {
  id: string;
  email: string;
  role: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/invitations`;

  createInvitation(data: { email: string; role: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getInvitations(): Observable<{ success: boolean; data: Invitation[] }> {
    return this.http.get<{ success: boolean; data: Invitation[] }>(this.apiUrl);
  }
}
