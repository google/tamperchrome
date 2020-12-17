import {
  Debuggee,
  Debugger_Network_requestIntercepted,
  Debugger_Network_ResponseBody,
  Debugger_Network_Request,
  Debugger_Fetch_requestPaused,
  Debugger_Fetch_HeaderEntry
} from "./debuggee";

import { InterceptedData } from "../../common/types";

export abstract class Intercepted implements InterceptedData {
  protected debuggee: Debuggee;
  id: string;
  method: string;
  url: string;
  requestHeaders: { name: string, value: string }[];
  requestBody?: string | null;
  status?: number;
  responseHeaders?: { name: string, value: string }[];
  responseBody?: string | null = null;

  protected constructor(dbg: Debuggee, { id, method, url, requestHeaders, requestBody, status, responseHeaders }: InterceptedData) {
    this.debuggee = dbg;
    this.id = id;

    this.method = method;
    this.url = url;
    this.requestHeaders = requestHeaders;
    this.requestBody = requestBody;

    this.status = status;
    this.responseHeaders = responseHeaders;

  }

  protected abstract getResponseBodyInternal(): Promise<Debugger_Network_ResponseBody>;

  async getResponseBody() {
    if (this.responseBody !== null) {
      return this.responseBody;
    }
    let body = await this.getResponseBodyInternal();
    if (body && body.base64Encoded) {
      return this.responseBody = atob(body.body);
    }
    return this.responseBody = body?body.body:'';
  }

  protected abstract continueRequestInternal(request: Partial<Debugger_Network_Request>): Promise<void>;

  async continueRequest({ method, url, requestHeaders, requestBody }: Partial<InterceptedData>): Promise<void> {
    return this.continueRequestInternal(
      this.getModifiedRequest({ method, url, requestHeaders, requestBody }));
  }

  protected abstract continueResponseInternal(request: Partial<InterceptedData>): Promise<void>;

  async continueResponse({ status, responseHeaders, responseBody }: Partial<InterceptedData>): Promise<void> {
    return this.continueResponseInternal(
      await this.getModifiedResponse({ status, responseHeaders, responseBody }));
  }

  protected getModifiedRequest(obj: Partial<InterceptedData>): Partial<Debugger_Network_Request> {
    let modified: Partial<Debugger_Network_Request> = {};
    if (obj.method && obj.method != this.method) {
      modified.method = obj.method;
    }
    if (obj.url && obj.url != this.url) {
      modified.url = obj.url;
    }
    if (obj.requestHeaders && JSON.stringify(obj.requestHeaders) != JSON.stringify(this.requestHeaders)) {
      modified.headers = obj.requestHeaders.reduce((ret, header) =>
        Object.assign({ [header.name]: header.value }, ret), {});
    }
    if (obj.requestBody && obj.requestBody != this.requestBody) {
      modified.postData = obj.requestBody;
    }
    return modified;
  }

  protected async getModifiedResponse(obj: Partial<InterceptedData>): Promise<Partial<InterceptedData>> {
    let modified: Partial<InterceptedData> = {};
    if (
      (obj.status && obj.status != this.status) ||
      (JSON.stringify(obj.responseHeaders) != JSON.stringify(this.responseHeaders)) ||
      obj.responseBody
    ) {
      modified.status = obj.status;
      modified.responseHeaders = obj.responseHeaders;
      if (typeof obj.responseBody !== "undefined") {
        modified.responseBody = obj.responseBody;
      } else {
        modified.responseBody = await this.getResponseBody();
      }
      modified.responseBody = btoa(modified.responseBody || '');
    }
    return modified;
  }
}

export class FetchIntercepted extends Intercepted {
  constructor(debuggee: Debuggee, { requestId, request, responseStatusCode, responseHeaders }: Debugger_Fetch_requestPaused) {
    super(debuggee, {
      id: requestId,
      method: request.method,
      url: request.url,
      requestHeaders: Object.entries(request.headers).map(e => ({ name: e[0], value: e[1] })),
      requestBody: request.hasPostData ? request.postData : null,
      status: responseStatusCode,
      responseHeaders: responseHeaders,
    });
  }

  async getResponseBodyInternal() {
    return this.debuggee.sendCommand('Fetch.getResponseBody', { requestId: this.id });
  }

  async continueRequestInternal(request: Partial<Debugger_Network_Request>) {
    return this.debuggee.sendCommand(
      'Fetch.continueRequest', Object.assign({ requestId: this.id }, request));
  }

  async continueResponseInternal(response: Partial<InterceptedData>) {
    if (JSON.stringify(response) == '{}') {
      return this.debuggee.sendCommand(
        'Fetch.continueRequest', { requestId: this.id });
    }
    return this.debuggee.sendCommand(
      'Fetch.fulfillRequest', {
        requestId: this.id,
        responseCode: response.status || this.status || 0,
        responseHeaders: response.responseHeaders || this.responseHeaders,
        body: response.responseBody || undefined
      });
  }
}
