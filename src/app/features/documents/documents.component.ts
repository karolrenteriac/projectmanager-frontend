import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saas-card">
      <h1>Documents</h1>
      <p>Store, share, and collaborate on your files.</p>
    </div>
  `
})
export class DocumentsComponent {}
