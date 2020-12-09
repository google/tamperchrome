import { Component, Input, OnInit } from '@angular/core';
import { InterceptorRequest } from '../../interceptor.service';

@Component({
  selector: 'app-request-body',
  templateUrl: './request-body.component.html',
  styleUrls: ['./request-body.component.css']
})
export class RequestBodyComponent implements OnInit {
  @Input() request: InterceptorRequest;

  constructor() { }

  ngOnInit() {
  }

}
