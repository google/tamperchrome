import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseEditorComponent } from './response-editor.component';

describe('ResponseEditorComponent', () => {
  let component: ResponseEditorComponent;
  let fixture: ComponentFixture<ResponseEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResponseEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
