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
// get access to the background for requests
var background;
chrome.runtime.getBackgroundPage(function(bg){
  background = bg;
  });

var tablesrc;

var tableholder;
var table;
var display;
var actions;
var debug;
var ignore;

var yesFocus = true;
var currentFilter;
var currentView;

var addRequest = function(request) {
  background.requests[request.reqId] = request;
  background.request_order.push(request.reqId);
  showRequest(request);
}

var showRequest = function(request) {
  var uiRow = document.createElement('tr');
  uiRow.tabIndex = 1;
  uiRow.className = 'requestRow';
  var uiType = document.createElement('td');
  var uiMethod = document.createElement('td');
  var uiUri = document.createElement('td');
  var uiExtra = document.createElement('td');
  uiType.className = 'type';
  uiMethod.className = 'method';
  uiUri.className = 'uri';
  uiExtra.className = 'extra';
  uiType.innerText = request.type
  uiMethod.innerText = request.info.method ?
      request.info.method.toLowerCase() : '';
  uiUri.innerText = request.info.url || request.info.action;
  uiExtra.innerText = request.info.type || request.info.transitionType || '';
  uiRow.appendChild(uiType);
  uiRow.appendChild(uiMethod);
  uiRow.appendChild(uiUri);
  uiRow.appendChild(uiExtra);
  uiRow.setAttribute('data-reqId', request.reqId);

  table.appendChild(uiRow);
  activateRequest(request.reqId);
  uiRow.addEventListener('focus', function(event) {
    activateRequest(this.getAttribute('data-reqId'));
  });
  tableholder.scrollTop = tableholder.scrollHeight;
}

document.onkeydown = function(e) {
  var now = document.activeElement;
  if (now.classList.contains('requestRow')) {
    if (e.keyCode == '40' && now.nextElementSibling) {
      now.nextElementSibling.focus();
      return false;
    } else if (e.keyCode == '38' && now.previousElementSibling) {
      now.previousElementSibling.focus();
      return false;
    }
  }
}

function activateRequest(reqId) {
  currentView = reqId;
  display.innerHTML = '<h1>Request Details</h1>';
  actions.innerHTML = '';
  var rows = table.getElementsByTagName('tr');
  for (var i=0; i<rows.length; i++) {
    if (rows[i].getAttribute('data-reqId') != reqId) {
      rows[i].classList.remove('active');
    } else {
      try {
        request = background.requests[reqId];
        rows[i].classList.add('active');

        if (!request.completed && ignore.checked) {
          releaseBlock(reqId, {}, true);
          rows[i].focus();
          // Refocus this request in 10ms once its completed
          let row = rows[i];
          setTimeout(_=>row.focus(),10);
        }

        if (!ignore.checked) {
          console.log('grabbing focus');
          chrome.app.window.get('UI').focus();
        }

        if (request.type == 'blockReroute') {
          requestEdit(request);
        } else
        if (request.type == 'requestHeaders' ||
            request.type == 'responseHeaders') {
          requestHeaders(request);
        } else
        if (request.type == 'xhr' ||
            request.type == 'requestFinished') {
          requestXhr(request);
        } else
        if (request.type == 'xhr_response') {
          requestXhrResponse(request);
        } else
        if (request.type == 'form') {
          requestForm(request);
        } else {
          requestNoIdea(request);
        }
        var resizeMe = display.getElementsByTagName('textarea');
        for (var j = 0; j < resizeMe.length; j++) {
          autosize(resizeMe[j]);
          if (resizeMe[j].classList.contains('input')) {
            resizeMe[j].onkeyup = strip_newlines;
          }
        }
      } catch(e) {
        display.innerHTML = '<h1>Error processing request!</h1><p>This ' +
            'request has been released without modification.<pre>' + e.stack + '</pre>';
        if (request.completed) {
          console.log('Request has already been released, ignoring...');
        } else {
          console.log('Releasing request so Chrome doesn\'t pitch a fit');
          releaseBlock(request.reqId, {}, keepActive=true);
        }
      }
    }
  }
}

