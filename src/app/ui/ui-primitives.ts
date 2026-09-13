import { NgClass, NgFor } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  NgModule,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type UiSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';
type UiSize = 'small' | 'large';

@Component({
  selector: 'tc-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [attr.type]="type"
      class="tc-button"
      [ngClass]="buttonClasses"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel || label || null"
      (click)="onClick.emit($event)"
    >
      @if (icon && iconPos !== 'right') {
        <i [class]="icon" aria-hidden="true"></i>
      }
      @if (label) {
        <span>{{ label }}</span>
      }
      @if (icon && iconPos === 'right') {
        <i [class]="icon" aria-hidden="true"></i>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: inline-block; max-width: 100%; }
    .tc-button {
      align-items: center;
      background: var(--primary-color);
      border: 1px solid var(--primary-color);
      border-radius: var(--radius-md);
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      font: inherit;
      font-weight: 600;
      gap: .55rem;
      justify-content: center;
      min-height: 2.65rem;
      padding: .65rem 1rem;
      transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .15s ease;
      width: 100%;
    }
    .tc-button:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
    .tc-button:focus-visible { box-shadow: var(--focus-ring); outline: 0; }
    .tc-button:disabled { cursor: not-allowed; opacity: .5; }
    .tc-button--secondary { background: var(--surface-card); border-color: var(--border-color); color: var(--text-color); }
    .tc-button--contrast { background: var(--text-color); border-color: var(--text-color); color: var(--surface-card); }
    .tc-button--success { background: var(--color-success); border-color: var(--color-success); }
    .tc-button--danger { background: var(--color-error); border-color: var(--color-error); }
    .tc-button--warn { background: var(--color-warning); border-color: var(--color-warning); color: #111827; }
    .tc-button--help, .tc-button--info { background: var(--color-info); border-color: var(--color-info); }
    .tc-button--outlined { background: transparent; color: var(--primary-color); }
    .tc-button--text { background: transparent; border-color: transparent; color: var(--primary-color); }
    .tc-button--rounded { border-radius: var(--radius-full); padding-inline: .8rem; }
    .tc-button--small { font-size: .875rem; min-height: 2.25rem; padding: .45rem .75rem; }
    .tc-button--large { font-size: 1.05rem; min-height: 3rem; padding: .75rem 1.2rem; }
  `],
})
export class TcButtonComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() iconPos: 'left' | 'right' = 'left';
  @Input() severity: UiSeverity = 'primary';
  @Input() size?: UiSize;
  @Input() outlined = false;
  @Input() text = false;
  @Input() rounded = false;
  @Input() disabled = false;
  @Input() type = 'button';
  @Input('aria-label') ariaLabel = '';
  @Output() onClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): Record<string, boolean> {
    return {
      [`tc-button--${this.severity}`]: true,
      'tc-button--outlined': this.outlined,
      'tc-button--text': this.text,
      'tc-button--rounded': this.rounded,
      'tc-button--small': this.size === 'small',
      'tc-button--large': this.size === 'large',
    };
  }
}

@Directive({
  selector: 'button[tcButton]',
  standalone: true,
})
export class TcButtonDirective implements OnChanges {
  @Input() label = '';
  @Input() icon = '';
  @HostBinding('class.tc-button') readonly baseClass = true;

  constructor(
    private readonly element: ElementRef<HTMLButtonElement>,
    private readonly renderer: Renderer2,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    const button = this.element.nativeElement;
    while (button.firstChild) {
      this.renderer.removeChild(button, button.firstChild);
    }

    if (this.icon) {
      const icon = this.renderer.createElement('i') as HTMLElement;
      for (const className of this.icon.split(/\s+/).filter(Boolean)) {
        this.renderer.addClass(icon, className);
      }
      this.renderer.setAttribute(icon, 'aria-hidden', 'true');
      this.renderer.appendChild(button, icon);
    }

    if (this.label) {
      const label = this.renderer.createElement('span') as HTMLSpanElement;
      this.renderer.appendChild(label, this.renderer.createText(this.label));
      this.renderer.appendChild(button, label);
      if (!button.hasAttribute('aria-label')) {
        this.renderer.setAttribute(button, 'aria-label', this.label);
      }
    }
  }
}

@Directive({
  selector: 'input[tcInput], textarea[tcInput]',
  standalone: true,
  host: { class: 'tc-input' },
})
export class TcInputDirective {
  // Kept for API compatibility with the former textarea enhancement.
  @Input() autoResize = false;
}

@Component({
  selector: 'tc-number-input',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TcNumberInputComponent),
    multi: true,
  }],
  template: `
    <span class="tc-number-input__field">
      <input
        class="tc-number-input__control"
        type="text"
        inputmode="decimal"
        [id]="inputId"
        [value]="displayValue"
        [placeholder]="placeholder"
        [readonly]="readonly"
        [disabled]="disabled"
        [attr.aria-label]="ariaLabel || null"
        (focus)="focused = true"
        (input)="handleInput($event)"
        (blur)="handleBlur()"
      />
      @if (suffix) {
        <span class="tc-number-input__suffix" aria-hidden="true">{{ suffix }}</span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: inline-block; max-width: 100%; }
    :host(.input-full) { width: 100%; }
    .tc-number-input__field { display: block; position: relative; width: 100%; }
    .tc-number-input__control {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-color);
      font: inherit;
      min-height: 2.75rem;
      padding: .65rem .8rem;
      width: 100%;
    }
    .tc-number-input__control:focus { border-color: var(--primary-color); box-shadow: var(--focus-ring); outline: 0; }
    .tc-number-input__control:disabled { cursor: not-allowed; opacity: .55; }
    .tc-number-input__suffix { color: var(--text-color-secondary); pointer-events: none; position: absolute; right: .8rem; top: 50%; transform: translateY(-50%); }
    .tc-number-input__field:has(.tc-number-input__suffix) .tc-number-input__control { padding-right: 2rem; }
  `],
})
export class TcNumberInputComponent implements ControlValueAccessor {
  @Input() inputId = '';
  @Input() placeholder = '';
  @Input() suffix = '';
  @Input() minFractionDigits = 0;
  @Input() maxFractionDigits = 6;
  @Input() useGrouping = true;
  @Input() min?: number;
  @Input() max?: number;
  @Input() readonly = false;
  @Input('aria-label') ariaLabel = '';
  @Output() onInput = new EventEmitter<number | null>();

  disabled = false;
  displayValue = '';
  focused = false;
  private value: number | null = null;
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  @Input()
  @HostBinding('class')
  styleClass = '';

  writeValue(value: number | null | undefined): void {
    this.value = typeof value === 'number' && Number.isFinite(value) ? value : null;
    this.displayValue = this.format(this.value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  handleInput(event: Event): void {
    this.displayValue = (event.target as HTMLInputElement).value;
    const next = this.parse(this.displayValue);
    this.value = next;
    this.onChange(next);
    this.onInput.emit(next);
  }

  handleBlur(): void {
    this.focused = false;
    this.displayValue = this.format(this.value);
    this.onTouched();
  }

  private parse(raw: string): number | null {
    const compact = raw.trim().replace(/[\s\u00a0\u202f]/g, '');
    if (!compact) return null;

    const lastComma = compact.lastIndexOf(',');
    const lastDot = compact.lastIndexOf('.');
    let normalized: string;
    if (lastComma > lastDot) {
      normalized = compact.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma && lastComma >= 0) {
      normalized = compact.replace(/,/g, '');
    } else {
      normalized = compact.replace(',', '.');
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return null;
    if (this.min != null && parsed < this.min) return parsed;
    if (this.max != null && parsed > this.max) return parsed;
    return parsed;
  }

  private format(value: number | null): string {
    if (value == null) return '';
    return new Intl.NumberFormat(undefined, {
      useGrouping: this.useGrouping,
      minimumFractionDigits: this.minFractionDigits,
      maximumFractionDigits: this.maxFractionDigits,
    }).format(value);
  }
}

@Component({
  selector: 'tc-tag',
  standalone: true,
  template: `<span class="tc-tag" [class]="'tc-tag tc-tag--' + severity">{{ value }}</span>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: inline-flex; }
    .tc-tag { background: var(--surface-ground); border: 1px solid var(--border-color); border-radius: var(--radius-full); color: var(--text-color); font-size: .75rem; font-weight: 700; line-height: 1; padding: .35rem .55rem; }
    .tc-tag--success { background: var(--color-success-bg); border-color: var(--color-success-border); color: var(--color-success); }
    .tc-tag--danger { background: var(--color-error-bg); border-color: var(--color-error-border); color: var(--color-error); }
    .tc-tag--warn { background: var(--color-warning-bg); border-color: var(--color-warning-border); color: var(--color-warning); }
    .tc-tag--info, .tc-tag--help { background: var(--color-info-bg); border-color: var(--color-info-border); color: var(--color-info); }
    .tc-tag--contrast { background: var(--text-color); color: var(--surface-card); }
  `],
})
export class TcTagComponent {
  @Input() value: unknown = '';
  @Input() severity: UiSeverity = 'secondary';
}

interface UiOption {
  [key: string]: unknown;
}

@Directive()
abstract class OptionsValueAccessor implements ControlValueAccessor {
  @Input() options: UiOption[] = [];
  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';
  disabled = false;
  value: unknown = null;
  protected onChange: (value: unknown) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  labelFor(option: UiOption): string {
    return String(option[this.optionLabel] ?? '');
  }

  valueFor(option: UiOption): unknown {
    return option[this.optionValue];
  }

  writeValue(value: unknown): void {
    this.value = value;
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }
}

@Component({
  selector: 'tc-select-button',
  standalone: true,
  imports: [NgFor],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TcSelectButtonComponent), multi: true }],
  template: `
    <div class="tc-choice-group" role="group">
      <button
        *ngFor="let option of options"
        type="button"
        class="tc-choice-group__button"
        [class.is-selected]="valueFor(option) === value"
        [attr.aria-pressed]="valueFor(option) === value"
        [disabled]="disabled"
        (click)="choose(option)"
      >{{ labelFor(option) }}</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .tc-choice-group { display: flex; flex-wrap: wrap; gap: .4rem; }
    .tc-choice-group__button { background: var(--surface-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-color); cursor: pointer; font: inherit; padding: .6rem .85rem; }
    .tc-choice-group__button.is-selected { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
    .tc-choice-group__button:focus-visible { box-shadow: var(--focus-ring); outline: 0; }
  `],
})
export class TcSelectButtonComponent extends OptionsValueAccessor {
  choose(option: UiOption): void {
    if (this.disabled) return;
    this.value = this.valueFor(option);
    this.onChange(this.value);
    this.onTouched();
  }
}

@Component({
  selector: 'tc-multi-select',
  standalone: true,
  imports: [NgFor],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TcMultiSelectComponent), multi: true }],
  template: `
    <div class="tc-multi-select" [id]="inputId">
      <button
        *ngFor="let option of options"
        type="button"
        class="tc-multi-select__option"
        [class.is-selected]="isSelected(option)"
        [attr.aria-pressed]="isSelected(option)"
        [disabled]="disabled"
        (click)="toggle(option)"
      >{{ labelFor(option) }}</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: inline-block; max-width: 100%; }
    :host(.input-full) { width: 100%; }
    .tc-multi-select { display: flex; flex-wrap: wrap; gap: .4rem; }
    .tc-multi-select__option { background: var(--surface-card); border: 1px solid var(--border-color); border-radius: var(--radius-full); color: var(--text-color); cursor: pointer; font: inherit; padding: .5rem .75rem; }
    .tc-multi-select__option.is-selected { background: var(--color-info-bg); border-color: var(--primary-color); color: var(--primary-color); }
    .tc-multi-select__option:focus-visible { box-shadow: var(--focus-ring); outline: 0; }
  `],
})
export class TcMultiSelectComponent extends OptionsValueAccessor {
  @Input() inputId = '';
  @Input() display = 'chip';
  @Input() @HostBinding('class') styleClass = '';

  override writeValue(value: unknown): void {
    this.value = Array.isArray(value) ? value : [];
  }

  isSelected(option: UiOption): boolean {
    return (this.value as unknown[]).includes(this.valueFor(option));
  }

  toggle(option: UiOption): void {
    if (this.disabled) return;
    const optionValue = this.valueFor(option);
    const current = this.value as unknown[];
    this.value = current.includes(optionValue)
      ? current.filter((item) => item !== optionValue)
      : [...current, optionValue];
    this.onChange(this.value);
    this.onTouched();
  }
}

@Component({
  selector: 'tc-toggle-button',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TcToggleButtonComponent), multi: true }],
  template: `
    <button
      type="button"
      class="tc-toggle-button"
      [class.is-selected]="value"
      [attr.aria-pressed]="value"
      [disabled]="disabled"
      (click)="toggle()"
    >{{ value ? onLabel : offLabel }}</button>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .tc-toggle-button { background: var(--surface-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-color); cursor: pointer; font: inherit; padding: .65rem .9rem; }
    .tc-toggle-button.is-selected { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
    .tc-toggle-button:focus-visible { box-shadow: var(--focus-ring); outline: 0; }
  `],
})
export class TcToggleButtonComponent implements ControlValueAccessor {
  @Input() onLabel = 'On';
  @Input() offLabel = 'Off';
  value = false;
  disabled = false;
  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: boolean | null | undefined): void {
    this.value = Boolean(value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  toggle(): void {
    if (this.disabled) return;
    this.value = !this.value;
    this.onChange(this.value);
    this.onTouched();
  }
}

@Component({
  selector: 'tc-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<ng-content />`,
})
export class TcCardComponent {}

