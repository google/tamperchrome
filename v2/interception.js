class Interception {
  constructor(debuggee) {
      this.debuggee = debuggee;
  }

  async onRequest(listener) {
      return this.onRequestInternal(listener);
  }

  async onResponse(listener) {
      return this.onResponseInternal(listener);
  }

  async capture(pattern) {
      return this.captureInternal(pattern);
  }
}

class RequestInterception extends Interception {
  async captureInternal(pattern) {
      await this.debuggee.sendCommand('Network.setCacheDisabled', {cacheDisabled: true});
      await this.debuggee.sendCommand('Network.setRequestInterception', {patterns: [
          {urlPattern: pattern, interceptionStage: 'Request'},
          {urlPattern: pattern, interceptionStage: 'HeadersReceived'},
      ]});
  }

  async onRequestInternal(listener) {
      return this.debuggee.on('Network.requestIntercepted', params => {
          if (params.responseStatusCode) return;
          listener(new RequestIntercepted(this.debuggee, params));
      });
  }

  async onResponseInternal(listener) {
      return this.debuggee.on('Network.requestIntercepted', params => {
          if (params.responseStatusCode) {
            listener(new RequestIntercepted(this.debuggee, params));
          }
      });
  }
}

class FetchInterception extends Interception {
  async captureInternal(pattern) {
      await this.debuggee.sendCommand('Fetch.enable', {patterns: [
          {urlPattern: pattern, interceptionStage: 'Request'},
          {urlPattern: pattern, interceptionStage: 'Response'},
      ]});
  }

  async onRequestInternal(listener) {
      return this.debuggee.on('Fetch.requestPaused', params => {
          if (params.responseStatusCode) return;
          listener(new FetchIntercepted(this.debuggee, params));
      });
  }

  async onResponseInternal(listener) {
      return this.debuggee.on('Fetch.requestPaused', params => {
          if (params.responseStatusCode) {
            listener(new FetchIntercepted(this.debuggee, params));
          }
      });
  }
}

