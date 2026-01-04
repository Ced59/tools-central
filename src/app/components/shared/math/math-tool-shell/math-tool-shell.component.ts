import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-math-tool-shell',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
  ],
  templateUrl: './math-tool-shell.component.html',
  styleUrl: './math-tool-shell.component.scss',
})
export class MathToolShellComponent {
  @Input() icon: string = 'pi pi-calculator';
  @Input() backLink: string = '/';

  @Input() showExamples: boolean = true;
  @Input() showDefinition: boolean = true;

  @Output() resetClick = new EventEmitter<void>();

  onReset(): void {
    this.resetClick.emit();
  }
}
