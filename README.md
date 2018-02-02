[Tamper Chrome](https://chrome.google.com/webstore/detail/tamper-chrome-extension/hifhgpdkfodlpnlmlnmhchnkepplebkb) is a Chrome extension that allows you to modify HTTP requests on the fly and aid on web security testing. Tamper Chrome works across all operating systems (including Chrome OS).

# How To Install *Tamper Chrome*

***Tamper Chrome* has two components that need to be installed:** 
1. **First Install the [*Tamper Chrome* Extension](https://chrome.google.com/webstore/detail/tamper-chrome-extension/hifhgpdkfodlpnlmlnmhchnkepplebkb?hl=en)**
2. **Then Install the [*Tamper Chrome* Application](https://chrome.google.com/webstore/detail/tamper-chrome-application/odldmflbckacdofpepkdkmkccgdfaemb)**
3. **Restart your browser.**

# Want to know how to use *Tamper Chrome*?

If you have any more questions feel free to post [to the group](https://groups.google.com/forum/#!forum/tamper-chrome-help).

## How to open *Tamper Chrome*?
1.  **First of all, you need to open Google Chrome DevTools.**

    To do that, open the Chrome menu ![Chrome menu](https://sirdarckcat.github.io/images/menu.png) at the top-right of your browser window, then select More Tools > Developer Tools.

    ![Chrome Developer Tools](https://sirdarckcat.github.io/images/devtools.png)

    You can find more help [here](https://developers.google.com/web/tools/chrome-devtools/iterate/inspect-styles/shortcuts?hl=en#accessing-devtools).

    Make sure to close and re-open every Dev Tools after installing *Tamper Chrome*.

1.  **After that, you will find a new tab called "Tamper" at the top-right side, and click on it.**

    ![Tamper menu](https://sirdarckcat.github.io/images/tamper.png)


## How to use *Tamper Chrome*?

![Tamper Chrome](https://sirdarckcat.github.io/images/start.png)

*Tamper Chrome* has 6 different tools which do slightly different things as described below. You have to individually activate each tool.

To do so, simply click on the checkbox next to the tool's name, and this will mark the tool as active.


![Active](https://sirdarckcat.github.io/images/active.png)


In the following section we explain how to use each tool.

### Block / Reroute Requests

This tool allows you to either **block** or **redirect** a request from the browser, for example, if a website is requesting a minified version of jQuery, you can redirect it to the unminified version of jQuery.

You can do that by simply changing the URL and clicking *Allow*.

![Block](https://sirdarckcat.github.io/images/block.png)

You can also click on *Edit javascript* and *Edit stylesheets*, which will allow you to modify the javascript and CSS code itself.

**Note** that by clicking *ignore requests*, you will let all requests pass through.

### Request Headers

While Block / Reroute requests is useful to tamper with a website, and cancel some requests, in many cases you might want to modify HTTP request headers.

This tool will allow you to do just that.

![Headers](https://sirdarckcat.github.io/images/headers.png)

You can drop a header by clicking on the *Trash* icon, or copy its value by clicking on the *Copy* icon. You can add a new header by clicking on the [ *new* ] button.

### Response Headers

The response headers work exactly the same as the request headers. It allows you to drop, modify or add new headers.

![Response](https://sirdarckcat.github.io/images/response.png)

Very useful for dropping or modifying many security headers like Content-Security-Policy, X-Frame-Options, X-XSS-Protection, etcetera.

### Monitor PostMessages

Unlike the other tools, this tool is mostly only useful for monitoring websites that use the HTML5 postMessage API.

When activated, it does the following:
-  It logs every message received on all iframes in the current tab. ![log](https://sirdarckcat.github.io/images/postmessagelog.png)
-  It sets a breakpoint on every handler that listens to postMessage. ![breakpoint](https://sirdarckcat.github.io/images/postmessage.png)


### Monitor Reflected XSS

Another very cool feature of *Tamper Chrome* is that it allows you to debug XSS vulnerabilities a bit better.

When testing for XSS, you can use `<tc-xss>` as an HTML element, and *Tamper Chrome* will automatically detect it, and show you where it is and the stack trace from where it was generated. Particularly useful for DOM XSS.

Note that you can also use `<tamperchrome>` and `<tcxss>`, which also work as an attribute, and as a javascript variable.

To trigger it, just use as your XSS payload `tamperchrome` as an attribute, tagname or javascript variable.

![tcxss](https://sirdarckcat.github.io/images/tcxss.png)

### Replay Requests (Experimental)

The last tool in *Tamper Chrome* is to replay and modify requests. This is particularly useful because it allows you to modify POST requests including their body (or make POST requests into GET requests), that otherwise would be difficult or impossible.

![replay](https://sirdarckcat.github.io/images/replay.png)

# NOTE

This is not an official Google product.
