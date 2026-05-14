import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProjectService } from '../../../../../services/project.service';
import { Task } from '../../../services/tasks-workspace.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface TaskFormDialogData {
  mode: 'create' | 'edit';
  projectId: string;
  task?: Task;            // required in edit mode
  currentUserId: string;
  currentUserRole: string;
}

/** Shape returned by this dialog on submit */
export interface TaskFormResult {
  mode: 'create' | 'edit';
  taskId?: string;        // set in edit mode
  payload: TaskFormPayload;
}

export interface TaskFormPayload {
  title: string;
  description: string;
  priority: string;
  assignedTo: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  checklist: FormChecklistItem[];
  project: string;
  status?: string;
}

export interface FormChecklistItem {
  id?: string;
  title: string;
  completed: boolean;
}

// ─── Normalized member shape ──────────────────────────────────────────────────

interface MemberVM {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ─── Validators ───────────────────────────────────────────────────────────────

function noPastDateValidator(control: AbstractControl) {
  if (!control.value) return null;
  const selected = new Date(control.value);
  selected.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today ? { pastDate: true } : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    DragDropModule,
  ],
  templateUrl: './create-task-dialog.html',
  styleUrl: './create-task-dialog.css',
})
export class TaskFormDialog implements OnInit, OnDestroy {
  // ─── State ──────────────────────────────────────────────────────────────────
  taskForm!: FormGroup;
  projectMembers: MemberVM[] = [];
  loadingMembers = true;
  membersLoadError = false;
  isSubmitting = false;

  readonly minDate = new Date();

  @ViewChildren('checklistInput') checklistInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private destroy$ = new Subject<void>();

