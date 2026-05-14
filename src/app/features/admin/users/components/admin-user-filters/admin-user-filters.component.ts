import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AdminUserFilters } from '../../../services/admin-user.service';

@Component({
  selector: 'app-admin-user-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './admin-user-filters.component.html',
  styleUrl: './admin-user-filters.component.css',
})
export class AdminUserFiltersComponent implements OnInit, OnDestroy {
  @Output() filtersChange = new EventEmitter<AdminUserFilters>();

  form: FormGroup;
  private destroy$ = new Subject<void>();

  readonly roles = [
    { value: '',              label: 'All Roles' },
    { value: 'admin',         label: 'Admin' },
    { value: 'coordinator',   label: 'Coordinator' },
    { value: 'principal',     label: 'Principal' },
    { value: 'co-researcher', label: 'Co-Researcher' },
  ];

  readonly statuses = [
    { value: '',      label: 'All Status' },
    { value: 'true',  label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      search: [''],
      role:   [''],
      active: [''],
    });
  }

  ngOnInit(): void {
    // Debounce search; emit immediately for selects
    this.form.get('search')!.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.emit());

    this.form.get('role')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.emit());
    this.form.get('active')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.emit());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private emit(): void {
    this.filtersChange.emit(this.form.value as AdminUserFilters);
  }

  hasActiveFilters(): boolean {
    const v = this.form.value;
    return !!(v.search || v.role || v.active);
  }

  clearFilters(): void {
    this.form.reset({ search: '', role: '', active: '' });
  }
}
