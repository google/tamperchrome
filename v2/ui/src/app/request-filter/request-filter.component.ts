import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatChipInputEvent, MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface FilterSuggestion {
	label: string;
	values: string[];
}

export const _filter = (label: string, opt: string[], value: string): string[] => {
	const filterValue = value.toLowerCase();

	return opt.filter(item =>
		label.toLowerCase().indexOf(filterValue) === 0 ||
		item.toLowerCase().indexOf(filterValue) === 0 ||
		(label + ':' + item).toLowerCase().indexOf(filterValue) === 0);
};

@Component({
  selector: 'app-request-filter',
  templateUrl: './request-filter.component.html',
  styleUrls: ['./request-filter.component.css']
})
export class RequestFilterComponent implements OnInit {

	filterInputForm: FormGroup = this.fb.group({
		filterInputGroup: '',
	});

	filterSuggestions: FilterSuggestion[] = [{
		label: 'method',
		values: ['GET', 'POST']
	},{
		label: 'domain',
		values: ['example.com', 'example.net']
	}];

	filterSuggestionOptions: Observable<FilterSuggestion[]>;

	filterChips: Set<string> = new Set<string>();

	@ViewChild('autoGroup') matAutocomplete: MatAutocomplete;
	@ViewChild('filterInputElement') filterInputElement: ElementRef<HTMLInputElement>;

	constructor(private fb: FormBuilder) { }

	add(event: MatChipInputEvent): void {
		if (!this.matAutocomplete.isOpen) {
			const input = event.input;
			const value = event.value;
			if ((value || '').trim()) {
				this.filterChips.add(value.trim());
			}
			if (input) {
				input.value = '';
			}
			this.filterInputForm.get('filterInputGroup').setValue(null);
		}
	}

	selected(event: MatAutocompleteSelectedEvent): void {
		this.filterChips.add(event.option.viewValue);
		this.filterInputElement.nativeElement.value = '';
		this.filterInputForm.get('filterInputGroup').setValue(null);
	}

	remove(filterChip: string): void {
		this.filterChips.delete(filterChip);
	}

	ngOnInit() {
		this.filterSuggestionOptions = this.filterInputForm.get('filterInputGroup')!.valueChanges
			.pipe(
				startWith(''),
				map(value => this._filterGroup(value))
			);
	}

	private _filterGroup(value: string): FilterSuggestion[] {
		if (value) {
			return this.filterSuggestions
				.map(group => ({ label: group.label, values: _filter(group.label, group.values, value) }))
				.filter(group => group.values.length > 0);
		}

		return this.filterSuggestions;
	}
}