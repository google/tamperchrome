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
/*
 * injectPostMessageInjector injects a script into the DOM which displays any
 * PostMessages in the console, and drops to the javascript debugger.
 */
function injectPostMessageInjector(info) {
  console.log('injected');
  chrome.tabs.executeScript(info.tabId, {
    allFrames: true,
    runAt: "document_start",
    code: "("+ (function() {
      if (window.__injectedPostMessageMonitor) return;
        window.__injectedPostMessageMonitor = true;
      window.addEventListener('message', function(e) {
        console.group("Message sent from " + e.origin + " to " +
            location.origin);
        console.log(e);
        console.log(e.data);
        console.groupEnd();
      }, true);
    }) +")();"
  });
}

/*
 * injextXSSMonitor injects a script into the DOM which searches the dom for
 * any <tcxss> or <tamperchromexss> element, or any elements with a tcxss
 * or tamperchromexss attribute, displaying relevant information in the console.
 */

function injectXSSMonitor(info) {
  chrome.tabs.executeScript(info.tabId, {
    allFrames: true,
    runAt: "document_start",
    code: "("+ (function() {
      function injectFunction() {
        if (window.__injectedXSSMonitor) return;
          window.__injectedXSSMonitor = true;
        var knownXSS = [];
        function handler(val){
          if (arguments.callee.caller.arguments[0] instanceof Event && !val) {
            val = arguments.callee.caller.arguments[0].target;
          }
          if (knownXSS.indexOf(val) > -1) return;
          console.group("XSS detected in " + location.origin);
          console.trace();
          console.group("Location:");
          var framePath = [].join.call(location.ancestorOrigins, " > ");
          if (framePath) {
            console.log(framePath + " > " + location.origin);
          }
          console.log({
            location: location.href,
            referrer: document.referrer,
            name: name});
          if (val) {
            knownXSS.push(val);
            var path = [];
            var cur = val;
            while (cur.parentNode) {
              var label = cur.tagName;
              if (cur.id) {
                label += "#" + cur.id;
              } else if (cur.className) {
                label += "." + cur.className.replace(/\s+/g, '.');
              }
              path.push(label.toLowerCase());
              cur = cur.parentNode;
            }
            console.log(path.reverse().join(" > "));
            if (val.parentNode) {
              console.group("HTML snippet:");
              var parentHtml = val.parentNode.innerHTML || "";
              [].forEach.call(parentHtml.match(
                /.{0,100}(tcxss|tamperchromexss).{0,100}/g) || [], function(
                  match){console.log(match.replace(/^\s*|\s*$/g, ' '));
              });
              console.groupEnd();
            }
            console.log(val);
          }
          console.groupEnd(); // Location
          console.groupEnd(); // XSS
        }
        var identifiers = ["tcxss", "tamperchromexss", "tc-xss"];
        identifiers.forEach(function(ident){
          window.__defineGetter__(ident, handler);
          window.__defineSetter__(ident, handler);
        });
        function checkit(e){
          if (!e.target || !e.target.tagName) return;
          if (identifiers.indexOf(e.target.tagName.toLowerCase()) > -1) {
            handler(e.target);
          } else {
            identifiers.forEach(function(ident){
              if (typeof e.target.attributes[ident] != "undefined") {
                handler(e.target);
              }
            });
          }
        }
        function checknow() {
          [].forEach.call(document.getElementsByTagName("*"), function(elem){
            checkit({target: elem});
          });
        }
        document.addEventListener("DOMSubtreeModified", checkit, false);
        var observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(record) {
              [].forEach.call(record.addedNodes, function(node) {
                  checkit({target: node});
                });
              checkit(record);
            });
        });
        observer.observe(
            document, {attributes: true, subtree: true, childList: true});
        setTimeout(checknow, 1);
      }
      var script = document.createElement("a");
      script.setAttribute("onclick", ("("+injectFunction+")();"));
      script.click();
    }) +")();"
  });
}
