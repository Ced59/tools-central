import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

interface Tool {
  icon: string;
  titleKey: string;
  title: string;
  descKey: string;
  description: string;
  available: boolean;
}

@Component({
  selector: 'app-home',
  imports: [CardModule, ButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  scrollToTools(): void {
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
  }
}
