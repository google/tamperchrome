import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as http from 'http';

const extensionPath = path.join(__dirname, '../../../crx_test');

describe('Background Page', () => {
    let browser: any = null;
    let backgroundPage: any = null;
    beforeEach(async ()=>{
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 99e3;
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
                '--no-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        });
        const backgroundPageTarget = await browser.waitForTarget(
          (target: any) => target.type() === 'background_page'
        );
        expect(backgroundPageTarget).toBeTruthy();
        backgroundPage = await backgroundPageTarget.page();
        backgroundPage.on('dialog', async (dialog: any) => {
            console.log(dialog.message());
            await dialog.dismiss();
            fail(dialog.message());
        });
    });
    const triggerExtension = async () => {
        await backgroundPage.evaluate(()=>{
            // @ts-ignore evaluated in background page
            chrome.tabs.getSelected(tab=>{
                // @ts-ignore undocumented api
                chrome.browserAction.onClicked.dispatch(tab);
            });
        });
        const target = await browser.waitForTarget(
            (target: any) => target.url().match('/ui/dist/ui/index.html')
        );
        expect(target).toBeTruthy();
        const page = await target.page();
        await new Promise(res=>page.once('load', res));
        return page;
    };
    it('does basic header modification', async ()=>{
        const server = http.createServer((req, res)=>{
            res.writeHead(200);
            res.end(JSON.stringify({headers: req.headers}));
        });
        let listening = new Promise(res=>server.once('listening', res));
        server.listen();
        await listening;
        expect(server.address()).toBeTruthy();
        // @ts-ignore http servers always return a port
        const port = server.address()!.port;
        const page = await browser.newPage();
        await page.goto(`http://127.0.0.1:${port}/headers`);
        const extPage = await triggerExtension();
        await extPage.keyboard.type("/headers");
        await extPage.keyboard.press("Enter");
        await extPage.keyboard.press("Tab");
        await extPage.keyboard.press("Space");
        const reloadPromise = page.reload();
        const req = await extPage.waitForSelector('[apprequestlistitem]');
        await req.click();
        const reqHeaderInputs = await extPage.$$(
            '[apprequesteditorheaderitem] input[tabindex="0"]');
        expect(reqHeaderInputs.length).toBeGreaterThanOrEqual(2);
        await reqHeaderInputs[0].click({clickCount: 2});
        await extPage.keyboard.type("ModifiedReqHeaderName");
        await extPage.keyboard.press("Tab");
        await extPage.keyboard.type("ModifiedReqHeaderValue");
        const reqButton = await extPage.$(
            'app-request-editor mat-card-actions button');
        expect(reqButton).toBeTruthy();
        reqButton.click();
        const resButton = await extPage.waitForSelector(
            'app-response-editor mat-card-actions button');
        expect(resButton).toBeTruthy();
        const resHeaderInputs = await extPage.$$(
            '[appresponseeditorheaderitem] input[tabindex="0"]');
        expect(resHeaderInputs.length).toBeGreaterThanOrEqual(2);
        await resHeaderInputs[0].click({clickCount: 2});
        await extPage.keyboard.type("ModifiedResHeaderName");
        await extPage.keyboard.press("Tab");
        await extPage.keyboard.type("ModifiedResHeaderValue");
        resButton.click();
        const reloadResponse = await reloadPromise;
        expect(reloadResponse.ok()).toBeTruthy();
        expect(reloadResponse.headers()['modifiedresheadername'])
            .toBe('ModifiedResHeaderValue');
        const reqHeaders = await reloadResponse.json();
        expect(reqHeaders.headers['modifiedreqheadername'])
            .toBe('ModifiedReqHeaderValue');
    })
});
