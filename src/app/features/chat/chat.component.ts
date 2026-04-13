import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saas-card">
      <h1>Chat</h1>
      <p>Communicate with your team in real-time.</p>
    </div>
  `
})
export class ChatComponent {}
