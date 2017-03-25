// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: High-level file comment.
// how to communicate with / install the application
var appAddress = 'http://127.0.0.1:34013/';
var appId = 'odldmflbckacdofpepkdkmkccgdfaemb';
var appWebstore = 'https://chrome.google.com/webstore/detail/' + appId
// string for a URL we temporarily want to *not* intercept
var redirectionUrl;

wakeApplication();


/*
 * wakeApplication attempts to wake the Tamper Chrome companion application with
 * a message.
 */
function wakeApplication() {
  var useThisId = appId;
  if (chrome.runtime.id == 'aeclbbagepggnfbapgnfomjckapheodb') {
    useThisId = 'gmbajgdpbmbigbkpebjaoekajcidjlng';
  }
  chrome.runtime.sendMessage(appId, 'sup', {}, function(){});
}


/*
 * askUser is how we communicate with the user. All questions are asked in the
 * context of the application, so we wend off a *synchronous* request with any
 * information that needs to be presented to the user, and await a response.
 */
function askUser(type, data, aux) {
  var identifier = Date.now().toString() + Math.random().toString().substr(2);
  var requestURI = appAddress+"start";
  var params = "request=" + encodeURIComponent(identifier) +
    "&type=" + encodeURIComponent(type) +
    "&data=" + encodeURIComponent(JSON.stringify(data));

  if (aux) {
    params += "&aux="+encodeURIComponent(aux);
  }

  var xmp = new XMLHttpRequest();
  xmp.open("POST", requestURI, false);
  xmp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  // we block on send() until the application responds, after getting user input
  xmp.send(params);

  console.log(xmp.responseText);
  result = JSON.parse(xmp.responseText);
  if (result.error) {
    // these errors generally aren't visible... oh well...
    console.log("ERROR: "+result.error);
  }
  return result;
}

// Keeps track of which functionality is enabled
// Structure is config.type.tabID = true|false
var config = {
  blockReroute: {},
  requestHeaders: {},
  responseHeaders: {},
  interceptPost: {},
  monitorPostMessage: {},
  monitorXSS: {},
  monitorMixedContent: {}};
// Keeps track of which options are enabled for a given functionality
// Structure is subconf.type.option.tabId = true|false
var subconf = {};

/*
 * nestedRead reads a property from a nested structure, returning false if the
 * property does not exist
 */
function nestedRead(structure, propertyList) {
  var current = structure;
  for (var i = 0; i < propertyList.length; i++) {
    if (!current.hasOwnProperty(propertyList[i])) {
      return false;
    }
    current = current[propertyList[i]];
  }
  return current;
}

/*
 * nestedWrite writes a property to a nested structure, creating nesting as
 * necessary
 */
function nestedWrite(structure, propertyList, value) {
  var current = structure;
  for (var i = 0; i < propertyList.length - 1; i++) {
    if (!current.hasOwnProperty(propertyList[i])) {
      current[propertyList[i]] = {}
    }
    current = current[propertyList[i]];
  }
  current[propertyList[propertyList.length - 1]] = value;
}

/*
 * internalRequest checks to see if a request is going to the application (and
 * thus should be exempt from tampering
 */
function internalRequest(info) {
  return info.url.substring(0, appAddress.length) == appAddress;
}

function skipRequest(info, category) {
  return !nestedRead(config, [category, info.tabId]) ||
      nestedRead(subconf, [category, 'ignore-'+info.type, info.tabId]) ||
      internalRequest(info) ||
      info.url == redirectionUrl;
}

/*
 * Interceptor for "edit" type, allowing you to block or redirect requests. You
 * can also "edit" JS and CSS on its way back, which is implemented by redirect:
 * we request resource via AJAX, allow the user to modify it, then redirect to
 * a base64 encoded data url of the modified css/js.
 * Redirecting a request causes this listener to fire a second time, so when
 * redirecting we save the target URL in an "ignore" variable, which is ignored
 * once.
 */
