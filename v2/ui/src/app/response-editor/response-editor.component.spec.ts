import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { InterceptorRequest } from 'src/interceptor.service';

import { ResponseEditorComponent } from './response-editor.component';

describe('ResponseEditorComponent', () => {
  let component: ResponseEditorComponent;
  let fixture: ComponentFixture<ResponseEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MatAutocompleteModule ],
      declarations: [ ResponseEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseEditorComponent);
    component = fixture.componentInstance;
    const req = {id:'1',url:'https://foo/',method:'',requestHeaders:[],responseHeaders:[]};
    component.request = new InterceptorRequest(req);
    component.request.addResponse(req, null, null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
