import { AppPage } from './app.po';
import { browser, element, by, logging } from 'protractor';
import { protractor } from 'protractor/built/ptor';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should have basic functionality at boot', async () => {
    await page.navigateTo();
    await page.snap('boot-empty');
    let focused = browser.switchTo().activeElement();
    await focused.sendKeys('testFilter');
    await focused.sendKeys(protractor.Key.ENTER);
    await page.snap('boot-filter-added');
    await focused.sendKeys('anotherTestFilter');
    await focused.sendKeys(protractor.Key.ENTER);
    await page.snap('boot-filter-added-again');
    await focused.sendKeys(protractor.Key.chord(protractor.Key.SHIFT, protractor.Key.TAB));
    focused = browser.switchTo().activeElement();
    await focused.sendKeys(protractor.Key.DELETE);
    await page.snap('boot-filter-deleted');
    focused = browser.switchTo().activeElement();
    await focused.sendKeys(protractor.Key.TAB);
    focused = browser.switchTo().activeElement();
    await focused.sendKeys(protractor.Key.TAB);
    focused = browser.switchTo().activeElement();
    await focused.sendKeys(protractor.Key.SPACE);
    await page.snap('boot-intercept-switch-enabled');
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
    // Assert that there are no snapshot differences
    if(page.getDiffs().length) {
      fail('Difference in golden files found. If this is expected, run e2e/src/goldens/update.sh\n\n');
      page.getDiffs().forEach(diff=>{
        expect(diff).toEqual({});
      });
    }
  });
});
