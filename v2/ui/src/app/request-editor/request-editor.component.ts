import { Component, OnInit, Directive, Input, QueryList, ElementRef, ViewChildren } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { InterceptorRequest } from '../../interceptor.service';

@Directive({
	selector: '[app-request-editor-header-item]',
})
export class RequestEditorHeaderItem implements FocusableOption {
	constructor(public el: ElementRef<any>) { }
	focus() {
		let element = this.el.nativeElement.querySelector('input:focus');
		if (!element) element = this.el.nativeElement.querySelector('input');
		element.focus();
	}
	disabled = false;
}

@Component({
	selector: 'app-request-editor',
	templateUrl: './request-editor.component.html',
	styleUrls: ['./request-editor.component.scss']
})
export class RequestEditorComponent implements OnInit {
	@Input() request: InterceptorRequest;
	ngOnInit() { }
	keyManager: FocusKeyManager<RequestEditorHeaderItem> = null;
	@ViewChildren(RequestEditorHeaderItem) headerItems: QueryList<RequestEditorHeaderItem>;
	ngAfterViewInit() {
		setTimeout(()=>{
			this.keyManager = new FocusKeyManager(this.headerItems);
			this.keyManager.updateActiveItem(0);
		});
	}
}
