import { Component, Directive, OnInit, AfterViewInit, Output, EventEmitter,
	ViewChild, ViewChildren, QueryList, ElementRef, Input, HostListener } from '@angular/core';
import { FocusKeyManager, FocusableOption, ListKeyManagerOption } from '@angular/cdk/a11y';
import { MatTableDataSource } from '@angular/material/table';
import { InterceptorService, InterceptorRequest } from '../../interceptor.service';
import { MatTable } from '@angular/material/table';


@Directive({
	selector: '[appRequestListItem]',
})
export class RequestListItemDirective implements FocusableOption, ListKeyManagerOption {
	@Input() disabled = false;
	@Input() request: InterceptorRequest = null;

	constructor(public el: ElementRef<any>) { }

	focus() {
		this.el.nativeElement.focus();
	}

	getLabel() {
		return this.request.method + ' ' + this.request.path + this.request.query;
	}
}

@Component({
	selector: 'app-request-list',
	templateUrl: './request-list.component.html',
	styleUrls: ['./request-list.component.scss'],
})
export class RequestListComponent implements OnInit, AfterViewInit {
	@Output() selected = new EventEmitter<InterceptorRequest>();
	@ViewChildren(RequestListItemDirective) listItems: QueryList<RequestListItemDirective>;
	@ViewChild(MatTable, { static: true }) table: MatTable<any>;
	requests: InterceptorRequest[] = this.interceptor.requests;
	displayedColumns: Array<string> = ['method', 'host', 'pathquery', 'type', 'status'];
	dataSource: MatTableDataSource<InterceptorRequest> = new MatTableDataSource(this.requests);
	keyManager: FocusKeyManager<RequestListItemDirective> = null;
	firstRequestIndex = 0;
	scrollToBottom = true;
	constructor(private elRef: ElementRef, private interceptor: InterceptorService) { }
	@HostListener('scroll', ['$event'])
	onScroll(event) {
		const element = this.elRef.nativeElement;
		this.scrollToBottom = element.scrollTop >= element.scrollHeight - element.clientHeight;
	}
	ngOnInit() { this.updateTable(); }
	ngAfterViewInit() {
		this.keyManager = new FocusKeyManager(this.listItems).withHomeAndEnd().withTypeAhead();
		this.keyManager.change.subscribe({
			next: (v) => this.selected.emit(this.requests[v])
		});
	}
	isActive(index: number) {
		if (this.keyManager && this.keyManager.activeItem) {
			return this.keyManager.activeItemIndex === index;
		}
		return index === this.firstRequestIndex;
	}
	setActive(item: RequestListItemDirective) {
		this.keyManager.setActiveItem(item);
	}
	maybeScrollToBottom() {
		if (!this.scrollToBottom) { return; }
		const element = this.elRef.nativeElement;
		element.scrollTop = element.scrollHeight - element.clientHeight;
	}
	async updateTable() {
		for await (const change of this.interceptor.changes) {
			this.table?.renderRows();
			if (!this.keyManager?.activeItem?.request.visible) {
				this.keyManager.updateActiveItem(null);
			}
			this.firstRequestIndex = this.requests.findIndex(r=>r.visible);
			this.maybeScrollToBottom();
		}
	}
}
