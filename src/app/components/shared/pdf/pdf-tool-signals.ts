import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { startWith } from 'rxjs';

/**
 * Convertit un FormControl (ReactiveForms) en Signal lisible via controlSignal().
 */
export function controlToSignal<T>(control: FormControl<T>) {
  return toSignal(control.valueChanges.pipe(startWith(control.value)), {
    initialValue: control.value,
  });
}
