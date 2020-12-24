import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { By } from '@angular/platform-browser';

import { RequestFilterComponent } from './request-filter.component';
import { InterceptorService, InterceptorRequest } from 'src/interceptor.service';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('RequestFilterComponent', () => {
  let component: RequestFilterComponent;
  let fixture: ComponentFixture<RequestFilterComponent>;
  let interceptor: InterceptorService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestFilterComponent ],
      imports: [
        FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatInputModule,
        MatChipsModule, MatCardModule, MatIconModule, MatSlideToggleModule,
        BrowserAnimationsModule
       ],
      providers: [ InterceptorService ]
    }).compileComponents();
  }));

  beforeEach(() => {
    interceptor = TestBed.inject(InterceptorService);
    fixture = TestBed.createComponent(RequestFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create filters', () => {
    expect(component).toBeTruthy();
    spyOn(interceptor, 'setFilters');
    component.add({value: 'foo', input: null});
    expect(interceptor.setFilters).toHaveBeenCalledWith(['foo']);
    component.add({value: 'bar', input: null});
    expect(interceptor.setFilters).toHaveBeenCalledWith(['foo', 'bar']);
    component.remove('foo');
    expect(interceptor.setFilters).toHaveBeenCalledWith(['bar']);
  });

  it('should enable interception with filters', () => {
    expect(component).toBeTruthy();
    spyOn(interceptor, 'setFilters');
    spyOn(interceptor, 'setInterceptEnabled');
    component.add({value: 'foo', input: null});
    expect(interceptor.setFilters).toHaveBeenCalledOnceWith(['foo']);
    component.intercept({checked: true, source: null});
    expect(interceptor.setInterceptEnabled).toHaveBeenCalledWith(true);
    component.intercept({checked: false, source: null});
    expect(interceptor.setInterceptEnabled).toHaveBeenCalledWith(false);
  });

  it('should calculate autocomplete options', async () => {
    expect(component).toBeTruthy();
    const input = fixture.debugElement.query(By.directive(MatInput));
    interceptor.requests = [
      new InterceptorRequest({
        id: null, method: 'FOO', url: 'https://x/', requestHeaders: []
      })
    ];
    fixture.detectChanges();
    input.nativeElement.dispatchEvent(new Event('focusin'));
    input.nativeElement.value = 'FO';
    let lastOpts = null;
    component.filterSuggestionOptions.subscribe((opts)=>{
      lastOpts = opts;
    });
    input.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(lastOpts).toEqual([{
      label: 'method',
      values: ['FOO']
    }]);
  });
});
