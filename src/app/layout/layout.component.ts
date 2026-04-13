import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport
          [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
          [mode]="(isHandset$ | async) ? 'over' : 'side'"
          [opened]="(isHandset$ | async) === false">
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

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}
