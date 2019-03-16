import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HexEditorComponent } from './hex-editor.component';

describe('HexEditorComponent', () => {
  let component: HexEditorComponent;
  let fixture: ComponentFixture<HexEditorComponent>;

  beforeEach(async(() => {
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
});
