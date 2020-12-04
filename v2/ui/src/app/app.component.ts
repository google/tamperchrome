import { Component, OnInit } from '@angular/core';
import { InterceptorService } from '../interceptor.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
	constructor (private interceptor: InterceptorService) { }
	ngOnInit() {
		this.interceptor.startListening(window);
	}
}