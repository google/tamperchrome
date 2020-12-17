import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { InterceptorRequest } from 'src/interceptor.service';
import { RequestEditorComponent } from './request-editor.component';

describe('RequestEditorComponent', () => {
  let component: RequestEditorComponent;
  let fixture: ComponentFixture<RequestEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ MatAutocompleteModule ],
      declarations: [ RequestEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestEditorComponent);
    component = fixture.componentInstance;
    component.request = new InterceptorRequest({id: '1', method: '', url: 'https://foo/', requestHeaders: []});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