function releaseBlock(reqId, retVal, keepActive) {
  var elem = table.getElementsByClassName('active')[0];
  var removeElem = currentFilter && !searchObject(
      currentFilter, background.requests[reqId]);

  if (reqId == currentView) {
    if (removeElem || !keepActive) {
      display.innerHTML = '';
      actions.innerHTML = '';
    }
  }

  if (removeElem) {
    elem.parentNode.removeChild(elem);
  } else if (!keepActive) {
    elem.classList.remove('active');
  }

  chrome.runtime.getBackgroundPage(function(bg) {
    bg.endRequest(false, background.requests[reqId], retVal, debug.checked);
  });
}

function requestNoIdea(request) {
  console.log('I don\'t know what I\'m supposed to do here... releasing this ' +
      'request in one second');
  setTimeout(function(){
  releaseBlock(request.reqId, {a: 'no idea'});
  }, 1000);
}

function requestEdit(request) {
  var t = createInputTable();
  display.appendChild(t);

  var method = createTrInput('Method:', 'method', request.info.method, false);
  t.appendChild(method.row);
  method.input.readOnly = true;

  var url = createTrInput('URL:', 'url', request.info.url);
  t.appendChild(url.row);

  if (request.info.requestBody) {
    var bodyData = request.info.requestBody.error || "";
    if (request.info.requestBody.formData) {
      bodyData += Object.getOwnPropertyNames(
          request.info.requestBody.formData).map(function(name) {
        return request.info.requestBody.formData[name].map(function(value) {
          return encodeURI(name) + '=' + encodeURI(value);
        }).join('&');
      }).join('&');
    }
    if (request.info.requestBody.raw) {
      // just for display purposes..
      var verySecureRandomNonce = new Date().getTime();
      bodyData += request.info.requestBody.raw.map(function(part) {
        if (part.bytes) return String.fromCharCode.apply(null, part.bytes);
        if (part.file) return part.file;
        return '';
      }).join('\n');
    }
    var requestBody = createTrInput(
        'Request Body:', 'body', bodyData, false, 'textarea');
    t.appendChild(requestBody.row);
    requestBody.input.readOnly = true;
  }

  if (request.aux) {
    var responseText = createTrInput('Contents', 'contentsTxt', request.aux,
        false, 'textarea');
    t.appendChild(responseText.row);
  }

  if (!request.completed) {
    var yesButton = document.createElement('button');
    yesButton.innerText = 'Allow';
    yesButton.onclick = function() {
      yesFocus = true;
      actions.innerHTML = '';
      result = {};
      if (request.info.url != url.input.value) {
        result.redirectUrl = url.input.value;
        request.info.url = url.input.value;
      }
      else if (responseText &&
               responseText.input.value != responseText.originalValue) {
        result.redirectUrl = "data:text/html;base64," +
            btoa(responseText.input.value);
        request.aux = responseText.input.value;
      }
      releaseBlock(request.reqId, result);
    };
    var noButton = document.createElement('button');
    noButton.className = 'no';
    noButton.innerText = 'Block';
    noButton.onclick = function() {
      yesFocus = false;
      actions.innerHTML = '';
      releaseBlock(request.reqId, {cancel: true});
    };
    actions.appendChild(yesButton);
    actions.appendChild(noButton);
    (yesFocus ? yesButton : noButton).focus();
  } else {
    disableInputs();
  }
}

