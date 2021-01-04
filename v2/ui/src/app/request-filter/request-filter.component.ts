import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { InterceptorService } from '../../interceptor.service';

export interface FilterSuggestion {
	label: string;
	values: string[];
}

export const filter = (label: string, opt: string[], value: string): string[] => {
	const filterValue = value.toLowerCase();

	return opt.filter(item =>
		label.toLowerCase().includes(filterValue) ||
		item.toLowerCase().includes(filterValue) ||
		(label + ':' + item).toLowerCase().includes(filterValue));
};

@Component({
  selector: 'app-request-filter',
  templateUrl: './request-filter.component.html',
  styleUrls: ['./request-filter.component.css']
})
export class RequestFilterComponent implements OnInit {
	@ViewChild('autoGroup', { static: true }) matAutocomplete: MatAutocomplete;
	@ViewChild('filterInputElement', { static: true }) filterInputElement: ElementRef<HTMLInputElement>;

	filterInputForm: FormGroup = this.fb.group({
		filterInputGroup: '',
	});

	filterSuggestionOptions: Observable<FilterSuggestion[]>;

	filterChips: Set<string> = new Set<string>();

	constructor(private fb: FormBuilder, private interceptor: InterceptorService) { }

	add(event: MatChipInputEvent): void {
		if (!this.matAutocomplete.isOpen) {
			const input = event.input;
			const value = event.value;
			if ((value || '').trim()) {
				this.filterChips.add(value.trim());
				this.interceptor.setFilters([...this.filterChips]);
			}
			if (input) {
				input.value = '';
			}
			this.filterInputForm.get('filterInputGroup').setValue(null);
		}
	}

	selected(event: MatAutocompleteSelectedEvent): void {
		this.filterChips.add(event.option.viewValue);
		this.interceptor.setFilters([...this.filterChips.values()]);
		this.filterInputElement.nativeElement.value = '';
		this.filterInputForm.get('filterInputGroup').setValue(null);
	}

	remove(filterChip: string): void {
		this.filterChips.delete(filterChip);
		this.interceptor.setFilters([...this.filterChips]);
		if (this.filterChips.size === 0) {
			this.filterInputElement.nativeElement.focus();
		}
	}

	intercept(event: MatSlideToggleChange): void {
		this.interceptor.setInterceptEnabled(event.checked);
	}

	clear(): void {
		this.interceptor.clearSent();
	}

	reload(): void {
		this.interceptor.reloadTab();
	}

	ngOnInit() {
		this.filterSuggestionOptions = this.filterInputForm.get('filterInputGroup').valueChanges
			.pipe(
				startWith(''),
				map(value => this.filterGroup(value))
			);
	}

	private filterGroup(value: string): FilterSuggestion[] {
		if (value) {
			const methods = new Set<string>();
			const domains = new Set<string>();
			const paths = new Set<string>();
			const queries = new Set<string>();
			for (const request of this.interceptor.requests) {
				methods.add(request.method);
				domains.add(request.host);
				paths.add(request.path);
				queries.add(request.query);
			}
			const filterSuggestions: FilterSuggestion[] = [{
				label: 'method',
				values: [...methods.values()]
			}, {
				label: 'domain',
				values: [...domains.values()]
			}, {
				label: 'path',
				values: [...paths.values()]
			}, {
				label: 'query',
				values: [...queries.values()]
			}];
			return filterSuggestions
				.map(group => ({ label: group.label, values: filter(group.label, group.values, value) }))
				.filter(group => group.values.length > 0);
		}

		return [];
	}
}
