import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {
  enabled: boolean = false;
  filters: string[];

  constructor() { }

  setFilters(filters: string[]) {
    this.filters = filters;
  }

  setInterceptEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}