function requestHeaders(request) {

  var t = createInputTable();
  display.appendChild(t);

  var property = request.type;
  var sentHeaders = request.info[property];
  var headers = [];
  for (var i=0; i<sentHeaders.length; i++) {
    var elem = createTrInput(sentHeaders[i].name, sentHeaders[i].name,
        sentHeaders[i].value, !request.completed);
    t.appendChild(elem.row);
    headers.push(elem);
  }
  if (!request.completed) {
    createTrNewEntry('input', t, headers);
  }

  if (!request.completed) {
    var button = document.createElement('button');
    button.innerText = 'OK';
    button.onclick = function() {
      actions.innerHTML = '';
      result = {};
      var newHttpHeaders = [];
      for (var i=0; i<headers.length; i++) {
        if (!headers[i].del.checked) {
          newHttpHeaders.push({name: headers[i].input.name,
                               value: headers[i].input.value});
        }
      }
      var result = {};
      result[property] = newHttpHeaders;
      request.info[property] = newHttpHeaders;
      releaseBlock(request.reqId, result);
    };
    actions.appendChild(button);
    button.focus();
  } else {
    disableInputs();
  }
}

function requestXhr(request) {

  var t = createInputTable();
  display.appendChild(t);

  t.appendChild(createInputTableHeader('Request'));
  if (request.info.method) {
    var method = createTrInput('Method', 'method', request.info.method);
    t.appendChild(method.row);
  }
  var url = createTrInput('URL', 'url', request.info.url);
  t.appendChild(url.row);

  var headers = []
  if (request.info.headers) {
    if (request.info.headers.length > 0) {
      t.appendChild(createInputTableHeader('XHR Headers'));

      for (var i=0; i<request.info.headers.length; i++) {
        var elem = createTrInput(request.info.headers[i].name,
            request.info.headers[i].name, request.info.headers[i].value,
            !request.completed);
        t.appendChild(elem.row);
        headers.push(elem);
      }
      if (!request.completed) {
        createTrNewEntry('input', t, headers);
      }
    }
  }

  if (request.info.postData) {
    request.info.data = request.info.postData.text;
  }

  if (request.info.data) {
    t.appendChild(createInputTableHeader('XHR Postdata'));
    var data = createTrInput('Data', 'data', request.info.data,
        !request.completed, 'textarea');
    t.appendChild(data.row);
  }
  /*
  var data = []
  if (request.info.data) {
    if (request.info.data.length > 0) {
      t.appendChild(createInputTableHeader('XHR Data'));
      var dataFields = parseQueryString(request.info.data);
      for (var i=0; i<dataFields.length; i++) {
        var elem = createTrInput(dataFields[i].name, dataFields[i].name,
            dataFields[i].value, !request.completed);
        t.appendChild(elem.row);
        data.push(elem);
      }
      if (!request.completed) {
        createTrNewEntry('input', t, data);
      }
    }
  }
  */

  if (!request.completed) {
    var yesButton = document.createElement('button');
    yesButton.innerText = 'Send';
    yesButton.onclick = function() {
      yesFocus = true;
      actions.innerHTML = '';

      if (data && data.input.value) {
        newData = data.input.value;
      } else {
        newData = null;
      }

      modified = (method && method.input.value != request.info.method) ||
          (url.input.value != request.info.url) ||
          (newData != request.info.data);

      newHeaders = [];
      for (var i=0; i<headers.length; i++) {
        if (!headers[i].del.checked) {
          newHeaders.push({
            name: headers[i].input.name,
            value: headers[i].input.value});
        }
        if (!request.info.headers[i] ||
            headers[i].input.name != request.info.headers[i].name ||
            headers[i].input.value != request.info.headers[i].value ||
            headers[i].del.checked) {
          modified = true;
        }
      }

      if (modified) {
        if (request.type != 'requestFinished') {
          request.info.url = url.input.value;
          request.info.data = newData;
          request.info.headers = newHeaders;
        }

        var result = {
          modified: true,
          data: newData,
          url: url.input.value,
          headers: newHeaders};
        if (method) {
          if (request.type != 'requestFinished') {
            request.info.method = method.input.value;
          }
          result.method = method.input.value;
        }
        releaseBlock(request.reqId, result);
      } else {
        releaseBlock(request.reqId, {});
      }
    };

    var noButton = document.createElement('button');
    noButton.className = 'no';
    noButton.innerText = 'Block';
    noButton.onclick = function() {
      yesFocus = false;
      actions.innerHTML = '';
      releaseBlock(request.reqId, {cancel: true});
    };
    actions.appendChild(yesButton);
    if (request.type != 'requestFinished') {
      // Block button doesn't make sense for requestFinished.
      actions.appendChild(noButton);
    }
    (yesFocus ? yesButton : noButton).focus();
  } else {
    disableInputs();
  }
}

