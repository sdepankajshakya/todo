import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatAccordion } from '@angular/material/expansion';
import { Subscription } from 'rxjs';
import { ApiResponse } from '../models/apiResponse';

import { Board } from '../models/board';
import { Task, Subtask } from '../models/task';
import { SharedService } from '../services/shared.service';
import { TaskService } from '../services/task.service';
import { ColorPaletteComponent } from '../shared/components/color-palette/color-palette.component';
import { NotificationService } from '../shared/services/notification.service';
import { ColorUtilsService } from '../shared/services/color-utils.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
})
export class TaskComponent implements OnInit, OnDestroy {
  constructor(
    private taskService: TaskService,
    private sharedService: SharedService,
    private bottomSheet: MatBottomSheet,
    private notifier: NotificationService,
    private colorUtilsService: ColorUtilsService
  ) {
    this.colorChangeSubscription = this.sharedService.$color.subscribe(
      (paint) => {
        const color = paint as string;
        this.setTaskColor(color);
      }
    );
  }

  @Input() task!: Task;
  @Input() board!: Board;
  @Input() taskIndex!: number;
  @Output() getBoard: EventEmitter<Board> = new EventEmitter();
  @ViewChild(MatAccordion) accordion!: MatAccordion;
  colorChangeSubscription: Subscription = new Subscription();

  subtaskName: string = '';
  selectedTask: Task = {
    name: '',
    dueDate: null,
    priority: 0,
    subtasks: [],
    boardName: '',
    bgColor: '',
    isDark: false,
  };

  bgColor: string = '';
  brightness: string = '';
  r: number = 0;
  g: number = 0;
  b: number = 0;
  hsp!: number;

  connectedDropLists: string[] = [];
  isDragging = false;
  editingTaskName = false;
  editingSubtaskName: boolean[] = [];

  ngOnInit(): void {
    this.adjustTextColor();

    // Setup connectedDropLists for all lists (tasks) on the board
    if (this.board && this.board.tasks) {
      this.connectedDropLists = this.board.tasks.map((t, i) => `subtasks-list-${i}`);
    }
    this.editingSubtaskName = this.task.subtasks ? this.task.subtasks.map(() => false) : [];
  }

  ngOnChanges(): void {
    this.editingSubtaskName = this.task.subtasks ? this.task.subtasks.map(() => false) : [];
  }

  addSubtask() {
    if (this.subtaskName && this.task) {
      const subtask: Subtask = {
        name: this.subtaskName,
        isCompleted: false,
        taskName: this.task.name,
        boardName: this.task.boardName,
      };
      this.task.subtasks.push(subtask);
      this.saveNewSubtask(subtask);
    }

    this.subtaskName = '';
  }

  saveNewSubtask(subtask: Subtask) {
    this.taskService.saveNewSubtask(subtask).subscribe(
      (res) => {
        const response = res as ApiResponse;
        // this.getBoard.emit();
        this.notifier.showSuccess(response.message);
      },
      (err) => {
        throw new Error(err.message);
      }
    );
  }

  markAsComplete(checked: boolean, subtask: Subtask) {
    if (subtask) {
      subtask.isCompleted = checked;
      subtask.taskName = this.task.name;
    }
    this.updateSubtask(subtask);
  }

  onDueDateChange() {
    this.updateTask();
  }

  updateTask() {
    this.taskService.updateTask(this.task).subscribe(
      (res) => {
        // this.getBoard.emit();
      },
      (err) => {
        throw new Error(err.message);
      }
    );
  }

  onDeleteTask() {
    if (confirm(`Are you sure you want to delete card "${this.task.name}"?`)) {
      this.taskService.deleteTask(this.task).subscribe(
        (res) => {
          const response = res as ApiResponse;
          this.notifier.showSuccess(response.message);
          this.getBoard.emit();
        },
        (err) => {
          throw new Error(err.message);
        }
      );
    }
  }

  updateSubtask(subtask: Subtask) {
    this.taskService.updateSubtask(subtask).subscribe(
      (res) => {
        // this.getBoard.emit();
      },
      (err) => {
        throw new Error(err.message);
      }
    );
  }

  drop(event: CdkDragDrop<any>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      // Optionally, update the subtasks' taskName to match the new parent task
      if (this.task && event.container.data) {
        event.container.data[event.currentIndex].taskName = this.task.name;
        // Persist the change if needed
        this.updateSubtask(event.container.data[event.currentIndex]);
      }
    }
    // Optionally, persist the new order to the backend
    this.updateTask();
  }

  onSubtaskDrop(event: CdkDragDrop<Subtask[]>) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  this.updateBoard(); // Persist updated subtask order
}

  updateBoard() {
    this.taskService.updateBoard(this.board).subscribe(
      (res) => {},
      (err) => {
        throw new Error(err.message);
      }
    );
  }

  setTaskColor(color: string) {
    if (color) {
      this.selectedTask.bgColor = color;
      if (this.selectedTask?.name) {
        this.updateBoard();
        this.reset();
        this.adjustTextColor();
      }
    }
  }

  openColorPalette(task: Task) {
    this.selectedTask = task;
    this.bottomSheet.open(ColorPaletteComponent);
  }

  reset() {
    this.selectedTask = {
      name: '',
      dueDate: null,
      priority: 0,
      subtasks: [],
      boardName: '',
      bgColor: '',
      isDark: false,
    };
  }

  onDeleteSubtask(subtask: Subtask) {
    if (confirm(`Are you sure you want to delete "${subtask.name}"?`)) {
      this.taskService.deleteSubtask(subtask).subscribe(
        (res) => {
          const response = res as ApiResponse;
          this.notifier.showSuccess(response.message);
          this.getBoard.emit();
        },
        (err) => {
          throw new Error(err.message);
        }
      );
    }
  }

  onTaskNameChange() {
    // taskName in subtasks should also be updated
    if (this.task?.name && this.task?.subtasks?.length) {
      this.task.subtasks.forEach((subtask) => {
        subtask.taskName = this.task.name;
      });
    }
    this.updateTask();
  }

  ngOnDestroy(): void {
    this.colorChangeSubscription.unsubscribe();
  }

  adjustTextColor() {
    this.bgColor = this.hexToRGB(this.task.bgColor);

    // Call lightOrDark function to get the brightness (light or dark)
    this.brightness = this.colorUtilsService.lightOrDark(this.bgColor);

    // If the background color is dark, add the light-text class to it
    if (this.brightness == 'dark') {
      this.task.isDark = true;
    } else {
      this.task.isDark = false;
    }
  }

  hexToRGB(h: any) {
    let r: number | string = 0;
    let b: number | string = 0;
    let g: number | string = 0;

    // 3 digits
    if (h.length == 4) {
      r = '0x' + h[1] + h[1];
      g = '0x' + h[2] + h[2];
      b = '0x' + h[3] + h[3];

      // 6 digits
    } else if (h.length == 7) {
      r = '0x' + h[1] + h[2];
      g = '0x' + h[3] + h[4];
      b = '0x' + h[5] + h[6];
    }

    return 'rgb(' + +r + ',' + +g + ',' + +b + ')';
  }

  onDragStarted() {
    this.isDragging = true;
  }

  onDragEnded() {
    this.isDragging = false;
  }
}
