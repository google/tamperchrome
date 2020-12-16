import { Component, AfterViewInit, Directive, Input, QueryList, ElementRef, ViewChildren } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { InterceptorRequest } from '../../interceptor.service';

@Directive({
	selector: '[appRequestEditorHeaderItem]',
})
export class RequestEditorHeaderItemDirective implements FocusableOption {
	disabled = false;
	constructor(public el: ElementRef<any>) { }
	focus() {
		let element = this.el.nativeElement.querySelector('input:focus');
		if (!element) { element = this.el.nativeElement.querySelector('input:not([disabled])'); }
		element.focus();
	}
}

@Component({
	selector: 'app-request-editor',
	templateUrl: './request-editor.component.html',
	styleUrls: ['./request-editor.component.scss']
})
export class RequestEditorComponent implements AfterViewInit {
	@Input() request: InterceptorRequest;
	@ViewChildren(RequestEditorHeaderItemDirective) headerItems: QueryList<RequestEditorHeaderItemDirective>;

	keyManager: FocusKeyManager<RequestEditorHeaderItemDirective> = null;
	ngAfterViewInit() {
		setTimeout(() => {
			this.keyManager = new FocusKeyManager(this.headerItems);
			this.keyManager.updateActiveItem(0);
		});
	}
	addHeader() {
		this.request.headers.push({name: '', value: ''});
		setTimeout(() => {
			this.keyManager.setLastItemActive();
		});
	}
}