function requestXhrResponse(request) {
  var t = createInputTable();
  display.appendChild(t);

  // We get the request headers as a string, so split it up
  // NOTE: this function must return property "headers" as a STRING because of
  // reasons.
  var rih = [];
  request.info.headers.trim().split("\r\n").forEach(function(arg) {
    var colonIndex = arg.indexOf(': ');
    rih.push({name: arg.substring(0, colonIndex),
              value: arg.substring(colonIndex + 2)});
  });

  var headers = []
  if (rih.length > 0) {
    t.appendChild(createInputTableHeader('XHR Response Headers'));
  }
  for (var i=0; i<rih.length; i++) {
    var elem = createTrInput(rih[i].name, rih[i].name, rih[i].value,
        !request.completed);
    t.appendChild(elem.row);
    headers.push(elem);
  }
  if (!request.completed) {
    createTrNewEntry('input', t, headers);
  }

  t.appendChild(createInputTableHeader('XHR Response'));

  var url = createTrInput('url', 'url', request.info.url, false, 'label');
  t.appendChild(url.row);

  var status = createTrInput('status', 'status', request.info.status);
  t.appendChild(status.row);

  var responseText = createTrInput('responseText', 'responseText',
      request.info.responseText, false, 'textarea');
  t.appendChild(responseText.row);

  if (!request.completed) {
    var yesButton = document.createElement('button');
    yesButton.innerText = 'Send';
    yesButton.onclick = function() {
      yesFocus = true;
      actions.innerHTML = '';

      newHeaders = '';
      for (var i=0; i<headers.length; i++) {
        if (!headers[i].del.checked) {
          newHeaders += headers[i].input.name+': '+headers[i].input.value+'\r\n';
        }
      }

      // check to see if any modifications were made, and push modifications
      var modified = (status.input.value != request.info.status) ||
                     (responseText.input.value != request.info.responseText) ||
                     (newHeaders != headers);

      if (modified) {
        request.info.headers = newHeaders;
        request.info.responseText = responseText.input.value;
        request.info.status = status.input.value;
        releaseBlock(request.reqId, {
          modified: true,
          responseText: responseText.input.value,
          headers: newHeaders,
          status: status.input.value});
      } else {
        releaseBlock(request.reqId, {});
      }
    };

    var noButton = document.createElement('button');
    noButton.className = 'no';
    noButton.innerText = 'Block';
    noButton.onclick = function() {
      yesFocus = false;
      actions.innerHTML = '';
      releaseBlock(request.reqId, {cancel: true});
    };
    actions.appendChild(yesButton);
    actions.appendChild(noButton);
    (yesFocus ? yesButton : noButton).focus();
  } else {
    disableInputs();
  }


}

