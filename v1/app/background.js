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
var socket = chrome.socket;
var socketInfo;
var uiWindow;
var windowExists = false;
var requests = {};
var request_order = [];


// basic accept wrapper
var onAccept = function(acceptInfo) {
  if (acceptInfo.resultCode < 0) {
    return;
  }
  readFromSocket(acceptInfo.socketId);
};

// data manipulation functions
var stringToUint8Array = function(string) {
  var buffer = new ArrayBuffer(string.length);
  var view = new Uint8Array(buffer);
  for(var i = 0; i < string.length; i++) {
    view[i] = string.charCodeAt(i);
  }
  return view;
};

var arrayBufferToString = function(buffer) {
  var str = '';
  var uArrayVal = new Uint8Array(buffer);
  for(var s = 0; s < uArrayVal.length; s++) {
    str += String.fromCharCode(uArrayVal[s]);
  }
  return str;
};

function parseQuery(qstr)
{
  var query = {};
  var a = qstr.split('&');
  for (var i in a)
  {
    var b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
  }
  return query;
}

// action functions
var sendResponse = function(socketId, value) {
  var contentType = "text/plain";
  var contentLength = encodeURI(value).split(/%..|./).length - 1;;
  var header = stringToUint8Array(
      "HTTP/1.0 200 OK\nAccess-Control-Allow-Origin: *\nContent-length: " +
      contentLength + "\nContent-type:" + contentType + "\n\n");
  var content = stringToUint8Array(value)
  var outputBuffer = new ArrayBuffer(header.byteLength + contentLength);

  var view = new Uint8Array(outputBuffer)
  view.set(header, 0);
  view.set(stringToUint8Array(value), header.byteLength);
  socket.write(socketId, outputBuffer, function(writeInfo) {
    socket.destroy(socketId);
  });
};

var readFromSocket = function(socketId) {

  var headers = '';
  var content = '';
  var totalContentLength;
  var contentLengthSoFar;

  // get the first chunk
  socket.read(socketId, function(readInfo) {
    var data = arrayBufferToString(readInfo.data);
    // the chrome socket read API only calls the callback if there's data, so we
    // need to keep reading until content length is satisfied to know we're done
    var headerEndLoc = data.indexOf("\r\n\r\n");
    headers = data.substring(0, headerEndLoc)
    content = data.substring(headerEndLoc + 4);

    if (content.length == 0) {
      handleRequest(headers);
    } else {
      // no unicode in the headers, so assume char == byte
      contentLengthSoFar = readInfo.resultCode - headers.length - 4;
      var lengthLoc = headers.indexOf("\nContent-Length: ");
      var lengthEnd = data.indexOf("\r\n", lengthLoc);
      totalContentLength = parseInt(
          data.substring(lengthLoc + 16, lengthEnd), 10);
      readChunk();
    }
  });

  function readChunk() {
    if (totalContentLength == contentLengthSoFar) {
      handleRequest(headers, content);
    } else {
      socket.read(socketId, function(readInfo) {
        content += arrayBufferToString(readInfo.data);
        contentLengthSoFar += readInfo.resultCode;
        readChunk();
      });
    }
  }

  function handleRequest(headers, content) {
    var methodEnd = headers.indexOf(" ");
    var uriEnd = headers.indexOf(" ", methodEnd + 1);
    var method = headers.substring(0, methodEnd);
    var uri = headers.substring(methodEnd + 1, uriEnd);
    var R = /^Origin: chrome-extension:\/\/hifhgpdkfodlpnlmlnmhchnkepplebkb\r?$/;
    var valid = headers.split('\n').some(function(header) {
      return !!header.match(R);
    });

    if (method == 'GET') {
      // handle "hello" requests
      if (uri == '/hello') {
        sendResponse(socketId, 'Hello');
      } else {
        sendResponse(socketId, 'I have no idea what you\'re talking about');
      }
      socket.accept(socketInfo.socketId, onAccept);
    } else

    if (method == 'POST' && valid) {

      // parse post data
      if (content) {
        query = parseQuery(content);
      } else {
        query = {};
      }

      try {
        // handle "start" requests
        if (uri == '/start') {
          // start requests need 'request' (unique) and 'type' properties
          if (!query.hasOwnProperty('request')) {
            sendResponse(socketId,
                '{"error": "INVALID START: request not given"}');
          } else if (!query.hasOwnProperty('type')) {
            sendResponse(socketId,
                '{"error": "INVALID START: type not given"}');
          } else if (requests.hasOwnProperty(query.request)) {
            sendResponse(socketId,
                '{"error": "INVALID START: duplicate request"}');
          } else {
            // fire off the start request
            startRequest(socketId, query.request, query.type, query.data,
                query.aux);
          }
        }

        // handle "end" requests
        else if (uri == '/end') {
          // end requests need already started 'request' property
          if (!query.hasOwnProperty('request') ||
              !requests.hasOwnProperty(query.request) ||
              requests[query.request].completed) {
            sendResponse(socketId,
                '{"error": "INVALD END: request not found"}');
          } else {
            // fire off the end request and unblock the extension
            endRequest(socketId, requests[query.request], 'done');
          }
        }

        // handle "view" requests
        else if (uri == '/view') {
          sendResponse(socketId, JSON.stringify(requests));
        }

        // handle anything else
        else {
          var response = {error: 'Invalid request: '+uri};
          sendResponse(socketId, JSON.stringify(response));
        }
      } catch (e) {
        console.error('Some kind of socket error :(');
        console.error(e);
      }
    } else {
      sendResponse(socketId, '{"error": "Only GET and POST supported"}');
    }
    socket.accept(socketInfo.socketId, onAccept);
  }
};

