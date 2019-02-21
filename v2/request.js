class Intercepted {
  constructor(debuggee, {id, method, url, requestHeaders, requestBody, status, responseHeaders}) {
      this.debuggee = debuggee;
      this.id = id;

      this.method = method;
      this.url = url;
      this.requestHeaders = requestHeaders;
      this.requestBody = requestBody;

      this.status = status;
      this.responseHeaders = responseHeaders;
  }
  
  async getResponseBody() {
    let body = await this.getResponseBodyInternal();
    if (body.base64Encoded) {
      return atob(body.body);
    }
    return body.body;
  }

  async continueRequest({method, url, requestHeaders, requestBody}) {
      return this.continueRequestInternal(
        this.getModified({method, url, requestHeaders, requestBody}));
  }

  async continueResponse({status, responseHeaders, responseBody}) {
      return this.continueResponseInternal({status, responseHeaders, responseBody});
  }
  
  getModified(obj) {
    let aliases = {'requestHeaders': 'headers', 'requestBody': 'postData'};
    return Object.entries(obj).reduce((modified, [key, val])=>{
      if (JSON.stringify(this[key]) != JSON.stringify(val)) {
        if (Object.hasOwnProperty(aliases, key)) {
          key = aliases[key];
        }
        modified[key] = val;
      }
      return modified;
    }, {});
  }
}

class RequestIntercepted extends Intercepted {
  constructor(debuggee, {interceptionId, request, responseStatusCode, responseHeaders}) {
      super(debuggee, {
          id: interceptionId,
          method: request.method,
          url: request.url,
          requestHeaders: Object.entries(request.headers).map(e=>({name: e[0], value: e[1]})),
          requestBody: new Object(request.postData || request.hasPostData),
          status: responseStatusCode,
          responseHeaders: responseHeaders && Object.entries(responseHeaders).map(e=>({name: e[0], value: e[1]})),
      });
  }
  
  async getResponseBodyInternal() {
      return this.debuggee.sendCommand('Network.getResponseBodyForInterception', {interceptionId: this.id});
  }

  async continueRequestInternal(request) {
      return this.debuggee.sendCommand(
        'Network.continueInterceptedRequest', Object.assign({interceptionId: this.id}, request));
  }
  
  async continueResponseInternal(response) {
      let rawResponse = btoa(
        `HTTP/1.1 ${response.status||this.status} TamperChrome\n` +
        `${(response.responseHeaders||this.responseHeaders).map(h=>`${h.name}: ${h.value}`).join('\n')}\n` +
        `\n` +
        `${response.responseBody||await this.getResponseBody()}`);
      return this.debuggee.sendCommand(
        'Network.continueInterceptedRequest', {interceptionId: this.id, rawResponse: rawResponse});
  }
  
  getModified(obj) {
    let modified = super.getModified(obj);
    if (modified.headers) {
      modified.headers = modified.headers.reduce(
        (obj, {name, value}) => Object.assign(obj, {[name]: value}), {});
    }
    return modified;
  }
}

class FetchIntercepted extends Intercepted {
  constructor(debuggee, {requestId, request, responseStatusCode, responseHeaders}) {
      super(debuggee, {
          id: requestId,
          method: request.method,
          url: request.url,
          requestHeaders: Object.entries(request.headers).map(e=>({name: e[0], value: e[1]})),
          requestBody: new Object(request.postData || request.hasPostData),
          status: responseStatusCode,
          responseHeaders: responseHeaders,
      });
  }
  
  async getResponseBodyInternal() {
      return this.debuggee.sendCommand('Fetch.getResponseBody', {requestId: this.id});
  }

  async continueRequestInternal(request) {
    return this.debuggee.sendCommand(
      'Fetch.continueRequest', Object.assign({requestId: this.id}, request));
  }

  async continueResponseInternal(response) {
    let newResponse = {
      requestId: this.id,
      responseCode: response.status||this.status,
      responseHeaders: response.responseHeaders||this.responseHeaders
    };
    if (response.responseBody) {
      newResponse.body = response.responseBody;
    }
    return this.debuggee.sendCommand('Fetch.fulfillRequest', newResponse);
  }
}

