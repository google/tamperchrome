import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestEditorComponent } from './request-editor.component';

describe('RequestEditorComponent', () => {
  let component: RequestEditorComponent;
  let fixture: ComponentFixture<RequestEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
