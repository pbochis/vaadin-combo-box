import {
  Input,
  Injector,
  OnInit,
  Directive,
  ElementRef,
  Output,
  HostListener,
  EventEmitter,
  Provider,
  forwardRef,
  Renderer,
  DoCheck,
  IterableDiffers
} from 'angular2/core';
import { NgControl, NG_VALUE_ACCESSOR, DefaultValueAccessor } from 'angular2/common';
import { CONST_EXPR } from 'angular2/src/facade/lang';
declare var Polymer;

const VAADIN_COMBO_BOX_CONTROL_VALUE_ACCESSOR = CONST_EXPR(new Provider(
    NG_VALUE_ACCESSOR, {
      useExisting: forwardRef(() => VaadinComboBox),
      multi: true
    }));

@Directive({
  selector: 'vaadin-combo-box',
  providers: [VAADIN_COMBO_BOX_CONTROL_VALUE_ACCESSOR]
})
export class VaadinComboBox extends DefaultValueAccessor implements OnInit, DoCheck {

  @Input()
  items: any[];

  private _element;
  private _control;
  private _differ;
  private _initialValueSet = false;

  ngOnInit() {
    this._control = this._injector.get(NgControl, null);
  }

  ngDoCheck() {
    const changes = this._differ.diff(this.items);
    if (changes) {

      // The items property must be set to a clone of the collection because of
      // how iron-list behaves.
      this._element.items = changes.collection.slice(0);
    }
  }

  @Output() valueChange: EventEmitter<any> = new EventEmitter(false);
  @HostListener('value-changed', ['$event.detail.value'])
  valuechanged(value) {
    this.valueChange.emit(value);

    if (this._initialValueSet) {
      // Do not trigger onChange when the initial (empty) value is set
      // to keep the field as "pristine".
      this.onChange(value);
    } else {
      this._initialValueSet = true;
    }

    // Pass the invalid state to our native vaadin-date-picker element if
    // it is an ngControl.
    if (this._control != null) {
      this._element.invalid = !this._control.pristine && !this._control.valid;
    }
  }

  constructor(renderer: Renderer, el: ElementRef,  private _injector: Injector, differs: IterableDiffers) {
    super(renderer, el);

    if (!(<any>window).Polymer || !Polymer.isInstance(el.nativeElement)) {
      console.error("vaadin-combo-box has not been imported yet, please remember to import vaadin-combo-box.html in your main HTML page.");
      return;
    }

    this._element = el.nativeElement;
    this._differ = differs.find([]).create(null);

    this._element.$$('input').addEventListener('blur', () => {
      this.onTouched();
    });
  }
}
