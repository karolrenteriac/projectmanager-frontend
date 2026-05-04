import { Component, inject, ChangeDetectionStrategy, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatSidenavModule, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport
          [attr.role]="isHandset() ? 'dialog' : 'navigation'"
          [mode]="isHandset() ? 'over' : 'side'"
          [opened]="!isHandset()">
        <app-sidebar (navClick)="drawer.close()"></app-sidebar>
      </mat-sidenav>
      <mat-sidenav-content>
        <app-topbar (toggleSidenav)="drawer.toggle()"></app-topbar>
        <main class="content-padding fade-in">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100%;
      background-color: var(--mat-sys-surface, #f8fafc);
    }
    .sidenav {
      width: 260px;
      border-right: 1px solid var(--mat-sys-outline-variant, #e2e8f0);
      background-color: var(--mat-sys-surface-container-low, #ffffff);
    }
    mat-sidenav-content {
      display: flex;
      flex-direction: column;
    }
    .content-padding {
      padding: 24px;
      flex: 1;
      overflow: auto;
    }
  `]
})
export class LayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private ngZone = inject(NgZone);

  isHandset = signal(false);

  constructor() {
    this.ngZone.runOutsideAngular(() => {
      this.breakpointObserver.observe(Breakpoints.Handset)
        .pipe(distinctUntilChanged((a, b) => a.matches === b.matches))
        .subscribe(result => {
          this.ngZone.run(() => this.isHandset.set(result.matches));
        });
    });
  }
}
