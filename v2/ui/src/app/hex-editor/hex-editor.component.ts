import { Component, Directive, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';

@Directive({
	selector: '[app-hex-editor-character]',
	inputs: ['request'],
})
export class HexEditorCharacter implements FocusableOption {
	request: Request;
	constructor(public el: ElementRef<any>) { }
	focus() {
		this.el.nativeElement.focus();
	}
	disabled = false;
}

@Component({
	selector: 'app-hex-editor',
	templateUrl: './hex-editor.component.html',
	styleUrls: ['./hex-editor.component.scss']
})
export class HexEditorComponent implements OnInit {
	value: string[] =
		('0123456789ABCDEFFEDCBA9876543210' +
		'0123456789ABCDEFFEDCBA9876543210').split('');
	hexValues: string[] = [];
	keyManager: FocusKeyManager<HexEditorCharacter> = null;
	@ViewChildren(HexEditorCharacter) charInputs: QueryList<HexEditorCharacter>;
	ngAfterViewInit() {
		this.keyManager = new FocusKeyManager(this.charInputs)
			.withHorizontalOrientation('ltr');
		this.keyManager.setFirstItemActive();
	}
	constructor() {
		this.hexValues = this.value.map(c => c.charCodeAt(0).toString(16));
	}

	ngOnInit() { }

	onValueChange() {
		this.hexValues = this.value.map(c => c?c.charCodeAt(0).toString(16):'');
	}

	onHexChange() {
		this.value = this.hexValues.map(h => String.fromCharCode(parseInt(h, 16)));
	}

	trackByFn(index, char) {
		return index;
	}

}
