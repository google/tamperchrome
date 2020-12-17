import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RequestBodyComponent } from './request-body.component';
import { InterceptorRequest, InterceptorService } from '../../interceptor.service';

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
    component.request = new InterceptorRequest({id: '1', method: '', url: 'https://foo/', requestHeaders: []});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
