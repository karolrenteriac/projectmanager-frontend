import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  isDarkMode = signal<boolean>(false);
  private themeKey = 'theme';

  constructor() {
    this.initTheme();
  }

  initTheme(): void {
    const savedTheme = localStorage.getItem(this.themeKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.applyTheme('dark');
    } else {
      this.applyTheme('light');
    }
  }

  toggleTheme(): void {
    const newTheme = this.isDarkMode() ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const body = document.body;

    body.classList.remove('light-theme', 'dark-theme');

    if (theme === 'dark') {
      body.classList.add('dark-theme');
      this.isDarkMode.set(true);
    } else {
      body.classList.add('light-theme');
      this.isDarkMode.set(false);
    }

    localStorage.setItem(this.themeKey, theme);
  }
}