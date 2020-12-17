import { Component, Input, OnInit } from '@angular/core';
import { InterceptorRequest } from '../../interceptor.service';

@Component({
  selector: 'app-response-body',
  templateUrl: './response-body.component.html',
  styleUrls: ['./response-body.component.css']
})
export class ResponseBodyComponent implements OnInit {
  @Input() request: InterceptorRequest;

  constructor() { }

  ngOnInit(): void {
  }

}
