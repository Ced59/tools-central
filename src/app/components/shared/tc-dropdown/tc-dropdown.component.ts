import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  forwardRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TcDropdownOption<T = string> = {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
};

@Component({
  selector: 'tc-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tc-dropdown.component.html',
  styleUrl: './tc-dropdown.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TcDropdownComponent),
      multi: true,
    },
  ],
})
export class TcDropdownComponent<T = string> implements ControlValueAccessor {
  @Input() label?: string;
  @Input() hint?: string;
  @Input() placeholder = 'Choisir…';
  @Input() options: TcDropdownOption<T>[] = [];

  /** Optionnel : si tu veux une largeur full */
  @Input() full = true;

  /** Id optionnel pour l’accessibilité */
  @Input() id = `tcdd_${Math.random().toString(16).slice(2)}`;

  /** Événement pratique si tu veux hooker (en plus du formControl) */
  @Output() valueChange = new EventEmitter<T | null>();

  // --- CVA
  private _value = signal<T | null>(null);
  private _disabled = signal(false);

  readonly value = computed(() => this._value());
  readonly disabled = computed(() => this._disabled());

  // UI
  readonly isOpen = signal(false);
  readonly activeIndex = signal<number>(-1);

  constructor(private host: ElementRef<HTMLElement>) {}

  writeValue(v: T | null): void {
    this._value.set(v ?? null);
  }

  private onChange: (v: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  registerOnChange(fn: (v: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(!!isDisabled);
    if (isDisabled) this.isOpen.set(false);
  }

  // --- Derived
  readonly selectedLabel = computed(() => {
    const v = this._value();
    if (v == null) return '';
    const opt = this.options.find(o => o.value === v);
    return opt?.label ?? '';
  });

  // --- Actions
  toggle() {
    if (this.disabled()) return;
    const next = !this.isOpen();
    this.isOpen.set(next);

    if (next) {
      // positionner le focus/active sur l'option sélectionnée si possible
      const v = this._value();
      const idx = v == null ? -1 : this.options.findIndex(o => o.value === v);
      this.activeIndex.set(idx >= 0 ? idx : this.firstEnabledIndex());
    } else {
      this.onTouched();
    }
  }

  close() {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.activeIndex.set(-1);
    this.onTouched();
  }

  select(opt: TcDropdownOption<T>) {
    if (this.disabled() || opt.disabled) return;

    this._value.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);

    this.close();
  }

  clear() {
    if (this.disabled()) return;
    this._value.set(null);
    this.onChange(null);
    this.valueChange.emit(null);
    this.close();
  }

  // --- Keyboard
  onKeydown(e: KeyboardEvent) {
    if (this.disabled()) return;

    const open = this.isOpen();
    const key = e.key;

    if (!open && (key === 'Enter' || key === ' ' || key === 'ArrowDown')) {
      e.preventDefault();
      this.toggle();
      return;
    }

    if (!open) return;

    if (key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    if (key === 'ArrowDown') {
      e.preventDefault();
      this.moveActive(+1);
      return;
    }

    if (key === 'ArrowUp') {
      e.preventDefault();
      this.moveActive(-1);
      return;
    }

    if (key === 'Home') {
      e.preventDefault();
      this.activeIndex.set(this.firstEnabledIndex());
      this.scrollActiveIntoView();
      return;
    }

    if (key === 'End') {
      e.preventDefault();
      this.activeIndex.set(this.lastEnabledIndex());
      this.scrollActiveIntoView();
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      const idx = this.activeIndex();
      const opt = this.options[idx];
      if (opt && !opt.disabled) this.select(opt);
      return;
    }
  }

  private moveActive(delta: number) {
    const opts = this.options;
    if (!opts.length) return;

    let idx = this.activeIndex();
    if (idx < 0) idx = this.firstEnabledIndex();

    let tries = 0;
    while (tries < opts.length) {
      idx = (idx + delta + opts.length) % opts.length;
      if (!opts[idx].disabled) break;
      tries++;
    }

    this.activeIndex.set(idx);
    this.scrollActiveIntoView();
  }

  private firstEnabledIndex(): number {
    return Math.max(0, this.options.findIndex(o => !o.disabled));
  }

  private lastEnabledIndex(): number {
    for (let i = this.options.length - 1; i >= 0; i--) {
      if (!this.options[i].disabled) return i;
    }
    return -1;
  }

  private scrollActiveIntoView() {
    queueMicrotask(() => {
      const root = this.host.nativeElement;
      const el = root.querySelector<HTMLElement>('[data-active="true"]');
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  // --- Click outside
  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(e: MouseEvent) {
    if (!this.isOpen()) return;
    const root = this.host.nativeElement;
    if (!root.contains(e.target as Node)) this.close();
  }

  // --- convenience
  isSelected(opt: TcDropdownOption<T>): boolean {
    return this._value() === opt.value;
  }
}
