import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestFilterComponent } from './request-filter.component';

describe('RequestFilterComponent', () => {
  let component: RequestFilterComponent;
  let fixture: ComponentFixture<RequestFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
