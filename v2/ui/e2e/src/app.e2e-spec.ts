import { AppPage } from './app.po';
import { browser, element, by, logging, until } from 'protractor';
import { protractor } from 'protractor/built/ptor';

function sendKeysToActiveElement(...keys) {
  return browser.switchTo().activeElement().sendKeys(...keys);
}

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should have basic filter at boot', async () => {
    await page.navigateTo();
    await page.snap('boot-empty');
    await sendKeysToActiveElement('testFilter');
    await sendKeysToActiveElement(protractor.Key.ENTER);
    await page.snap('boot-filter-added');
    await sendKeysToActiveElement('anotherTestFilter');
    await sendKeysToActiveElement(protractor.Key.ENTER);
    await page.snap('boot-filter-added-again');
    await sendKeysToActiveElement(protractor.Key.chord(protractor.Key.SHIFT, protractor.Key.TAB));
    await sendKeysToActiveElement(protractor.Key.DELETE);
    await page.snap('boot-filter-deleted');
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.SPACE);
    await page.snap('boot-intercept-switch-enabled');
  });

  it('should filter requests properly', async () => {
    await page.navigateTo();
    await page.postMessage({
      event: 'onRequest',
      request: {
        id: 'fil1',
        method: 'GET',
        url: 'https://example.com/foo?bar',
        requestHeaders: [],
        requestBody: undefined
      }
    }, [
      (await page.createMessageChannel())[0]
    ]);
    await page.postMessage({
      event: 'onRequest',
      request: {
        id: 'fil2',
        method: 'POST',
        url: 'https://example.net/bar?baz',
        requestHeaders: [],
        requestBody: undefined
      }
    }, [
      (await page.createMessageChannel())[0]
    ]);
    await page.postMessage({
      event: 'onRequest',
      request: {
        id: 'fil3',
        method: 'PUT',
        url: 'https://example.org/baz?foo',
        requestHeaders: [],
        requestBody: undefined
      }
    }, [
      (await page.createMessageChannel())[0]
    ]);
    await browser.waitForAngular();
    expect((await browser.findElements(by.css('[appRequestListItem]'))).length).toBe(3);
    await page.snap('filter-unfiltered');
    await sendKeysToActiveElement('foo', protractor.Key.ENTER);
    expect((await browser.findElements(by.css('[appRequestListItem]'))).length).toBe(2);
    await page.snap('filter-filtered-foo');
    await sendKeysToActiveElement('PUT', protractor.Key.ENTER);
    await page.snap('filter-filtered-foo-put');
  });

  it('should capture and respond to request', async () => {
    await page.navigateTo();
    // enable interception
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.SPACE);
    // send a request
    const [port1, port2] = await page.createMessageChannel();
    await page.postMessage({
      event: 'onRequest',
      request: {
        id: 'req1',
        method: 'GET',
        url: 'https://example.com/',
        requestHeaders: [{name: 'Host', value: 'example.com'}],
        requestBody: undefined
      }
    }, [
      port1
    ]);
    // wait for the request to show up in the list
    await browser.waitForAngular();
    await page.snap('capture-request');
    // tab to the first element
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await page.snap('capture-request-list-focused');
    // tab to request editor
    await sendKeysToActiveElement(protractor.Key.TAB);
    // modify the method
    await sendKeysToActiveElement('HEAD');
    await page.snap('capture-request-method');
    // dont modify the url
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    // modify the host header
    await sendKeysToActiveElement('Original-Host');
    await page.snap('capture-request-host-changed');
    // skip header value and send header checkbox
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    // add new header
    await sendKeysToActiveElement(protractor.Key.ENTER);
    await sendKeysToActiveElement('New-Header');
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement('NewHeader Value!');
    await page.snap('capture-request-add-header');
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.ENTER);
    await page.snap('capture-request-send');
    const modifiedRequest = (await page.waitForMessageToPort(port2)).data.request;
    expect(modifiedRequest).toEqual({
      method: 'HEAD',
      url: 'https://example.com/',
      requestHeaders: [
        {name: 'Original-Host', value: 'example.com'},
        {name: 'New-Header', value: 'NewHeader Value!'},
      ],
      requestBody: null
    });
    // send a response
    const [port3, port4] = await page.createMessageChannel();
    await page.postMessage({
      event: 'onResponse',
      response: {
        id: 'req1',
        status: 200,
        responseHeaders: [
          {name: 'Server', value: 'fake'},
          {name: 'X-XSS-Protection', value: '1'},
        ],
      }
    }, [
      port3
    ]);
    // wait for the response to arrive
    await browser.waitForAngular();
    await page.snap('capture-response-arrived');
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement('302');
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement('Server-Header-Value');
    await page.snap('capture-response-edit-server');
    await sendKeysToActiveElement(protractor.Key.ARROW_DOWN);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.SPACE);
    await page.snap('capture-response-disable-xss');
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.ENTER);
    await sendKeysToActiveElement('AnotherNewHeader');
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement('NewValue');
    await page.snap('capture-response-add-header');
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.TAB);
    await sendKeysToActiveElement(protractor.Key.ENTER);
    const modifiedResponse = (await page.waitForMessageToPort(port4)).data.response;
    expect(modifiedResponse).toEqual({
      status: 302,
      responseHeaders: [
        {name: 'Server', value: 'Server-Header-Value'},
        {name: 'AnotherNewHeader', value: 'NewValue'}
      ],
      responseBody: null
    });
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
    // Assert that there are no snapshot differences
    if(page.getDiffs().length) {
      fail('Difference in golden files found. If this is expected, run make e2e-goldens\n\n');
      page.getDiffs().forEach(diff=>{
        expect(diff).toEqual({});
      });
    }
  });
});
