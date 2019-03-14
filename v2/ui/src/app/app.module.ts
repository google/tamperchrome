import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule, MatCheckboxModule } from '@angular/material';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material';
import { MatChipsModule, MAT_CHIPS_DEFAULT_OPTIONS } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, SPACE, ENTER } from '@angular/cdk/keycodes';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RequestFilterComponent } from './request-filter/request-filter.component';
import { MatListModule } from '@angular/material/list';
import { RequestListComponent, RequestListItem } from './request-list/request-list.component';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RequestEditorComponent } from './request-editor/request-editor.component';



@NgModule({
	declarations: [
		AppComponent,
		RequestFilterComponent,
		RequestListComponent,
		RequestListItem,
		RequestEditorComponent,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MatButtonModule,
		MatCheckboxModule,
		ReactiveFormsModule,
		FormsModule,
		MatAutocompleteModule,
		MatFormFieldModule,
		MatInputModule,
		MatChipsModule,
		MatIconModule,
		MatSlideToggleModule,
		FlexLayoutModule,
		MatListModule,
		MatTableModule,
		MatToolbarModule
	],
	providers: [{
		provide: MAT_CHIPS_DEFAULT_OPTIONS,
		useValue: {
			separatorKeyCodes: [ENTER, SPACE, COMMA]
		}
	}],
	bootstrap: [AppComponent]
})
export class AppModule { }