function requestForm(request) {

  var t = createInputTable();
  display.appendChild(t);

  t.appendChild(createInputTableHeader('Request'));
  var method = createTrInput('Method', 'method', request.info.method);
  t.appendChild(method.row);
  var action = createTrInput('Action', 'action', request.info.action);
  t.appendChild(action.row);


  var fields = []
  t.appendChild(createInputTableHeader('Form fields'));
  for (var i=0; i<request.info.fields.length; i++) {
    var elem = createTrInput(request.info.fields[i].name,
        request.info.fields[i].name, request.info.fields[i].value,
        !request.completed && !request.info.readOnly);
    if (request.info.readOnly) {
      elem.input.setAttribute('disabled');
    }
    t.appendChild(elem.row);
    fields.push(elem);
  }
  if (!request.completed) {
    createTrNewEntry('input', t, fields);
  }

  if (!request.completed) {
    var yesButton = document.createElement('button');
    yesButton.innerText = 'Send';
    yesButton.onclick = function() {
      yesFocus = true;
      actions.innerHTML = '';

      // check to see if any modifications were made, and grab header values
      var newFields = []
      var modified = (method.input.value != request.info.method) ||
                     (action.input.value != request.info.action);

      for (var i=0; i<fields.length; i++) {
        newFields.push({
          name: fields[i].input.getAttribute('name'),
          value: fields[i].input.value,
          readOnly: false,
          remove: fields[i].del.checked});
        if (fields[i].input.value != request.info.fields[i].value ||
            fields[i].input.name != request.info.fields[i].name ||
            fields[i].del.checked) {
          modified = true;
        }
      }
      if (modified) {
        releaseBlock(request.reqId, {
          modified: true,
          action: action.input.value,
          method: method.input.value,
          fields: newFields});

      } else {
        releaseBlock(request.reqId, {});
      }
    };

    var noButton = document.createElement('button');
    noButton.className = 'no';
    noButton.innerText = 'Block';
    noButton.onclick = function() {
      yesFocus = false;
      actions.innerHTML = '';
      releaseBlock(request.reqId, {cancel: true});
    };
    actions.appendChild(yesButton);
    actions.appendChild(noButton);
    (yesFocus ? yesButton : noButton).focus();
  } else {
    disableInputs();
  }
}

















// dom manipulation functions
function createInputTable() {
  var t = document.createElement('table');
  var row = createTr();
  t.appendChild(row.tr);

  t.className = 'inputTable';
  //row.lbl.innerText = 'Name';
  row.lbl.className = 'inputName';
  //row.val.innerText = 'Value';
  row.val.className = 'inputValue';

  return t;
}

function createInputTableHeader(str) {
  var tr = document.createElement('tr');
  var th = document.createElement('th');
  th.setAttribute('colspan', '2');
  th.className = 'heading';
  th.innerText = str;
  tr.appendChild(th);
  return tr;
}

function createTrInput(lbl, name, value, allowRemove, type) {
  var row = createTr();

  row.lbl.innerText = lbl;

  if (type == 'label') {
    row.val.innerText = value;
    return {row: row.tr};
  } else if (type == 'textarea') {
    var input = document.createElement('textarea');
    input.className = 'textarea';
  } else {
    var input = document.createElement('textarea');
    input.className = 'input';
  }
  input.value = value;
  input.name = name;
  row.val.appendChild(input);

  var copy = document.createElement('button');
  copy.className = 'copybutton';
  if (type != 'textarea') {
    copy.style.top = '3px';
  }
  copy.onclick = function(e) {
    input.select();
    document.execCommand('copy', null, '');
  }
  row.val.appendChild(copy);

  var decode = document.createElement('button');
  decode.className = 'decodebutton';
  if (type != 'textarea') {
    decode.style.top = '3px';
  }
  decode.onclick = function(e) {

  }

  var del = false;
  if (allowRemove) {
    del = createDeleteBox();
    var wrap = wrapDelete(del);
    row.val.appendChild(wrap);
  }
  return {row: row.tr, input: input, del: del, originalValue: value};
}


