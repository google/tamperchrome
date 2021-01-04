import { Debuggee } from "./debuggee";
import { Interception } from "./interception";
import { Intercepted } from "./request";

chrome.browserAction.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
  let dbg: Debuggee = new Debuggee(tab);
  try {
    await dbg.attach();
  } catch(e) {
    console.error(e);
    alert('Failed to attach to ' + tab.url + ' - probably because of enterprise policies.');
    return;
  }
  let int: Interception = Interception.build(dbg);
  const popup = open('/ui/dist/ui/index.html', `tamperchrome_${tab.id}`, 'menubar=0,innerWidth=900,innerHeight=800');
  if (!popup) {
    throw new Error('Failed to open UI window');
  }
  popup.onmessage = async e => {
    if (e.data.event == 'capture') {
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
        const bodyMc = new MessageChannel;
        popup.postMessage({'event': 'onResponse', response: JSON.parse(JSON.stringify(res))}, origin, [mc.port1, bodyMc.port1]);
        mc.port2.onmessage = async (e) => {
          await res.continueResponse(e.data.response);
        };
        bodyMc.port2.onmessage = async (e) => {
          bodyMc.port2.postMessage(await res.getResponseBody());
        };
      });
    } else if (e.data.event == 'reloadTab') {
      chrome.tabs.reload(tab.id!, {bypassCache: true});
    }
  };
  popup.onload = () => popup.onunload = () => {
    dbg.detach();
    popup.close();
  }
  await dbg.waitForDetach();
  popup.close();
});
