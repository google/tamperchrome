import { Component, Directive, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { UP_ARROW, DOWN_ARROW } from '@angular/cdk/keycodes';

@Directive({
	selector: '[app-hex-editor-character]',
	inputs: ['request', 'index'],
})
export class HexEditorCharacter implements FocusableOption {
	request: Request;
	index: number;
	constructor(public el: ElementRef<any>) { }
	focus() {
		const element = this.el.nativeElement;
		element.focus();
		element.select();
	}
	disabled = false;
}

@Directive({
	selector: '[app-hex-editor-character-shadow]',
	inputs: ['index']
})
export class HexEditorCharacterShadow {
	index: number;
	constructor(public el: ElementRef<any>) { }
}

@Component({
	selector: 'app-hex-editor',
	templateUrl: './hex-editor.component.html',
	styleUrls: ['./hex-editor.component.scss']
})
export class HexEditorComponent implements OnInit {
	value: string[] = ('0123456789ABCDEFFEDCBA9876543210' +
		'0123456789ABCDEFFEDCBA9876543210').split('');
	hexValues: string[] = [];
	keyManager: FocusKeyManager<HexEditorCharacter> = null;
	@ViewChildren(HexEditorCharacter) charInputs: QueryList<HexEditorCharacter>;
	@ViewChildren(HexEditorCharacterShadow) shadows: QueryList<HexEditorCharacterShadow>;
	ngAfterViewInit() {
		this.keyManager = new FocusKeyManager(this.charInputs)
			.withHorizontalOrientation('ltr')
			.withVerticalOrientation(false);
		this.keyManager.setFirstItemActive();
	}
	constructor() {
		this.hexValues = this.value.map(c => c ? c.charCodeAt(0).toString(16) : '');
	}

	ngOnInit() { }

	onValueChange() {
		const oldHex = this.hexValues.join();
		this.hexValues = this.value.map(c => c ? c.charCodeAt(0).toString(16) : '');
		if (oldHex != this.hexValues.join()) {
			this.keyManager.setNextItemActive();
			const element = this.shadows.find((shadow) =>
				shadow.index == this.keyManager.activeItem.index
			).el.nativeElement;
			element.focus();
			element.select();
		}
	}

	onHexChange() {
		this.value = this.hexValues.map(h => h ? String.fromCharCode(parseInt(h, 16)) : '');
	}

	onKeydown(event: KeyboardEvent) {
		const currentIndex = this.keyManager.activeItemIndex;
		switch (event.keyCode) {
			case UP_ARROW:
				this.keyManager.setActiveItem(Math.max(0, currentIndex - 32));
				break;
			case DOWN_ARROW:
				this.keyManager.setActiveItem(
					Math.min(this.charInputs.length - 1, currentIndex + 32));
				break;
			default:
				this.keyManager.onKeydown(event);
		}
	}

	trackByFn(index, char) {
		return index;
	}

}
