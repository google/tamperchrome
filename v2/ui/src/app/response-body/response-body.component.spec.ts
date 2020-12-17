import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseBodyComponent } from './response-body.component';

describe('ResponseBodyComponent', () => {
  let component: ResponseBodyComponent;
  let fixture: ComponentFixture<ResponseBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResponseBodyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
