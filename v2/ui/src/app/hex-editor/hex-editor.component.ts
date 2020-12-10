import { Component, Directive, OnInit, EventEmitter, ElementRef, ViewChildren, QueryList, Input, Output } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { UP_ARROW, DOWN_ARROW } from '@angular/cdk/keycodes';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';

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

@Directive({
	selector: '[app-hex-editor-grid-cell]',
	inputs: ['index', 'keyManager', 'size'],
	host: {
		'autocomplete': 'off',
		'role': 'gridcell',
		'(click)': 'keyManager?.setActiveItem(index)',
		'[attr.size]': 'size',
		'[attr.maxlength]': 'size',
		'[attr.aria-colindex]': '(index%16) + 1',
		'[attr.aria-rowindex]': '(index/16) + 1',
		'[attr.tabindex]': '(keyManager?.activeItemIndex || 0) == index ? 0 : -1',
		'[attr.data-hex-editor-active]': '(keyManager?.activeItemIndex || 0) == index',
	}
})
export class HexEditorGridCell {
	index: number;
	keyManager: FocusKeyManager<HexEditorCharacter>;
}

@Component({
	selector: 'app-hex-editor',
	templateUrl: './hex-editor.component.html',
	styleUrls: ['./hex-editor.component.scss']
})
export class HexEditorComponent {
	@Input() set value(v: string) {
		this.charValues = v.split('');
		this.hexValues = this.charValues.map(c => c ? c.charCodeAt(0).toString(16) : '');
	}
	@Output() valueChange = new EventEmitter<string>();

	charValues: string[] = [];
	hexValues: string[] = [];
	keyManager: FocusKeyManager<HexEditorCharacter> = null;
	@ViewChildren(HexEditorCharacter) charInputs: QueryList<HexEditorCharacter>;
	@ViewChildren(HexEditorCharacterShadow) shadows: QueryList<HexEditorCharacterShadow>;
	ngAfterViewInit() {
		this.charInputs.changes.subscribe(t=>{
			setTimeout(()=>this.updateInputs());
		});
		setTimeout(()=>this.updateInputs());
		this.scrollDispatcher.scrolled().subscribe((scrollable: CdkScrollable) => {
			if (scrollable) {
				const top = scrollable.measureScrollOffset('top');
				Array.from(this.scrollDispatcher.scrollContainers.keys())
				.filter(otherScrollable => otherScrollable && otherScrollable !== scrollable)
				.forEach(otherScrollable => {
					if (otherScrollable.measureScrollOffset('top') !== top) {
						otherScrollable.scrollTo({top});
					}
				});
			}
		});
	}

	updateInputs() {
		this.keyManager = new FocusKeyManager(this.charInputs)
			.withHorizontalOrientation('ltr')
			.withVerticalOrientation(false);
		this.keyManager.setFirstItemActive();
	}

	onValueChange() {
		const oldHex = this.hexValues.join();
		this.hexValues = this.charValues.map(c => c ? c.charCodeAt(0).toString(16) : '');
		if (oldHex != this.hexValues.join()) {
			this.keyManager.setNextItemActive();
			const element = this.shadows.find((shadow) =>
				shadow.index == this.keyManager.activeItem.index
			).el.nativeElement;
			element.focus();
			element.select();
		}
		this.valueChange.emit(this.charValues.join(''));
	}

	onHexChange(i: number) {
		let prevValue = this.charValues[i];
		this.charValues = this.hexValues.map(h => h ? String.fromCharCode(parseInt(h, 16)) : '');
		if (this.hexValues[i].length == 2 && prevValue != this.charValues[i]) {
			this.keyManager.setNextItemActive();
		}
		this.valueChange.emit(this.charValues.join(''));
	}

	onKeydown(event: KeyboardEvent) {
		const currentIndex = this.keyManager.activeItemIndex;
		switch (event.keyCode) {
			case UP_ARROW:
				this.keyManager.setActiveItem(Math.max(0, currentIndex - 16));
				break;
			case DOWN_ARROW:
				this.keyManager.setActiveItem(
					Math.min(this.charInputs.length - 1, currentIndex + 16));
				break;
			default:
				this.keyManager.onKeydown(event);
		}
	}

	trackByFn(index, char) {
		return index;
	}

	getRowIndex() {
		return Array.from(Array(Math.ceil(this.charValues.length / 16)).keys());
	}

	constructor(private scrollDispatcher: ScrollDispatcher) {}

}