  // ─── Derived ────────────────────────────────────────────────────────────────

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Task' : 'Create New Task';
  }

  get dialogSubtitle(): string {
    return this.isEditMode
      ? 'Update task details, checklist, and assignment'
      : 'Fill in the details below to add a task to this project';
  }

  get submitLabel(): string {
    if (this.isSubmitting) return this.isEditMode ? 'Saving…' : 'Creating…';
    return this.isEditMode ? 'Save Changes' : 'Create Task';
  }

  get submitIcon(): string {
    return this.isEditMode ? 'save' : 'add_circle_outline';
  }

  // ─── Checklist computed ──────────────────────────────────────────────────────

  get checklistArray(): FormArray {
    return this.taskForm.get('checklist') as FormArray;
  }

  get completedChecklistCount(): number {
    return this.checklistArray.controls.filter(c => c.get('completed')?.value).length;
  }

  get checklistProgressPercent(): number {
    if (!this.checklistArray.length) return 0;
    return Math.round((this.completedChecklistCount / this.checklistArray.length) * 100);
  }

  // ─── Constructor ─────────────────────────────────────────────────────────────

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TaskFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: TaskFormDialogData,
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {}

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit() {
    this.initializeForm();
    if (this.isEditMode && this.data.task) {
      this.patchFormForEdit();
    }
    this.loadProjectMembers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Form init ───────────────────────────────────────────────────────────────

  private initializeForm() {
    this.taskForm = this.fb.group({
      title:          ['', [Validators.required, Validators.minLength(3)]],
      description:    [''],
      priority:       ['medium', Validators.required],
      assignedTo:     [{ value: null, disabled: true }],
      dueDate:        [null, [noPastDateValidator]],
      estimatedHours: [null, [Validators.min(1), Validators.max(1000)]],
      checklist:      this.fb.array([]),
      project:        [this.data.projectId, Validators.required],
    });
  }

  /** Patch all fields except assignedTo (patched after members load) */
  private patchFormForEdit() {
    const t = this.data.task!;
    console.log('[TaskFormDialog] Edit mode — pre-filling form with task:', t.id, t.title);

    this.taskForm.patchValue({
      title:          t.title,
      description:    t.description || '',
      priority:       t.priority,
      dueDate:        t.dueDate ? new Date(t.dueDate) : null,
      estimatedHours: t.estimatedHours ?? null,
    });

    // Rebuild checklist from task
    const cl = this.checklistArray;
    cl.clear();
    (t.checklist || []).forEach(item => {
      cl.push(this.createChecklistItem(item.id, item.title, item.completed));
    });

    console.log('[TaskFormDialog] Checklist pre-filled:', t.checklist?.length ?? 0, 'items');
  }

  // ─── Member loading ──────────────────────────────────────────────────────────

  private loadProjectMembers() {
    this.loadingMembers = true;
    this.membersLoadError = false;
    this.taskForm?.get('assignedTo')?.disable();

    console.log('[TaskFormDialog] Loading members for project:', this.data.projectId);

    this.projectService.getProjectById(this.data.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          // Normalize: backend toUserDTO returns { id } NOT { _id }
          const allMembers = [
            ...(project.principalResearchers || []),
            ...(project.coResearchers || []),
          ];
          this.projectMembers = allMembers.map((m: any) => ({
            id:    m.id   ?? m._id ?? '',
            name:  m.name  ?? '',
            email: m.email ?? '',
            role:  m.role  ?? '',
          }));

          console.log('[TaskFormDialog] Normalized members:', this.projectMembers);

          this.loadingMembers = false;
          this.taskForm.get('assignedTo')?.enable();

          // In edit mode, patch assignedTo after control is enabled
          if (this.isEditMode && this.data.task?.assignedTo) {
            const assignedId = (this.data.task.assignedTo as any)?.id ?? null;
            this.taskForm.get('assignedTo')?.setValue(assignedId);
            console.log('[TaskFormDialog] Pre-selected assignee:', assignedId);
          }
        },
        error: (err) => {
          console.error('[TaskFormDialog] Failed to load members:', err);
          this.loadingMembers = false;
          this.membersLoadError = true;
          this.taskForm.get('assignedTo')?.enable();
          this.snackBar
            .open('Failed to load project members', 'Retry', { duration: 5000 })
            .onAction()
            .subscribe(() => this.loadProjectMembers());
        }
      });
  }

  retryLoadMembers(): void {
    this.loadProjectMembers();
  }

  // ─── Display helpers ─────────────────────────────────────────────────────────

  getMemberInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getRoleDisplay(role: string): string {
    const map: Record<string, string> = {
      admin:           'Admin',
      coordinator:     'Coordinator',
      principal:       'Principal Investigator',
      'co-researcher': 'Co-Researcher',
    };
    return map[role] || role;
  }

  getSelectedMember(): MemberVM | null {
    const id = this.taskForm.get('assignedTo')?.value;
    if (!id) return null;
    const member = this.projectMembers.find(m => m.id === id) ?? null;
    return member;
  }

  // ─── Checklist management ────────────────────────────────────────────────────

  private createChecklistItem(id = '', title = '', completed = false): FormGroup {
    return this.fb.group({
      id:        [id],
      title:     [title],
      completed: [completed],
    });
  }

  addChecklistItem(atIndex?: number): void {
    const newItem = this.createChecklistItem();
    if (atIndex !== undefined && atIndex <= this.checklistArray.length) {
      this.checklistArray.insert(atIndex, newItem);
    } else {
      this.checklistArray.push(newItem);
    }
  }

  removeChecklistItem(index: number): void {
    this.checklistArray.removeAt(index);
  }

  onChecklistDropped(event: CdkDragDrop<any>): void {
    moveItemInArray(this.checklistArray.controls, event.previousIndex, event.currentIndex);
    this.taskForm.markAsDirty();
  }

  /** Enter → add next item; Backspace on empty → remove and focus previous */
  onChecklistKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const title = this.checklistArray.at(index).get('title')?.value?.trim();
      if (title) {
        this.addChecklistItem(index + 1);
        setTimeout(() => {
          const inputs = this.checklistInputs.toArray();
          inputs[index + 1]?.nativeElement.focus();
        }, 50);
      }
      return;
    }

    if (event.key === 'Backspace') {
      const title = this.checklistArray.at(index).get('title')?.value;
      if (!title && this.checklistArray.length > 1) {
        event.preventDefault();
        this.removeChecklistItem(index);
        setTimeout(() => {
          const inputs = this.checklistInputs.toArray();
          const prevIndex = Math.max(0, index - 1);
          inputs[prevIndex]?.nativeElement.focus();
        }, 50);
      }
    }
  }

  // ─── Date change ─────────────────────────────────────────────────────────────

  onDateChange(value: Date | null): void {
    console.log('[TaskFormDialog] Due date selected:', value ? value.toISOString() : null);
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.taskForm.invalid) return;
    this.isSubmitting = true;

    const raw = this.taskForm.getRawValue();

    // Filter and normalize checklist items; preserve IDs for existing items
    const checklist: FormChecklistItem[] = (raw.checklist as any[])
      .filter(item => item.title?.trim())
      .map(item => ({
        ...(item.id ? { id: item.id } : {}),
        title: item.title.trim(),
        completed: item.completed || false,
      }));

    // Timezone-safe: represent the chosen calendar date as noon UTC
    let dueDate: string | null = null;
    if (raw.dueDate) {
      const d = new Date(raw.dueDate);
      dueDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)).toISOString();
    }

    const payload: TaskFormPayload = {
      title:          raw.title,
      description:    raw.description || '',
      priority:       raw.priority,
      assignedTo:     raw.assignedTo || null,
      dueDate,
      estimatedHours: raw.estimatedHours ? Number(raw.estimatedHours) : null,
      checklist,
      project:        raw.project,
    };

    if (!this.isEditMode) {
      payload.status = 'todo';
    }

    console.log('[TaskFormDialog] Submitting payload:', payload);

    const result: TaskFormResult = {
      mode: this.data.mode,
      payload,
      ...(this.isEditMode ? { taskId: this.data.task!.id } : {}),
    };

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

// Keep old export alias so existing code that imported CreateTaskDialog still compiles
export { TaskFormDialog as CreateTaskDialog };