@Component({
  selector: 'tc-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<hr />`,
})
export class TcDividerComponent {}

// Compatibility modules preserve existing standalone component import arrays.
// New code should import the Tc* classes directly.
@NgModule({ imports: [TcButtonComponent, TcButtonDirective], exports: [TcButtonComponent, TcButtonDirective] })
export class ButtonModule {}

export { TcButtonDirective as ButtonDirective };

@NgModule({ imports: [TcCardComponent], exports: [TcCardComponent] })
export class CardModule {}

@NgModule({ imports: [TcDividerComponent], exports: [TcDividerComponent] })
export class DividerModule {}

@NgModule({ imports: [TcInputDirective], exports: [TcInputDirective] })
export class InputTextModule {}

@NgModule({ imports: [TcInputDirective], exports: [TcInputDirective] })
export class TextareaModule {}

@NgModule({ imports: [TcMultiSelectComponent], exports: [TcMultiSelectComponent] })
export class MultiSelectModule {}

@NgModule({ imports: [TcNumberInputComponent], exports: [TcNumberInputComponent] })
export class InputNumberModule {}

@NgModule({ imports: [TcSelectButtonComponent], exports: [TcSelectButtonComponent] })
export class SelectButtonModule {}

@NgModule({ imports: [TcTagComponent], exports: [TcTagComponent] })
export class TagModule {}

@NgModule({ imports: [TcToggleButtonComponent], exports: [TcToggleButtonComponent] })
export class ToggleButtonModule {}
