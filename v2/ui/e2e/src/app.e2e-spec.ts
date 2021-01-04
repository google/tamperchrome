import { AppPage } from './app.po';
import { by, logging, Key, browser } from 'protractor';

const sendKeysToActiveElement = async (...keys) => {
  await browser.waitForAngular();
  await browser.controlFlow().execute(() =>
    browser.switchTo().activeElement().sendKeys(...keys));
};

const numberOfVisibleElements = async (css) => {
  await browser.waitForAngular();
  const elems = await browser.findElements(by.css(css));
  const elemsViz = await Promise.all(elems.map(elem=>elem.isDisplayed()));
  return elemsViz.filter(visible=>visible).length;
};

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should have basic filter at boot', async () => {
    await page.navigateTo();
    await page.snap('boot-empty');
    await sendKeysToActiveElement('testFilter');
    await sendKeysToActiveElement(Key.ENTER);
    await page.snap('boot-filter-added');
    await sendKeysToActiveElement('anotherTestFilter');
    await sendKeysToActiveElement(Key.ENTER);
    await page.snap('boot-filter-added-again');
    await sendKeysToActiveElement(Key.chord(Key.SHIFT, Key.TAB));
    await sendKeysToActiveElement(Key.DELETE);
    await page.snap('boot-filter-deleted');
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.SPACE);
    await page.snap('boot-intercept-switch-enabled');
  });

  it('should filter requests properly', async () => {
    await page.navigateTo();
    await page.postMessage({
      event: 'onRequest',
      request: {
        id: 'fil1',
        method: 'POST',
        url: 'https://example.com/foo?fuu',
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
        url: 'https://example.net/fuu?fuu',
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
        url: 'https://example.org/foo?fuu',
        requestHeaders: [],
        requestBody: undefined
      }
    }, [
      (await page.createMessageChannel())[0]
    ]);
    expect(numberOfVisibleElements('[appRequestListItem]')).toBe(3);
    await page.snap('filter-unfiltered');
    await sendKeysToActiveElement('f');
    await sendKeysToActiveElement(Key.DOWN);
    await sendKeysToActiveElement(Key.ENTER);
    expect(numberOfVisibleElements('[appRequestListItem]')).toBe(2);
    await page.snap('filter-filtered-foo');
    await sendKeysToActiveElement('P');
    await sendKeysToActiveElement(Key.DOWN);
    await sendKeysToActiveElement(Key.DOWN);
    await sendKeysToActiveElement(Key.ENTER);
    expect(numberOfVisibleElements('[appRequestListItem]')).toBe(1);
    await page.snap('filter-filtered-foo-put');
    await page.postMessage({
      event: 'onRequest',
      request: {
        id: 'fil4',
        method: 'PUT',
        url: 'https://qux/foo',
        requestHeaders: [],
        requestBody: undefined
      }
    }, [
      (await page.createMessageChannel())[0]
    ]);
    expect(numberOfVisibleElements('[appRequestListItem]')).toBe(2);
    await page.snap('filter-filtered-foo-put-extra');
    await page.postMessage({
      event: 'onRequest',
      request: {
        id: 'fil5',
        method: 'HEAD',
        url: 'https://foo/foo?foo',
        requestHeaders: [],
        requestBody: undefined
      }
    }, [
      (await page.createMessageChannel())[0]
    ]);
    await page.postMessage({
      event: 'onRequest',
      request: {
        id: 'fil6',
        method: 'PUT',
        url: 'https://bar/bar?bar',
        requestHeaders: [],
        requestBody: undefined
      }
    }, [
      (await page.createMessageChannel())[0]
    ]);
    expect(numberOfVisibleElements('[appRequestListItem]')).toBe(2);
    await page.snap('filter-filtered-foo-put-extra-nomatch');
  });

  it('should capture and respond to request', async () => {
    await page.navigateTo();
    // enable interception
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.SPACE);
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
    await page.snap('capture-request');
    // tab to the first element
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await page.snap('capture-request-list-focused');
    // tab to request editor
    await sendKeysToActiveElement(Key.TAB);
    // modify the method
    await sendKeysToActiveElement('HEAD');
    await page.snap('capture-request-method');
    // dont modify the url
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    // modify the host header
    await sendKeysToActiveElement('Original-Host');
    await page.snap('capture-request-host-changed');
    // skip header value and send header checkbox
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    // add new header
    await sendKeysToActiveElement(Key.ENTER);
    await sendKeysToActiveElement('New-Header');
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement('NewHeader Value!');
    await page.snap('capture-request-add-header');
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.ENTER);
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
    await page.snap('capture-response-arrived');
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement('302');
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement('Server-Header-Value');
    await page.snap('capture-response-edit-server');
    await sendKeysToActiveElement(Key.ARROW_DOWN);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.SPACE);
    await page.snap('capture-response-disable-xss');
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.ENTER);
    await sendKeysToActiveElement('AnotherNewHeader');
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement('NewValue');
    await page.snap('capture-response-add-header');
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.TAB);
    await sendKeysToActiveElement(Key.ENTER);
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
