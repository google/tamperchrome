/// <reference types="chrome"/>
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
  id?: string;
  pendingRequest = false;
  pendingResponse = false;
  hasResponse = false;
  hasResponseBody = false;
  visibleInFilter = false;
  cleared = false;
  get pending(): boolean {
    return this.pendingRequest || this.pendingResponse;
  }
  get visible(): boolean {
    return !this.cleared && this.visibleInFilter;
  }

  constructor(private request: InterceptedData, private port?: chrome.runtime.Port) {
    this.method = request.method;
    this.url = request.url;
    this.headers = request.requestHeaders;
    this.requestBody = request.requestBody;
    this.id = request.id;
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
      this.port.postMessage({
        name: this.id,
        request: {
          method: this.method,
          url: this.url,
          requestHeaders: this.headers.filter(v => !v.disabled),
          requestBody: this.requestBody,
        }
      });
    }
    this.pendingRequest = false;
  }

  addResponse(request: InterceptedData) {
    this.request = request;
    this.status = request.status;
    this.responseHeaders = request.responseHeaders;
    this.pendingResponse = true;
    this.hasResponse = true;
  }

  async getResponseBody() {
    if (this.responseBody) { return this.responseBody; }
    return this.responseBody = await new Promise(res=>{
      this.port.onMessage.addListener(msg => {
        if (msg.name === this.id + '-body') {
          this.hasResponseBody = true;
          res(msg.data);
        }
      });
      this.port.postMessage({
        name: this.id + '-body',
      });
    });
  }

  sendResponse() {
    this.port.postMessage({
      name: this.id + '-res',
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
  port: chrome.runtime.Port;

  private waitForChange: Promise<void> = Promise.resolve();
  private triggerChange: (_: any) => void = null;

  constructor() {
    this.changes = this.getChanges();
    this.port = chrome.runtime.connect({ name: 'tamperchrome' });
  }

  startListening(window: Window) {
    this.port.onMessage.addListener((msg) => {
      if (msg.name === 'onRequest') { this.onRequest(msg.data.request); }
      if (msg.name === 'onResponse') { this.onResponse(msg.data.response); }
    });
    this.port.postMessage({name: 'capture', data: { pattern: '*' }});
  }

  onRequest(request) {
    this.addRequest(request);
  }

  onResponse(response) {
    this.addResponse(response);
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
    this.port.postMessage({name: 'reloadTab'});
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

  private addRequest(request: InterceptedData) {
    const intRequest = new InterceptorRequest(request, this.port);
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

  private addResponse(response: InterceptedData) {
    if (!this.requestMap.has(response.id)) {
      this.addRequest(response);
    }
    const intRequest = this.requestMap.get(response.id);
    intRequest.addResponse(response);
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
