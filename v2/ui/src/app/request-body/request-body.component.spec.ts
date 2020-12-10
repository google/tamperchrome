import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RequestBodyComponent } from './request-body.component';

describe('RequestBodyComponent', () => {
  let component: RequestBodyComponent;
  let fixture: ComponentFixture<RequestBodyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestBodyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
