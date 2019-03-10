import { Component, Directive, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FocusKeyManager, Highlightable, ListKeyManagerOption } from '@angular/cdk/a11y';
import { MatListItem, MatTableDataSource } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';


@Directive({
	selector: '[app-request-list-item]',
	host: { 'tabIndex': '-1' },
})
export class RequestListItem implements ListKeyManagerOption {
	constructor(public el: ElementRef<any>) { }
	focus() {
		this.el.nativeElement.focus();
	}
	disabled = false;
}

class Request {
	method: string;
	host: string;
	path: string;
	query: string;
}

@Component({
	selector: 'app-request-list',
	templateUrl: './request-list.component.html',
	styleUrls: ['./request-list.component.css']
})
export class RequestListComponent implements OnInit {
	requests: Array<Request> = [
		{ method: 'GET', host: 'www.example.com', path: '/path', query: '?q=a' },
		{ method: 'POST', host: 'www.example.net', path: '/file', query: '?' }
	];
	displayedColumns: Array<string> = ['method', 'host', 'path', 'query'];
	dataSource: MatTableDataSource<Request> = new MatTableDataSource(this.requests);;
	keyManager: FocusKeyManager<RequestListItem> = null;
	selection: SelectionModel<Request> = new SelectionModel(false);
	@ViewChildren(RequestListItem) listItems: QueryList<RequestListItem>;

	ngAfterViewInit() {
		this.keyManager = new FocusKeyManager(this.listItems);
	}

	ngOnInit() {
	}
}
