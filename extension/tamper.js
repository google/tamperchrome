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
// TODO(evn): Maybe we should have a settings page to change this value.
var appUrl = "http://127.0.0.1:34013";

// we need this for communication with the background script
try {
  var tabId = chrome.devtools.inspectedWindow.tabId;
  var port = chrome.extension.connect({name: "INSPECT"});
  function setupPort() {
      port.onMessage.addListener(function(x) {
          debugger;
      });
      port.onDisconnect.addListener(function(x) {
          port = chrome.extension.connect({name: "INSPECT"});
          setupPort();
      });
  }
} catch(e) {
  console.log('running in demo mode');
  var tabId = 0;
  var port = {};
  port.postMessage = function(e) {
    console.log("port.postMessage");
    console.log(e);
  }
}


var appDetected = false;
function appNotFound() {
  console.log('companion app not found, checking again in 2 seconds...');
  document.getElementById('applink').style.display = 'block';
  setTimeout(checkForApp, 2000);
}
function appFound() {
  console.log('companion app found');
  appDetected = true;
  document.getElementById('applink').style.display = 'none';
}
// since the app is a rudimentary webserver on port 34013, we check if it's
// running by sending it a "hello" request and verifying the response
function checkForApp() {
    if (appDetected) {
      appFound();
    }
    var xmp = new XMLHttpRequest();
    var timeout;
    xmp.open("GET", appUrl + "/hello", true);
    xmp.onreadystatechange = function() {
      if (xmp.readyState == 4) {
        clearTimeout(timeout);
        if (xmp.responseText != 'Hello') {
          appNotFound();
        } else {
          appFound();
        }
      }
    };
    timeout = setTimeout(appNotFound, 100);
    xmp.send();
}