function createTrNewEntry(type, table, list) {
  var row = createTr();
  table.appendChild(row.tr);

  var newLink = document.createElement('a');
  newLink.innerText = '[new]';
  newLink.onclick = function() {
    var newRow = createTr();
    var labelInput = document.createElement('input');
    newRow.lbl.appendChild(labelInput);
    var valueInput = document.createElement('textarea');
    valueInput.className = 'input';
    newRow.val.appendChild(valueInput);
    var deleteInput = createDeleteBox();
    var wrap = wrapDelete(deleteInput);
    newRow.val.appendChild(wrap);

    labelInput.addEventListener('input', function() {
      valueInput.setAttribute('name', this.value);
    });
    list.push({row: newRow.tr, input: valueInput,
               del: deleteInput, originalValue: ''});
    table.insertBefore(newRow.tr, row.tr);
  }
  row.lbl.appendChild(newLink);
}

function createTr() {
  var tr = document.createElement('tr');
  var labelTd = document.createElement('td');
  var valueTd = document.createElement('td');
  valueTd.className = 'inputValue';
  tr.appendChild(labelTd);
  tr.appendChild(valueTd);

  return {tr: tr, lbl: labelTd, val: valueTd};
}

function createDeleteBox() {
  var del = document.createElement('input');
  del.setAttribute('type', 'checkbox');
  del.onclick = function() {
    if (this.checked) {
      this.parentNode.parentNode.parentNode.classList.add('disabled');
    } else {
      this.parentNode.parentNode.parentNode.classList.remove('disabled');
    }
  }
  return del;
}

function wrapDelete(del) {
  var wrapper = document.createElement('div');
  wrapper.className = 'deletebutton';
  wrapper.appendChild(del);
  wrapper.onclick = function(e) {
    var click = new Event('click');
    del.dispatchEvent(click);
  };
  return wrapper;
}

function disableInputs() {
  var inputs = display.getElementsByTagName('input');
  for (var i=0; i<inputs.length; i++) {
    inputs[i].disabled = true;
  }
  var textareas = display.getElementsByTagName('textarea');
  for (var i=0; i<textareas.length; i++) {
    textareas[i].disabled = true;
  }
}

function autosize(elem) {
  var style = window.getComputedStyle(elem, null);
  var vertPad = parseFloat(style.getPropertyValue('padding-top')) + parseFloat(
      style.getPropertyValue('padding-bottom'));
  var lineHeight = parseFloat(style.getPropertyValue('line-height'));
  elem.style.height = Math.max(elem.scrollHeight - vertPad, lineHeight) + 'px';
}

function parseQueryString(str) {
  var params = [];
  str.split("&").forEach(function(keyval){
    var eqIn = keyval.indexOf("=");
    var key, value;
    if (eqIn > -1) {
      key = decodeURIComponent(keyval.substr(0, eqIn).replace(/\+/g, " "));
      value = decodeURIComponent(keyval.substr(eqIn + 1).replace(/\+/g, " "));
    } else {
      key = decodeURIComponent(keyval.replace(/\+/g, " "));
      value = "";
    }
    params.push({name: key, value: value});
  });
  return params;
}


