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
  status?: number;
  responseHeaders: Array<{name: string; value: string; disabled?: boolean}>;
  responseBody?: string;
  pendingRequest = false;
  pendingResponse = false;
  hasResponse = false;
  hasResponseBody = false;
  visibleInFilter = false;
  cleared = false;
  private responsePort?: MessagePort;
  private bodyPort?: MessagePort;
  get pending(): boolean {
    return this.pendingRequest || this.pendingResponse;
  }
  get visible(): boolean {
    return !this.cleared && this.visibleInFilter;
  }

  constructor(private request: InterceptedData, private port?: MessagePort) {
    this.method = request.method;
    this.url = request.url;
    this.headers = request.requestHeaders;
    this.requestBody = request.requestBody;
    const url = new URL(this.url);
    this.host = url.host;
    this.path = url.pathname;
    this.query = url.search;
    if (this.port) {
      this.pendingRequest = true;
    }
  }

  sendRequest() {
    if (this.port) {
      this.port.postMessage({request: {
        method: this.method,
        url: this.url,
        requestHeaders: this.headers.filter(v => !v.disabled),
        requestBody: this.requestBody,
      }});
    }
    this.pendingRequest = false;
  }

  addResponse(request: InterceptedData, responsePort: MessagePort, bodyPort: MessagePort) {
    this.request = request;
    this.status = request.status;
    this.responseHeaders = request.responseHeaders;
    this.responsePort = responsePort;
    this.bodyPort = bodyPort;
    this.pendingResponse = true;
    this.hasResponse = true;
  }

  async getResponseBody() {
    if (this.responseBody) { return this.responseBody; }
    return this.responseBody = await new Promise(res=>{
      this.bodyPort.onmessage = e => {
        this.hasResponseBody = true;
        res(e.data);
      };
      this.bodyPort.postMessage(null);
    });
  }

  sendResponse() {
    this.responsePort.postMessage({
      response: {
        status: this.status,
        responseHeaders: this.responseHeaders.filter(v => !v.disabled),
        responseBody: this.responseBody
      }
    });
    this.pendingResponse = false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {
  enabled = false;
  filters: string[] = [];

  requests: InterceptorRequest[] = [];
  requestMap = new Map<string, InterceptorRequest>();
  changes;

  private waitForChange: Promise<void> = Promise.resolve();
  private triggerChange: (_: any) => void = null;

  constructor() {
    this.changes = this.getChanges();
  }

  startListening(window: Window) {
    window.addEventListener('message', e => {
      if (e.data.event === 'onRequest') { this.onRequest(e.data.request, e.ports[0]); }
      if (e.data.event === 'onResponse') { this.onResponse(e.data.response, e.ports[0], e.ports[1]); }
    });
    window.postMessage({event: 'capture', pattern: '*'}, '*');
  }

  onRequest(request, port: MessagePort) {
    this.addRequest(request, port);
  }

  onResponse(response, port: MessagePort, bodyPort: MessagePort) {
    this.addResponse(response, port, bodyPort);
  }

  setFilters(filters: string[]) {
    this.filters = filters;
    this.filterRequests();
    this.triggerChange(0);
  }

  setInterceptEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  clearSent() {
    for (const request of this.requests) {
      request.cleared = !request.pending;
    }
  }

  reloadTab() {
    window.postMessage({event: 'reloadTab'}, '*');
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

  private addRequest(request: InterceptedData, port?: MessagePort) {
    const intRequest = new InterceptorRequest(request, port);
    this.requestMap.set(request.id, intRequest);
    intRequest.visibleInFilter = this.filterRequest(intRequest);
    if (!this.enabled || !intRequest.visibleInFilter) {
      intRequest.sendRequest();
    }
    this.requests.push(intRequest);
    if (intRequest.visibleInFilter) {
      this.triggerChange(0);
    }
  }

  private addResponse(response: InterceptedData, port: MessagePort, bodyPort: MessagePort) {
    if (!this.requestMap.has(response.id)) {
      this.addRequest(response);
    }
    const intRequest = this.requestMap.get(response.id);
    intRequest.addResponse(response, port, bodyPort);
    if (!this.enabled || !intRequest.visibleInFilter) {
      intRequest.sendResponse();
    }
    if (intRequest.visibleInFilter) {
      this.triggerChange(0);
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
