import { Injectable } from '@angular/core';
import { InterceptedData } from "../../common/types";


export class InterceptorRequest {
	method: string;
	host: string;
	path: string;
	query: string;
  type: string;
  private request: InterceptedData;
  constructor(request: InterceptedData) {
    this.method = request.method;
    const url = new URL(request.url);
    this.host = url.host;
    this.path = url.pathname;
    this.query = url.search;
    this.request = request;
  }
}

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {
  enabled: boolean = false;
  filters: string[] = [];

  requests: InterceptorRequest[] = [];
  private unfilteredRequests: InterceptorRequest[] = [];

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

  private addRequest(request: InterceptedData) {
    console.log(request);
    this.unfilteredRequests.push(new InterceptorRequest(request));
    this.filterRequests();
  }

  private filterRequests() {
    const requests = this.unfilteredRequests.filter(
      request=>this.filters.every(
        filter=>Object.values(request).some(
          field=>field==filter)));
    this.requests.splice(0, this.requests.length, ...requests);
    this.triggerChange();
  }

  startListening(window: Window) {
    window.addEventListener('message', e => {
      if (e.data.event == 'onRequest') this.onRequest(e.data.request, e.ports[0]);
      if (e.data.event == 'onResponse') this.onResponse(e.data.response, e.ports[0]);
    });
    window.postMessage({'event': 'capture', 'pattern': '*'}, '*');
  }

  onRequest(request, port: MessagePort) {
    this.addRequest(request);
    port.postMessage({request: {}});
  }

  onResponse(response, port: MessagePort) {
    console.log(response);
    port.postMessage({response: {}});
  }

  setFilters(filters: string[]) {
    this.filters = filters;
    this.filterRequests();
  }

  setInterceptEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}
