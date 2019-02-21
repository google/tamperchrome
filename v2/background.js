chrome.browserAction.onClicked.addListener(async tab=>{
  let debuggee = new Debuggee(tab);
  await debuggee.attach();
  let int = new RequestInterception(debuggee);
  await int.capture('*');
  await int.onRequest(async req=>{
    console.log(req);
    await req.continueRequest({});
  });
  await int.onResponse(async res=>{
    console.log(res);
    await res.continueResponse({});
  });
});

