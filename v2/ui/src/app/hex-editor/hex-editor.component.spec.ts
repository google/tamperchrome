import { ScrollingModule } from '@angular/cdk/scrolling';
import { ComponentFixture, ComponentFixtureAutoDetect, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HexEditorComponent, HexEditorCharacterDirective, HexEditorCharacterShadowDirective } from './hex-editor.component';
import { animationFrameScheduler } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DOWN_ARROW, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';

describe('HexEditorComponent', () => {
  let component: HexEditorComponent;
  let fixture: ComponentFixture<HexEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HexEditorComponent, HexEditorCharacterDirective, HexEditorCharacterShadowDirective ],
      imports: [ ScrollingModule, FormsModule ],
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HexEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the value in view', async () => {
    const val = 'omg';
    component.value = val;
    expect(component.charValues.length).toBe(val.length);
    expect(component.hexValues.length).toBe(val.length);
    fixture.detectChanges();
    await fixture.whenRenderingDone();
    expect(fixture.debugElement.queryAll(By.directive(HexEditorCharacterDirective)).length).toBe(val.length);
    expect(fixture.debugElement.queryAll(By.directive(HexEditorCharacterShadowDirective)).length).toBe(val.length);
  });

  it('should propagate readonly to view', async () => {
    component.value = 'foo';
    component.readonly = true;
    fixture.detectChanges();
    await fixture.whenRenderingDone();
    const els = fixture.debugElement.nativeElement.querySelectorAll('input,textarea');
    for(const el of els) {
      expect(el.readOnly).toBeTrue();
    }
    component.readonly = false;
    fixture.detectChanges();
    await fixture.whenRenderingDone();
    for(const el of els) {
      expect(el.readOnly).toBeFalse();
    }
  });

  it('should propagate changes within model', async () => {
    component.value = 'foo';
    let val;
    component.valueChange.subscribe(v=>val=v);
    component.hexValues[0] = 'z'.charCodeAt(0).toString(16);
    component.onHexChange(0);
    expect(val).toBe('zoo');
  });

  it('should react to arrow', async () => {
    const val = '1234567890123456foobar';
    component.value = val;
    expect(component.charValues.length).toBe(val.length);
    expect(component.hexValues.length).toBe(val.length);
    fixture.detectChanges();
    await fixture.whenRenderingDone();
    const firstChar = fixture.debugElement.query(By.directive(HexEditorCharacterDirective));
    const extra = {keyCode: DOWN_ARROW};
    firstChar.nativeElement.dispatchEvent(new KeyboardEvent('keydown', {bubbles: true, ...extra}));
    fixture.detectChanges();
    expect(component.keyManager.activeItem.index).toBe(16);
  });
});