function askUser(type, data, aux) {
  var identifier = Date.now().toString() + Math.random().toString().substr(2);
  var requestURI = appUrl + "/start";
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

var interceptRequests = false;
/*
 * Intercepts requests and sends them to the app for repeating them.
 */
chrome.devtools.network.onRequestFinished.addListener(
  function(info) {
    var category = 'requestFinished';
    if (!interceptRequests) {
      return;
    }
    var answer = askUser(category, info.request);
    if (answer && !answer.cancel && answer.modified) {
      answer.body = info.request.bodySize?answer.data:undefined;
      chrome.devtools.inspectedWindow.eval('(' + (function(answer) {
        fetch(answer.url, {
          method: answer.method,
          headers: answer.headers.reduce(function(o, h) {
            if (h.name.charAt() != ':')
              o[h.name] = h.value;
            return o;
          }, {}),
          credentials: 'include',
          body: answer.body
        });
      }) + ')('+JSON.stringify(answer)+')');
    }
  });


onload = function() {
  checkForApp();
  document.getElementById('appurl').onclick = function(e) {
    port.postMessage({action: 'showStore'});
  };

  // define the features
  var features = [
      { 'category': 'blockReroute',
        'sidebar': 'Block / Reroute Requests',
        'title': 'Block Requests / Edit Resources',
        'description': 'Block or reroute requests',
      },
      { 'category': 'requestHeaders',
        'sidebar': 'Request Headers',
        'title': 'Modify Request Headers',
        'description': 'Alter HTTP headers on outgoing requests',
      },
      { 'category': 'responseHeaders',
        'sidebar': 'Response Headers',
        'title': 'Modify Response Headers',
        'description': 'Alter HTTP headers in incoming requests',
      },
      { 'category': 'monitorPostMessage',
        'sidebar': 'Monitor PostMessages',
        'title': 'Monitor PostMessages',
        'description': 'View PostMessages as they happen, pausing execution ' +
            'in the JavaScript debugger'
      },
      { 'category': 'monitorXSS',
        'sidebar': 'Monitor Reflected XSS',
        'title': 'Monitor Reflected XSS',
        'description': 'Displays information in the console if a <tcxss> ' +
            'element or any element with a tcxss attribute is present in the DOM'
      },
      { 'category': 'interceptPost',
        'sidebar': 'Replay Requests (Experimental)',
        'title': 'Inspect and Replay HTTP requests',
        'description': 'View or replay HTTP requests'
      }
  ];

  var sidebar = document.getElementById('sidebar');
  var sidebar_ul = document.getElementById('sidebar_ul');
  var main = document.getElementById('main');
  var selectedFeature = 0;

  // for selecting one of the sidebar entries and showing its options in the
  // main pane
  var selectOption = function(elem) {
    features[selectedFeature].sb_clickable.classList.remove('active');
    features[selectedFeature].optionsPane.classList.remove('active');
    selectedFeature = elem.getAttribute('data-number');
    features[selectedFeature].sb_clickable.classList.add('active');
    features[selectedFeature].optionsPane.classList.add('active');
  }

  // for enabling one of the sidebar entries when its checkbox is clicked
  var enableOption = function(elem) {
    var number = elem.getAttribute('data-number');
    if (elem.checked) {
      features[number].sb_clickable.classList.add('enabled');
      features[number].optionsPane.classList.add('enabled');
    } else {
      features[number].sb_clickable.classList.remove('enabled');
      features[number].optionsPane.classList.remove('enabled');
    }
  }

  for (var i = 0; i < features.length; i++) {
    var category = features[i].category;

    // create sidebar elements
    var li = document.createElement('li');
    var clickable = document.createElement('a');
    var checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('data-number', i);
    checkbox.setAttribute('data-category', features[i].category);
    clickable.appendChild(checkbox);
    clickable.insertAdjacentText('beforeend', features[i].sidebar);
    clickable.setAttribute('data-number', i);
    li.appendChild(clickable);
    sidebar_ul.appendChild(li);

    // create main area elements
    var optionsPane = document.createElement('div');
    var title = document.createElement('h1');
    var description = document.createElement('span');
    description.className = 'description';
    description.innerText = features[i].description;
    title.innerText = features[i].title;
    optionsPane.appendChild(title);
    optionsPane.appendChild(description);
    main.appendChild(optionsPane);

    features[i].sb_li  = li;
    features[i].sb_clickable = clickable;
    features[i].sb_checkbox = checkbox;
    features[i].optionsPane = optionsPane;

    // handle selecting and enabling features
    clickable.onclick = function(e) {
      selectOption(this);
    }
    checkbox.onchange = function(e) {
      enableOption(this);
      if (this.getAttribute('data-category') == 'interceptPost') {
        interceptRequests = this.checked;
      }
      port.postMessage({
        tabId: tabId,
        key: this.getAttribute('data-category'),
        value: this.checked});
      toggleDevToolsHelper(features[this.getAttribute('data-number')]);
    }

    // handle options pane
    switch (features[i].category) {
      case 'blockReroute':
        var optPane = document.createElement('div');
        optPane.className = 'optionsPane';
        optPane.appendChild(createIgnoreOptions(features[i].category));
        optionsPane.appendChild(optPane);
        optPane = document.createElement('div');
        optPane.className = 'optionsPane';
        optPane.appendChild(createIgnoreOptions(features[i].category, [
          {type: 'modify-script', text: 'Edit javascript'},
          {type: 'modify-stylesheet', text: 'Edit stylesheets'}]));
        optionsPane.appendChild(optPane);
        break;
      case 'requestHeaders':
      case 'responseHeaders':
        var optPane = document.createElement('div');
        optPane.className = 'optionsPane';
        optPane.appendChild(createIgnoreOptions(features[i].category));
        optionsPane.appendChild(optPane);
        break;
    }

  }
  selectOption(features[selectedFeature].sb_clickable);
  var enablePostMessageBreakpoints = function() {
    window.__tamperChromePostMessageBreakpoints = getEventListeners(
        window).message.map(function(f){
      debug(f.listener);
      return f.listener;
    });
  };
  var disablePostMessageBreakpoints = function() {
    getEventListeners(window).message.forEach(function(f){
      undebug(f.listener);
    });
    try {
      window.__tamperChromePostMessageBreakpoints.forEach(undebug);
    } catch(e) {}
  };
  var enableXSSMonitorBreakpoints = function() {
    window.__tamperChromeXssMonitorBreakpointsEnabled = true;
    var proto = Object.create(HTMLElement.prototype);
    proto.createdCallback = function() {
      if (window.__tamperChromeXssMonitorBreakpointsEnabled) {
        inspect(this);
      }
    };
    document.registerElement('tc-xss', {
      prototype: proto
    });
  };
  var disableXSSMonitorBreakpoints = function() {
    window.__tamperChromeXssMonitorBreakpointsEnabled = false;
  };
  function evalInWindow(f, opt_url) {
    chrome.devtools.inspectedWindow.eval(
        '(' + f +')()', {frameURL: opt_url || undefined}, function() {});
  }
  function evalInAllFrames(f) {
    evalInWindow(f);
    chrome.devtools.inspectedWindow.getResources(function(resources) {
      resources.forEach(function(res) {
        evalInWindow(f, res.url);
      });
    });
  }
  var devtoolsHelpers = {
    'monitorXSS': [
      disableXSSMonitorBreakpoints, enableXSSMonitorBreakpoints],
    'monitorPostMessage': [
      disablePostMessageBreakpoints, enablePostMessageBreakpoints],
  };
  function toggleDevToolsHelper(feature) {
    if (devtoolsHelpers[feature.category]) {
      var helper = devtoolsHelpers[feature.category];
      var code = helper[feature.sb_checkbox.checked * 1];
      if (code)
        chrome.devtools.inspectedWindow.eval('1', {}, function() {
          evalInAllFrames(code);
        });
    }
  };
  chrome.devtools.network.onNavigated.addListener(function() {
    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      toggleDevToolsHelper(feature);
    }
  });
};

// for creating sub-options checkboxes
var createIgnoreOptions = function(section, options) {
  if (!options) {
    options = [
      {type: 'ignore-main_frame', text: 'Ignore browser requests'},
      {type: 'ignore-sub_frame', text: 'Ignore subframes'},
      {type: 'ignore-script', text: 'Ignore scripts'},
      {type: 'ignore-stylesheet', text: 'Ignore stylesheets'},
      {type: 'ignore-image', text: 'Ignore images'},
      {type: 'ignore-xmlhttprequest', text: 'Ignore XMLHttpRequests'},
      {type: 'ignore-object', text: 'Ignore objects (flash, etc)'},
      {type: 'ignore-other', text: 'Ignore other (fonts, favicons, etc)'}
      ];
  }
  var result = document.createElement('div');
  for (var i=0; i<options.length; i++) {
    var lbl = document.createElement('label');
    var chk = document.createElement('input');
    lbl.appendChild(chk);
    lbl.insertAdjacentText('beforeend', options[i].text);
    chk.setAttribute('type', 'checkbox');
    chk.setAttribute('data-number', i);
    chk.onchange = function(e) {
      var message = {
        tabId: tabId,
        key: "subconf",
        parent: section,
        option: options[this.getAttribute('data-number')].type,
        value: this.checked
      };
      port.postMessage(message);
    }
    //port.postMessage = message;
    result.appendChild(lbl);
  }
  return result;
}


