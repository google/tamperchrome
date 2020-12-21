import { Component, AfterViewInit, Directive, Input, QueryList, ElementRef, ViewChildren } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { InterceptorRequest } from '../../interceptor.service';

@Directive({
	selector: '[appResponseEditorHeaderItem]',
})
export class ResponseEditorHeaderItemDirective implements FocusableOption {
	disabled = false;
	constructor(public el: ElementRef<any>) { }
	focus() {
		let element = this.el.nativeElement.querySelector('input:focus');
		if (!element) { element = this.el.nativeElement.querySelector('input:not([disabled])'); }
		element.focus();
	}
}

@Component({
  selector: 'app-response-editor',
  templateUrl: './response-editor.component.html',
  styleUrls: ['./response-editor.component.css']
})
export class ResponseEditorComponent implements AfterViewInit {
	@Input() request: InterceptorRequest;
	@ViewChildren(ResponseEditorHeaderItemDirective) headerItems: QueryList<ResponseEditorHeaderItemDirective>;

	keyManager: FocusKeyManager<ResponseEditorHeaderItemDirective> = null;
	ngAfterViewInit() {
		setTimeout(() => {
			this.keyManager = new FocusKeyManager(this.headerItems);
			this.keyManager.updateActiveItem(0);
		});
	}
	addHeader() {
		this.request.responseHeaders.push({name: '', value: ''});
		setTimeout(() => {
			this.keyManager.setLastItemActive();
		});
	}
}
