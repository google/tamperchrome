import { Debuggee } from "./debuggee";
import { Interception } from "./interception";
import { Intercepted } from "./request";

const openAsync = (config: object): Promise<chrome.windows.Window | undefined> => {
  return new Promise((resolve, reject) => {
    chrome.windows.create(config, (window) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      }
      resolve(window);
    })
  })
}

chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
  let dbg: Debuggee = new Debuggee(tab);
  try {
    await dbg.attach();
  } catch(e) {
    console.error(e, JSON.stringify(e));
    // alert is not supported
    // alert('Failed to attach to ' + tab.url + ' - probably because of enterprise policies.');
    return;
  }
  const int: Interception = Interception.build(dbg);

  const popup = await openAsync({
    url: '/ui/dist/ui/index.html',
    type: 'popup',
    width: 900,
    height: 800,
  });

  if (!popup) {
    throw new Error('Failed to open UI window');
  }

  chrome.runtime.onConnect.addListener(port => {
    if (port.name !== 'tamperchrome') return
    port.onMessage.addListener(async (msg) => {
      if (msg.name === "capture") {
        await int.capture(msg.data.pattern || '*');
        await int.onRequest(async (req: Intercepted) => {
          port.postMessage({ name: 'onRequest', data: { request: req } });
          port.onMessage.addListener(async (msg) => {
            if (msg.name === req.id) await req.continueRequest(msg.request);
          })
        });
        await int.onResponse(async (res: Intercepted) => {
          port.postMessage({ name: 'onResponse', data: { response: res } });
          port.onMessage.addListener(async (msg) => {
            if (msg.name === res.id + '-res') await res.continueResponse(msg.response);
          })
          port.onMessage.addListener(async (msg) => {
            if (msg.name === res.id + '-body') {
              const data = await res.getResponseBody()
              port.postMessage({ name: res.id + '-body', data })
            }
          })
        });
      } else if (msg.name === "reloadTab") {
        chrome.tabs.reload(tab.id!, { bypassCache: true });
      }
    });
    port.onDisconnect.addListener(() => dbg.detach())
  });

  await dbg.waitForDetach();
  await chrome.windows.remove(popup.id!);
});
