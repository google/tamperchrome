import { Debuggee } from "./debuggee";
import { Interception } from "./interception";
import { Intercepted } from "./request";

chrome.browserAction.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
  if (tab.url) {
    const permission = {origins: [new URL(tab.url!).origin + '/*']};
    const allowed = await new Promise<boolean>(res=>chrome.permissions.contains(permission, res));
    if (!allowed) {
      const granted = await new Promise<boolean>(res=>chrome.permissions.request(permission, res));
      if (!granted) {
        // this will fail on the constructor below.
        console.error('User rejected access to tab', tab);
      }
    }
  }
  let dbg: Debuggee = new Debuggee(tab);
  await dbg.attach();
  let int: Interception = Interception.build(dbg);
  const popup = open('/ui/dist/ui/index.html', `tamperchrome_${tab.id}`, 'menubar=0,innerWidth=800,innerHeight=600');
  if (!popup) {
    throw new Error('Failed to open UI window');
  }
  popup.onmessage = async e => {
    if (e.data.event == 'capture') {
      popup.onmessage = null;
      await int.capture(e.data.pattern || '*');
      await int.onRequest(async (req: Intercepted) => {
        const mc = new MessageChannel;
        popup.postMessage({'event': 'onRequest', request: JSON.parse(JSON.stringify(req))}, origin, [mc.port1]);
        mc.port2.onmessage = async (e) => {
          await req.continueRequest(e.data.request);
        };
      });
      await int.onResponse(async (res: Intercepted) => {
        const mc = new MessageChannel;
        popup.postMessage({'event': 'onResponse', response: JSON.parse(JSON.stringify(res))}, origin, [mc.port1]);
        mc.port2.onmessage = async (e) => {
          await res.continueResponse(e.data.response);
        };
      });
    }
  };
  popup.onload = () => popup.onunload = () => dbg.detach();
  await dbg.waitForDetach();
  popup.close();
});
