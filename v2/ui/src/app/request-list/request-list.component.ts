import { Component, Directive, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FocusKeyManager, Highlightable, ListKeyManagerOption } from '@angular/cdk/a11y';
import { MatListItem, MatTableDataSource } from '@angular/material';

class Request {
	method: string;
	host: string;
	path: string;
	query: string;
}

@Directive({
	selector: '[app-request-list-item]',
	inputs: ['request'],
})
export class RequestListItem implements FocusableOption {
	request: Request;
	constructor(public el: ElementRef<any>) { }
	focus() {
		// Display the request.
	}
	disabled = false;
}

@Component({
	selector: 'app-request-list',
	templateUrl: './request-list.component.html',
	styleUrls: ['./request-list.component.css']
})
export class RequestListComponent implements OnInit {
	ngOnInit() {}

	requests: Array<Request> = [
		{ method: 'GET', host: 'www.example.com', path: '/path', query: '?q=a' },
		{ method: 'POST', host: 'www.example.net', path: '/file', query: '?' }
	];
	displayedColumns: Array<string> = ['method', 'host', 'path', 'query'];
	dataSource: MatTableDataSource<Request> = new MatTableDataSource(this.requests);;
	keyManager: FocusKeyManager<RequestListItem> = null;
	@ViewChildren(RequestListItem) listItems: QueryList<RequestListItem>;
	ngAfterViewInit() {
		this.keyManager = new FocusKeyManager(this.listItems);
		this.keyManager.setFirstItemActive();
	}
}
