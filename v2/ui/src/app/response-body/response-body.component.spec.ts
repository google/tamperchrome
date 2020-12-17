import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseBodyComponent } from './response-body.component';
import { InterceptorRequest, InterceptorService } from '../../interceptor.service';

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
    component.request = new InterceptorRequest({id: '1', method: '', url: 'https://foo/', requestHeaders: []});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
