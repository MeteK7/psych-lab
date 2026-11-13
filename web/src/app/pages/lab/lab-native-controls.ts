import { Component, computed, input, output } from '@angular/core';

import { Composed, SHOWN, lookupOf } from '../../shared/visual/composition/compose';
import { ChoiceControl, SliderControl, controlsOf, sliderValue } from '../../shared/visual/interaction/controls';
import { targetsOf } from '../../shared/visual/interaction/regions';
import { Values } from '../../shared/visual/integration/interactive-figure';

let groups = 0;

/**
 * Native controls for a figure's values (milestone M4 stage C), as an exercise puts them beside a
 * figure that takes the pointer only: a range input per axis of each handle and a radio group per
 * choice, made from the same description the figure gives (`controlsOf`), so both say the same.
 */
@Component({
  selector: 'app-lab-native-controls',
  styleUrls: ['./lab.css'],
  styles: `
    .controls { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; align-items: center; margin: 0.4rem 0 0; font-size: 0.9rem; }
    .controls label { display: inline-flex; gap: 0.5rem; align-items: center; }
    fieldset { border: 0; padding: 0; margin: 0; display: flex; gap: 1rem; align-items: center; }
    legend { float: left; margin-right: 0.5rem; padding: 0; }
  `,
  template: `
    <div class="controls">
      @for (c of controls(); track c.key) {
        @if (c.kind === 'slider') {
          <label>{{ c.label }}
            <input type="range" [attr.data-native]="c.key" [min]="c.min" [max]="c.max" [step]="c.step" [value]="c.now" [attr.aria-valuetext]="c.text"
                   (input)="slide(c, $any($event.target).valueAsNumber)" />
            <output>{{ c.text }}</output>
          </label>
        } @else {
          <fieldset>
            <legend>{{ c.label }}</legend>
            @for (o of c.options; track o.id) {
              <label><input type="radio" [name]="name + '-' + c.key" [attr.data-native]="o.id" [checked]="o.checked" (change)="choose(c, o.option)" /> {{ o.label }}</label>
            }
          </fieldset>
        }
      }
    </div>
  `,
})
export class LabNativeControls {
  readonly composed = input.required<Composed>();
  readonly values = input.required<Values>();
  readonly valuesChange = output<Values>();

  protected readonly name = `lab-native-${++groups}`;
  protected readonly controls = computed(() => {
    const composed = this.composed();
    return controlsOf(composed.scene, targetsOf(composed.scene, SHOWN), this.values(), lookupOf(composed));
  });

  protected slide(c: SliderControl, n: number): void {
    this.valuesChange.emit({ ...this.values(), [c.value]: sliderValue(c, n) });
  }

  protected choose(c: ChoiceControl, option: ChoiceControl['options'][number]['option']): void {
    this.valuesChange.emit({ ...this.values(), [c.value]: option });
  }
}
