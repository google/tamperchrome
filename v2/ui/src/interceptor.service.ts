import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {
  enabled: boolean = false;
  filters: string[] = [];

  constructor() { }

  startListening(window: Window) {
    window.addEventListener('message', e => {
      if (e.data.event == 'onRequest') this.onRequest(e.data.request, e.ports[0]);
      if (e.data.event == 'onResponse') this.onResponse(e.data.response, e.ports[0]);
    });
    window.postMessage({'event': 'capture', 'pattern': '*'}, '*');
  }

  onRequest(request, port: MessagePort) {
    console.log(request);
    port.postMessage({request: {}});
  }

  onResponse(response, port: MessagePort) {
    console.log(response);
    port.postMessage({response: {}});
  }

  setFilters(filters: string[]) {
    this.filters = filters;
  }

  setInterceptEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}