// request handlers
var startRequest = function(socketId, request, type, data, aux) {
  launchApp();
  if (!data) {
    info = {};
  } else {
    info = JSON.parse(data);
  }
  var requestObject = {
      reqId: request,
      socketId: socketId,
      type: type,
      info: info,
      aux: aux,
      completed: false};
  requests[request] = requestObject;

  // update the UI
  var contentWindowAddRequest = function() {
    try {
      uiWindow.contentWindow.addRequest(requestObject);
    } catch(e) {
      console.log('failed to add request, trying again in a moment...');
      setTimeout(contentWindowAddRequest, 10);
    }
  }
  contentWindowAddRequest();
}

var endRequest = function(socketId, request, retval, debug) {
  if (debug) {
    retval.debug = true;
  }
  // send a response to both sockets
  sendResponse(request.socketId, JSON.stringify(retval));
  if (socketId) {
    sendResponse(socketId, 'Responded to request '+request.reqId);
  }
  // mark the request as completed
  request.completed = true;
}

// function to launch the application
var launchApp = function() {
  if (!uiWindow || !uiWindow.contentWindow.window || uiWindow.contentWindow.closed) {
    console.log('popping window');
    forceLaunchApp();
  }
};

var forceLaunchApp = function(extraArgs) {
  chrome.app.window.create('window.html?'+extraArgs, {
    'id': 'UI',
    'bounds': {
      'width': 900,
      'height': 900
    }
  }, function(createdWindow) {
    uiWindow = createdWindow;
    uiWindow.onClosed.addListener(function(e) {
      for (request_id in requests) {
        if (!requests[request_id].completed) {
          forceLaunchApp('ignore=1');
          break;
        }
      }
    });
  });
}

// start listening on the socket
socket.create("tcp", {}, function(_socketInfo) {
  socketInfo = _socketInfo;
  try {
    socket.listen(socketInfo.socketId, "127.0.0.1", 34013, 20,
      function(result) {
        socket.accept(socketInfo.socketId, window.onAccept);
      }
    );
  } catch (e) {
    uiWindow.contentWindow.document.body.innerHTML =
        '<h1>Failed to start: port 34013 is in use.</h1>';
  }
});

// Someone clicked launch? show them the popup I guess...
chrome.app.runtime.onLaunched.addListener(launchApp);
