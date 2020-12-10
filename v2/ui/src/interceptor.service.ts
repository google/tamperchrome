import { Injectable } from '@angular/core';
import { InterceptedData } from "../../common/types";


export class InterceptorRequest {
  method: string;
  readonly host: string;
  readonly path: string;
  readonly query: string;
  type: string;
  url: string;
  headers: Array<{name: string, value: string}>;
  requestBody?: string;
  pending: boolean = true;
  visible: boolean = false;

  constructor(private request: InterceptedData, private port: MessagePort) {
    this.method = request.method;
    this.url = request.url;
    this.headers = request.requestHeaders;
    this.requestBody = request.requestBody;
    const url = new URL(this.url);
    this.host = url.host;
    this.path = url.pathname;
    this.query = url.search;
  }

  respond() {
    this.port.postMessage({request: {
      method: this.method,
      url: this.url,
      requestHeaders: this.headers,
      requestBody: this.requestBody,
    }});
    this.pending = false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {
  enabled: boolean = false;
  filters: string[] = [];

  requests: InterceptorRequest[] = [];

  private waitForChange: Promise<void> = Promise.resolve();
  private triggerChange: Function = null;
  changes;

  constructor() {
    this.changes = this.getChanges();
  }

  private async *getChanges() {
    while(true) {
      await this.waitForChange;
      this.waitForChange = new Promise(res=>{
        this.triggerChange = res;
      });
      yield;
    }
  }

  private addRequest(request: InterceptedData, port: MessagePort) {
    console.log(request);
    const intRequest = new InterceptorRequest(request, port);
    const filtered = this.filterRequest(intRequest);
    if (!this.enabled || !filtered) intRequest.respond();
    intRequest.visible = filtered;
    this.requests.push(intRequest);
    if (filtered) {
      this.triggerChange();
    }
  }

  private filterRequests() {
    for (const request of this.requests) {
      request.visible = this.filterRequest(request);
    }
  }

  private filterRequest(request: InterceptorRequest) {
    return this.filters.every(
      filter=>Object.values(request).some(
        field=>field==filter))
  }

  startListening(window: Window) {
    window.addEventListener('message', e => {
      if (e.data.event == 'onRequest') this.onRequest(e.data.request, e.ports[0]);
      if (e.data.event == 'onResponse') this.onResponse(e.data.response, e.ports[0]);
    });
    window.postMessage({'event': 'capture', 'pattern': '*'}, '*');
  }

  onRequest(request, port: MessagePort) {
    this.addRequest(request, port);
  }

  onResponse(response, port: MessagePort) {
    console.log(response);
    port.postMessage({response: {}});
  }

  setFilters(filters: string[]) {
    this.filters = filters;
    this.filterRequests();
    this.triggerChange();
  }

  setInterceptEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}
