import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { TokenService } from '../core/services/token.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private tokenService = inject(TokenService);
  private currentRoom: string | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    if (typeof window === 'undefined') return;
    
    this.socket = io(environment.apiUrl.replace('/api', ''), {
      auth: {
        token: this.tokenService.getToken()
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      if (this.currentRoom) {
        this.joinProject(this.currentRoom);
      }
    });
  }

  joinProject(projectId: string) {
    if (!this.socket) return;
    this.currentRoom = projectId;
    this.socket.emit('joinProject', projectId);
  }

  leaveProject() {
    this.currentRoom = null;
    // You could emit a leaveProject event if the backend supported it
  }

  onTaskCreated(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('taskCreated', data => observer.next(data));
    });
  }

  onTaskUpdated(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('taskUpdated', data => observer.next(data));
    });
  }

  onTaskDeleted(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('taskDeleted', data => observer.next(data));
    });
  }

  onReviewRequested(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('reviewRequested', data => observer.next(data));
    });
  }
}
