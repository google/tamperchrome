import {
  Debuggee,
  Debugger_Network_requestIntercepted,
  Debugger_Network_ResponseBody,
  Debugger_Network_Request,
  Debugger_Fetch_requestPaused,
  Debugger_Fetch_HeaderEntry
} from "./debuggee";

export interface InterceptedData {
  method: string;
  url: string;
  requestHeaders: { name: string, value: string }[];
  requestBody?: string | null;
  status: number;
  responseHeaders: { name: string, value: string }[];
  responseBody?: string | null;
}

export abstract class Intercepted implements InterceptedData {
  protected debuggee: Debuggee;
  id: string;
  method: string;
  url: string;
  requestHeaders: { name: string, value: string }[];
  requestBody?: string | null;
  status: number;
  responseHeaders: { name: string, value: string }[];
  responseBody?: string | null = null;

  protected constructor(dbg: Debuggee, id: string, { method, url, requestHeaders, requestBody, status, responseHeaders }: InterceptedData) {
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
    let body = await this.getResponseBodyInternal();
    if (body.base64Encoded) {
      return atob(body.body);
    }
    return this.responseBody = body.body;
  }

  protected abstract continueRequestInternal(request: Partial<Debugger_Network_Request>): Promise<void>;

  async continueRequest({ method, url, requestHeaders, requestBody }: Partial<InterceptedData>): Promise<void> {
    return this.continueRequestInternal(
      this.getModifiedRequest({ method, url, requestHeaders, requestBody }));
  }

  protected abstract continueResponseInternal(request: Partial<InterceptedData>): Promise<void>;

  async continueResponse({ status, responseHeaders, responseBody }: Partial<InterceptedData>): Promise<void> {
    return this.continueResponseInternal({ status, responseHeaders, responseBody });
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
}

export class RequestIntercepted extends Intercepted {
  constructor(debuggee: Debuggee, { interceptionId, request, responseStatusCode, responseHeaders }: Debugger_Network_requestIntercepted) {
    super(debuggee, interceptionId, {
      method: request.method,
      url: request.url,
      requestHeaders: Object.entries(request.headers).map(e => ({ name: e[0], value: e[1] })),
      requestBody: request.hasPostData ? request.postData : null,
      status: responseStatusCode,
      responseHeaders: responseHeaders && Object.entries(responseHeaders).map(e => ({ name: e[0], value: e[1] })),
    });
  }

  async getResponseBodyInternal(): Promise<Debugger_Network_ResponseBody> {
    return this.debuggee.sendCommand('Network.getResponseBodyForInterception', { interceptionId: this.id });
  }

  async continueRequestInternal(request: Partial<Debugger_Network_Request>) {
    return this.debuggee.sendCommand(
      'Network.continueInterceptedRequest', Object.assign({ interceptionId: this.id }, request));
  }

  async continueResponseInternal(response: Partial<InterceptedData>) {
    let rawResponse = btoa(
      `HTTP/1.1 ${response.status || this.status} TamperChrome\n` +
      `${(response.responseHeaders || this.responseHeaders).map(h => `${h.name}: ${h.value}`).join('\n')}\n` +
      `\n` +
      `${response.responseBody || await this.getResponseBody()}`);
    return this.debuggee.sendCommand(
      'Network.continueInterceptedRequest', { interceptionId: this.id, rawResponse: rawResponse });
  }
}

export class FetchIntercepted extends Intercepted {
  constructor(debuggee: Debuggee, { requestId, request, responseStatusCode, responseHeaders }: Debugger_Fetch_requestPaused) {
    super(debuggee, requestId, {
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
    let newResponse: {
      requestId: string,
      responseCode: number,
      responseHeaders?: Debugger_Fetch_HeaderEntry[],
      body?: string
    } = {
      requestId: this.id,
      responseCode: response.status || this.status,
    };
    if (response.responseHeaders) {
      newResponse.responseHeaders = response.responseHeaders;
    }
    if (response.responseBody) {
      newResponse.body = response.responseBody;
    }
    if (newResponse.body || newResponse.responseHeaders || newResponse.responseCode != this.status) {
      return this.debuggee.sendCommand('Fetch.fulfillRequest', newResponse);
    }
    return this.debuggee.sendCommand('Fetch.continueRequest', newResponse);
  }
}
