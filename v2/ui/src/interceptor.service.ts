import { Injectable } from '@angular/core';
import { InterceptedData } from '../../common/types';


export class InterceptorRequest {
  method: string;
  readonly host: string;
  readonly path: string;
  readonly query: string;
  type: string;
  url: string;
  headers: Array<{name: string; value: string; disabled?: boolean}>;
  requestBody?: string;
  pending = true;
  visibleInFilter = false;
  cleared = false;

  get visible(): boolean {
    return !this.cleared && this.visibleInFilter;
  }

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
      requestHeaders: this.headers.filter(v => !v.disabled),
      requestBody: this.requestBody,
    }});
    this.pending = false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {
  enabled = false;
  filters: string[] = [];

  requests: InterceptorRequest[] = [];
  changes;

  private waitForChange: Promise<void> = Promise.resolve();
  private triggerChange: () => void = null;

  constructor() {
    this.changes = this.getChanges();
  }

  startListening(window: Window) {
    window.addEventListener('message', e => {
      if (e.data.event === 'onRequest') { this.onRequest(e.data.request, e.ports[0]); }
      if (e.data.event === 'onResponse') { this.onResponse(e.data.response, e.ports[0]); }
    });
    window.postMessage({event: 'capture', pattern: '*'}, '*');
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

  clearSent() {
    for (const request of this.requests) {
      request.cleared = !request.pending;
    }
  }

  private async *getChanges() {
    while (true) {
      await this.waitForChange;
      this.waitForChange = new Promise(res => {
        this.triggerChange = res;
      });
      yield;
    }
  }

  private addRequest(request: InterceptedData, port: MessagePort) {
    const intRequest = new InterceptorRequest(request, port);
    const filtered = this.filterRequest(intRequest);
    if (!this.enabled || !filtered) { intRequest.respond(); }
    intRequest.visibleInFilter = filtered;
    this.requests.push(intRequest);
    if (filtered) {
      this.triggerChange();
    }
  }

  private filterRequests() {
    for (const request of this.requests) {
      request.visibleInFilter = this.filterRequest(request);
    }
  }

  private filterRequest(request: InterceptorRequest) {
    return this.filters.every(
      filter => Object.values(request).some(
        field => field === filter));
  }
}
