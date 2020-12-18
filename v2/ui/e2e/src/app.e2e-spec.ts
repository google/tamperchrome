import { AppPage } from './app.po';
import { browser, logging } from 'protractor';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should check snapshot', async () => {
    await page.navigateTo();
    await page.snap('boot-empty');
    // expect().toEqual();
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
