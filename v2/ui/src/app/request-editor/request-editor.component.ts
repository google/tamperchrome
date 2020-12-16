import { Component, OnInit, Directive, Input, QueryList, ElementRef, ViewChildren } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { InterceptorRequest } from '../../interceptor.service';

@Directive({
	selector: '[app-request-editor-header-item]',
})
export class RequestEditorHeaderItem implements FocusableOption {
	constructor(public el: ElementRef<any>) { }
	disabled = false;
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
export class RequestEditorComponent implements OnInit {
	@Input() request: InterceptorRequest;
	keyManager: FocusKeyManager<RequestEditorHeaderItem> = null;
	@ViewChildren(RequestEditorHeaderItem) headerItems: QueryList<RequestEditorHeaderItem>;
	ngOnInit() { }
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
