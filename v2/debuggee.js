class Debuggee {
    constructor(tab) {
        this.target = {tabId: tab.id};
        this.handlers = [];
    }

    async attach() {
      this.waitForDetach();
      return new Promise((res, err)=>chrome.debugger.attach(this.target, '1.2', result=>{
        if (chrome.runtime.lastError) {
          err(chrome.runtime.lastError);
        } else {
          res(result);
        }
      }));
    }

    async waitForDetach() {
        let reason = await new Promise((res, err)=>{
            chrome.debugger.onDetach.addListener((source, reason)=> {
                if (source.tabId == this.target.tabId) {
                    res(reason);
                }
            });
        });
        this.dead = true;
        this.handlers.forEach(handler=>chrome.debugger.onEvent.removeListener(handler));
        return reason;
    }

    async sendCommand(method, params) {
        if (this.dead) throw 'Dead Debuggee (send command)';
        return new Promise((res, err)=>chrome.debugger.sendCommand(this.target, method, params, result=>{
            if (chrome.runtime.lastError) {
                err(chrome.runtime.lastError);
            } else {
                res(result);
            }
        }));
    }

    on(event, listener) {
        let handler;
        chrome.debugger.onEvent.addListener(handler = async (source, method, params)=>{
            if (source.tabId == this.target.tabId && method == event) {
                listener(params);
            }
        });
        this.handlers.push(handler);
    }
}

