export interface Debugger_Network_Request {
    method: string,
    url: string,
    headers: Record<string, string>,
    hasPostData: boolean,
    postData?: string
}

export interface Debugger_Fetch_HeaderEntry {
    name: string,
    value: string
}

export interface Debugger_Network_ResponseBody {
    body: string,
    base64Encoded: boolean
}

export interface Debugger_Network_Fetch {
    method: string,
    url: string,
    headers: Debugger_Fetch_HeaderEntry[],
    postData: String
}

export interface Debugger_Network_RequestPattern {
    urlPattern: string,
    resourceType?: string,
    interceptionStage: 'Request' | 'HeadersReceived'
}

export interface Debugger_Fetch_RequestPattern {
    urlPattern: string,
    resourceType?: string,
    requestStage: 'Request' | 'Response'
}

export interface Debugger_Network_requestIntercepted {
    interceptionId: string,
    request: Debugger_Network_Request,
    responseStatusCode: number,
    responseHeaders: Record<string, string>
}

export interface Debugger_Fetch_requestPaused {
    requestId: string,
    request: Debugger_Network_Request,
    responseStatusCode: number,
    responseHeaders: Debugger_Fetch_HeaderEntry[]
}

export class Debuggee {
    target: chrome.debugger.Debuggee;
    handlers: ((...any: any) => any)[];
    dead: boolean = false;
    constructor(tab: chrome.tabs.Tab) {
        this.target = { tabId: tab.id };
        this.handlers = [];
    }

    async attach() {
        this.waitForDetach();
        return new Promise<void>((res, err) => chrome.debugger.attach(this.target, '1.2', () => {
            if (chrome.runtime.lastError) {
                err(chrome.runtime.lastError);
            } else {
                res();
            }
        }));
    }

    async detach() {
        return new Promise<void>((res, err) => chrome.debugger.detach(this.target, () => {
            if (chrome.runtime.lastError) {
                err(chrome.runtime.lastError);
            } else {
                res();
            }
        }));
    }

    async waitForDetach(): Promise<string> {
        let reason = await new Promise((res: (reason: string) => void, err) => {
            chrome.debugger.onDetach.addListener((source, reason: string) => {
                if (source.tabId == this.target.tabId) {
                    res(reason);
                }
            });
        });
        this.dead = true;
        this.handlers.forEach(handler => chrome.debugger.onEvent.removeListener(handler));
        return reason;
    }

    async sendCommand(method: 'Network.getResponseBodyForInterception', params: { interceptionId: string }): Promise<Debugger_Network_ResponseBody>;
    async sendCommand(method: 'Network.setCacheDisabled', params: {}): Promise<never>;
    async sendCommand(method: 'Network.setRequestInterception', params: { patterns: Debugger_Network_RequestPattern[] }): Promise<never>;
    async sendCommand(method: 'Network.continueInterceptedRequest', params: {
        interceptionId: string,
        rawResponse?: string,
        url?: string,
        method?: string,
        postData?: string,
        headers?: Object
    }): Promise<never>;
    async sendCommand(method: 'Fetch.enable', params: { patterns: Debugger_Fetch_RequestPattern[] }): Promise<never>;
    async sendCommand(method: 'Fetch.getResponseBody', params: { requestId: string }): Promise<Debugger_Network_ResponseBody>;
    async sendCommand(method: 'Fetch.continueRequest', params: { requestId: string} & Partial<{
        url: string,
        method: string,
        postData: string,
        headers: Debugger_Fetch_HeaderEntry[]
    }>): Promise<never>;
    async sendCommand(method: 'Fetch.fulfillRequest', params: {
        requestId: string,
        responseCode: number,
        responseHeaders?: Debugger_Fetch_HeaderEntry[],
        body?: string
    }): Promise<never>;
    async sendCommand(method: string, params: any) {
        if (this.dead) throw 'Dead Debuggee (send command)';
        return new Promise((res, err) => chrome.debugger.sendCommand(this.target, method, params, result => {
            if (chrome.runtime.lastError) {
                err(chrome.runtime.lastError);
            } else {
                res(result);
            }
        }));
    }

    on(event: "Network.requestIntercepted", listener: (ret: Debugger_Network_requestIntercepted) => void): void;
    on(event: "Fetch.requestPaused", listener: (ret: Debugger_Fetch_requestPaused) => void): void;
    on(event: string, listener: (ret: any) => void) {
        let handler = (source: chrome.debugger.Debuggee, method: string, params?: Object) => {
            if (source.tabId == this.target.tabId && method == event) {
                listener(params);
            }
        };
        chrome.debugger.onEvent.addListener(handler);
        this.handlers.push(handler);
    }
}

