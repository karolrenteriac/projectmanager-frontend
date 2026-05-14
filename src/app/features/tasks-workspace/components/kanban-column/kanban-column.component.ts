import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Task } from '../../services/tasks-workspace.service';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CommonModule, TaskCardComponent, DragDropModule],
  templateUrl: './kanban-column.component.html',
  styleUrl: './kanban-column.component.css'
})
export class KanbanColumnComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) tasks: Task[] = [];
  @Input() status!: string;

  @Output() taskDropped = new EventEmitter<CdkDragDrop<Task[]>>();

  get columnClass(): string {
    return `column-${this.status}`;
  }

  trackById(index: number, item: Task): string {
    return item.id;
  }

  drop(event: CdkDragDrop<Task[]>) {
    this.taskDropped.emit(event);
  }
}