/*
FIXME: IF A REQUEST SNEAKS IN BETWEEN ONE REQUEST AND ITS REDIRECTION
COUNTERPART THEN REDIRECTIONURL WILL GET OVERWRITTEN BEFORE THE REDIRECT REQUEST
GETS PROCESSED AND IT WILL NOT BE IGNORED
*/
chrome.webRequest.onBeforeRequest.addListener(
  function(info) {
    var category = 'blockReroute';
    if (skipRequest(info, category)) {
      return {};
    }

    // if applicable, get the resource to allow the user to edit it
    var editPayload = null;
    if (nestedRead(subconf, [category, 'modify-'+info.type, info.tabId])) {
      var xmp = new XMLHttpRequest();
      xmp.open("GET", info.url, false);
      xmp.send();
      editPayload = xmp.responseText;
    }

    // if available, convert arraybuffer to typed array in raw
    if (info.requestBody && info.requestBody.raw) {
      info.requestBody.raw = info.requestBody.raw.map(function(part) {
        if (part.bytes) {
          part.bytes = [].slice.call(
              new Uint8Array(part.bytes.slice(0, 500e3)));
        }
        return part;
      });
    }

    var result = askUser(category, info, editPayload);
    redirectionUrl = result.redirectUrl;

    return result;
  },
  {
    urls: [
    "http://*/*",
    "https://*/*",
    ]
  },
  ["blocking", "requestBody"]);

/*
 * Interceptor for "requestHeaders" type, allowing you to modify request headers
 * on their way out.
 */
/*
POSSIBLE ISSUE: SOME HEADERS MAY NOT BE EDITABLE. WE DO NOT INDICATE WHICH
ONES THESE MAY BE, OR COMPLAIN IF THE USER TRIES TO EDIT THEM, BUT INSTEAD
SILENTLY FAIL TO MODIFY THOSE HEADERS
*/
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(info) {
    var category = 'requestHeaders';
    if (skipRequest(info, category)) {
      return {};
    }
    var res = askUser(category, info);
    return res;
  },
  {
    urls: [
    "http://*/*",
    "https://*/*",
    ]
  },
  ["blocking", "requestHeaders"]);


/*
 * Interceptor for "responseHeaders" type, allowing you to modify response
 * headers on their way in.
 */
/*
POSSIBLE ISSUE: SOME HEADERS MAY NOT BE EDITABLE. WE DO NOT INDICATE WHICH
ONES THESE MAY BE, OR COMPLAIN IF THE USER TRIES TO EDIT THEM, BUT INSTEAD
SILENTLY FAIL TO MODIFY THOSE HEADERS
*/
chrome.webRequest.onHeadersReceived.addListener(
  function(info) {
    var category = 'responseHeaders';
    if (skipRequest(info, category)) {
      return {};
    }
    return askUser(category, info);
  },
  {
    urls: [
      "http://*/*",
      "https://*/*",
    ]
  },
  ["blocking", "responseHeaders"]);

// XHR/Forms, PostMessage and XSS all rely on injected scripts. If we navigate
// away, we need to reinject the scripts
chrome.webNavigation.onCommitted.addListener(
  function(info) {
    if (config.monitorPostMessage[info.tabId]) {
      injectPostMessageInjector(info);
    }
    if (config.monitorXSS[info.tabId]) {
      injectXSSMonitor(info);
    }
  });


// handle messages from the devtools area (tamper.js)
chrome.extension.onConnect.addListener(function(port){
  if (port.name != "INSPECT") return;
  var tabId = -1;
  port.onMessage.addListener(function(msg) {
    if (msg.action == 'showStore') {
      chrome.tabs.create({url: appWebstore});
      return;
    }
    tabId = msg.tabId;  // for disconnection
    // handle main feature enabling / disabling
    if (config.hasOwnProperty(msg.key)) {
      config[msg.key][msg.tabId] = !!msg.value;
    }
    // handle injector injections
    // FIXME: what do the "true" parameters do to the injectorinjectors?
    if (msg.key == "interceptPost" && !!msg.value) {
        injectInjector({tabId: msg.tabId}, true);
    }
    if (msg.key == "monitorPostMessage" && !!msg.value) {
        injectPostMessageInjector({tabId: msg.tabId}, true);
    }
    if (msg.key == "monitorXSS" && !!msg.value) {
        injectXSSMonitor({tabId: msg.tabId}, true);
    }
    // handle subconfiguration (e.g. ignore things, edit resources, etc)
    if (msg.key == "subconf") {
      nestedWrite(subconf, [msg.parent, msg.option, msg.tabId], !!msg.value);
    }
  });
  port.onDisconnect.addListener(function(msg) {
    for (var key in config) {
      config[key][tabId] = false;
    }
    subconf = {};
  });
});
