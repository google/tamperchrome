import { Component, OnInit, Directive, QueryList, ElementRef, ViewChildren } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';

class HttpHeader {
	name: string;
	value: string;
}

@Directive({
	selector: '[app-request-editor-header-item]',
})
export class RequestEditorHeaderItem implements FocusableOption {
	constructor(public el: ElementRef<any>) {
		console.log('new', this);
	}
	focus() {
		console.log('focused', this);
		this.el.nativeElement.querySelector('input').focus();
	}
	disabled = false;
}

@Component({
	selector: 'app-request-editor',
	templateUrl: './request-editor.component.html',
	styleUrls: ['./request-editor.component.scss']
})
export class RequestEditorComponent implements OnInit {
	ngOnInit() { }
	keyManager: FocusKeyManager<RequestEditorHeaderItem> = null;
	headers: Array<Array<string>> = [
		['Host', 'www.google.com'],
		['User-Agent', 'evilwebsite.com'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*'],
		['Accept', '*/*']
	];
	@ViewChildren(RequestEditorHeaderItem) headerItems: QueryList<RequestEditorHeaderItem>;
	ngAfterViewInit() {
		setTimeout(()=>{
			this.keyManager = new FocusKeyManager(this.headerItems);
			this.keyManager.updateActiveItem(0);
		});
	}
}
