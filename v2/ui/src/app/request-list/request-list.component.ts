import { Component, Directive, OnInit, Output, EventEmitter, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { MatListItem, MatTableDataSource } from '@angular/material';
import { InterceptorService, InterceptorRequest } from '../../interceptor.service';
import {MatTable} from '@angular/material';


@Directive({
	selector: '[app-request-list-item]',
	inputs: ['request'],
})
export class RequestListItem implements FocusableOption {
	request: InterceptorRequest;
	constructor(public el: ElementRef<any>) { }
	focus() {
		this.el.nativeElement.focus();
	}
	disabled = false;
}

@Component({
	selector: 'app-request-list',
	templateUrl: './request-list.component.html',
	styleUrls: ['./request-list.component.scss'],
})
export class RequestListComponent implements OnInit {
	@Output()
	selected = new EventEmitter<InterceptorRequest>();

	constructor(private interceptor: InterceptorService) { }
	ngOnInit() { this.updateTable() }

	requests: InterceptorRequest[] = this.interceptor.requests;
	displayedColumns: Array<string> = ['method', 'host', 'pathquery', 'type', 'status'];
	dataSource: MatTableDataSource<InterceptorRequest> = new MatTableDataSource(this.requests);
	keyManager: FocusKeyManager<RequestListItem> = null;
	@ViewChildren(RequestListItem) listItems: QueryList<RequestListItem>;
	ngAfterViewInit() {
		this.keyManager = new FocusKeyManager(this.listItems);
		this.keyManager.updateActiveItem(0);
		this.keyManager.change.subscribe({
			next: (v) => this.selected.emit(this.requests[v])
		});
	}
	@ViewChild(MatTable) table: MatTable<any>;
	async updateTable() {
		for await (const change of this.interceptor.changes) {
			this.table.renderRows();
			this.selected.emit(this.requests[this.keyManager.activeItemIndex]);
		}
	}
}
