import { Debuggee } from "./debuggee";
import { Interception } from "./interception";
import { Intercepted } from "./request";

chrome.browserAction.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
  let dbg: Debuggee = new Debuggee(tab);
  await dbg.attach();
  let int: Interception = Interception.build(dbg);
  await int.capture('*');
  await int.onRequest(async (req: Intercepted) => {
    console.log(req);
    await req.continueRequest({});
  });
  await int.onResponse(async (res: Intercepted) => {
    console.log(res);
    await res.continueResponse({});
  });
});
