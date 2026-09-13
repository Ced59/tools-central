import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from '@ui';

export interface ToolCardItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  available: boolean;
}

@Component({
  selector: 'app-tool-card',
  standalone: true,
  imports: [NgIf, RouterLink, ButtonModule],
  templateUrl: './tool-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './tool-card.component.scss'
})
export class ToolCardComponent {
  @Input({ required: true }) tool!: ToolCardItem;
}