document.addEventListener('DOMContentLoaded', function() {requestlist
  tableholder = document.getElementById('requesttablewrapper');
  table = document.getElementById('requesttable');
  display = document.getElementById('requestdetails');
  actions = document.getElementById('requestactions');
  debug = document.getElementById('debug');
  ignore = document.getElementById('ignore');
  ignore.checked = !!location.href.match('ignore=1');

  var decoderButton = document.getElementById('show-decoder');
  decoderButton.onclick = function(e) {
    document.body.classList.toggle('decoding');
  }

  var decoderInput = document.getElementById('decoder-input');
  var decoderOutput = document.getElementById('decoder-output');
  var decoderType = document.getElementById('decoder-type');
  decoderInput.onkeyup = function(e) {
    decodeInput();
  }
  decoderType.onchange = function(e) {
    decodeInput();
  }

  function decodeInput() {
    switch (decoderType.value) {
      case 'autodetect':
        try {
          decoderOutput.value = atob(decoderInput.value);
        } catch(e) {
          decoderOutput.value = decodeURIComponent(
              decoderInput.value.replace(/\+/g, ' '));
        }
        break;
      case 'urldecode':
        decoderOutput.value = decodeURIComponent(
            decoderInput.value.replace(/\+/g, ' '));
        break;
      case 'urlencode':
        decoderOutput.value = encodeURIComponent(
            decoderInput.value).replace(/ /g, '+');
        break;
      case 'b64decode':
        decoderOutput.value = atob(decoderInput.value);
        break;
      case 'b64encode':
        decoderOutput.value = btoa(decoderInput.value);
        break;
      case 'hexdecode':
        decoderOutput.value = hex_to_ascii(decoderInput.value);
        break;
      case 'hexencode':
        decoderOutput.value = ascii_to_hex(decoderInput.value);
        break;
      default:
        decoderOutput.value = 'Unknown request...';
    }
  }


  var clearRequests = function() {
    table.innerHTML = '';
    display.innerHTML = '';
    actions.innerHTML = '';
    for (var i = 0; i < background.request_order.length; i++) {
      if (background.requests[background.request_order[i]].completed) {
        delete background.requests[background.request_order[i]];
        delete background.request_order[i];
      } else {
        showRequest(background.requests[background.request_order[i]]);
      }
    }
    // remove deleted array elements
    for (var i = background.request_order.length - 1; i >= 0; i--) {
      if (typeof background.request_order[i] == 'undefined') {
        background.request_order.splice(i, 1);
      }
    }
  };

  var filterRequestList = function(searchTerm) {
    table.innerHTML = '';
    display.innerHTML = '';
    actions.innerHTML = '';
    currentFilter = searchTerm;
    for (var i = 0; i < background.request_order.length; i++) {
      if (searchObject(
          searchTerm, background.requests[background.request_order[i]])) {
        showRequest(background.requests[background.request_order[i]]);
      }
    }
  }


  var typingTimeout;
  function filterDispatch() {
    clearTimeout(typingTimeout);
    var searchTerm = this.value;
    if (searchTerm != currentFilter) {
      typingTimeout = setTimeout(function(e) {
        lastSearch = searchTerm;
        filterRequestList(searchTerm)
      }, 300);
    }
  }

  var restoreRequests = function() {
    if (!background) {
      setTimeout(restoreRequests, 10);
    } else {
      filterRequestList('');
    }
  }

  document.getElementById('clearRequestList').onclick = clearRequests;
  document.getElementById('filterRequestList').onkeyup = filterDispatch;
  restoreRequests();
});

function strip_newlines() {
  this.value = this.value.replace(/\n/g, '');
}

function hex_to_ascii(hex) {
  if (hex.length % 2 == 1) {
    hex = '0' + hex;
  }
  var ascii = '';
  for (var i = 0; i < hex.length; i += 2) {
    ascii += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return ascii;
}
function ascii_to_hex(ascii) {
  var hex = '';
  for (var i = 0; i < ascii.length; i++) {
    var hexValue = Number(ascii.charCodeAt(i)).toString(16);
    if (hexValue.length == 1) {
      hexValue = '0' + hexValue;
    }
    hex += hexValue;
  }
  return hex;
}

function searchObject(searchterm, object) {
  return !searchterm || !object.completed || recursiveSearch(
      searchterm, object.info);
}

function recursiveSearch(searchterm, object) {
  var searchKeys = Object.prototype.toString.call(object) == '[object Object]';
  for (key in object) {
    if (searchKeys && key.indexOf(searchterm) != -1) {
      return true;
    }

    var type = Object.prototype.toString.call(object[key]);
    if (type == '[object String]') {
      if (object[key].indexOf(searchterm) != -1) {
        return true;
      }
    }
    else if (type == '[object Number]') {
      if (object[key].toString().indexOf(searchterm) != -1) {
        return true;
      }
    }
    else if (type == '[object Array]' || type == '[object Object]') {
      if (recursiveSearch(searchterm, object[key])) {
        return true;
      }
    }
  }
  return false;
}
