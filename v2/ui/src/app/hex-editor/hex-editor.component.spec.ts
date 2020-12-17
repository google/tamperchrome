import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HexEditorComponent, HexEditorCharacterDirective } from './hex-editor.component';

describe('HexEditorComponent', () => {
  let component: HexEditorComponent;
  let fixture: ComponentFixture<HexEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HexEditorComponent ]
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

  // it('should render the value', () => {
  //   const val = 'omg';
  //   component.value = val;
  //   fixture.detectChanges();
  //   expect(component.chars.length).toBe(val.length);
  //   expect(component.shadows.length).toBe(val.length);
  // });

  // it('should propagate readonly', () => {
  //   component.value = 'foo';
  //   component.readonly = true;
  //   fixture.detectChanges();
  //   const els = fixture.debugElement.nativeElement.querySelectorAll('input,textarea');
  //   for(const el of els) {
  //     expect(el.readonly).toBeTrue();
  //   }
  //   component.readonly = false;
  //   fixture.detectChanges();
  //   for(const el of els) {
  //     expect(el.readonly).toBeFalse();
  //   }
  // });

  // it('should propagate changes', () => {
  //   component.value = 'foo';
  //   const firstChar = fixture.debugElement.query(By.directive(HexEditorCharacterDirective));
  //   firstChar.triggerEventHandler('click', {});
  //   fixture.detectChanges();
  //   firstChar.query(By.css('input')).nativeElement.value = 'z';
  //   fixture.detectChanges();
  // });
});
