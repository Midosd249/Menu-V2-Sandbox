import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 390, height: 844, isMobile: true } });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  const response = await page.goto('http://127.0.0.1:3000/client', { waitUntil: 'networkidle2', timeout: 30000 });
  if (!response || response.status() !== 200) throw new Error('client page did not return HTTP 200');
  await page.waitForSelector('#authSection:not([hidden])', { timeout: 10000 });
  const initialState = await page.evaluate(() => ({
    authVisible: !document.getElementById('authSection').hidden,
    dashboardHidden: document.getElementById('dashboardContent').hidden,
    portalState: window.clientPortalState?.state || null
  }));
  if (!initialState.authVisible || !initialState.dashboardHidden) throw new Error(`invalid initial auth layout: ${JSON.stringify(initialState)}`);

  await page.click('#demoMaqsoudBtn');
  await page.waitForFunction(() => window.clientPortalState?.mode === 'demo', { timeout: 5000 });
  await page.click('.client-nav-item[data-panel="team"]');
  await page.waitForSelector('#panel-team.active', { timeout: 5000 });
  await page.click('#teamAddBtn');
  await page.waitForSelector('#teamDialog .team-dialog-box', { visible: true, timeout: 5000 });

  const modalState = await page.$eval('#teamDialog .team-dialog-box', (box) => {
    const style = getComputedStyle(box);
    return {
      visible: style.visibility === 'visible' && style.opacity !== '0',
      background: style.backgroundColor,
      zIndex: Number(style.zIndex),
      pointerEvents: style.pointerEvents,
      direction: style.direction,
      activeElement: document.activeElement?.id || null
    };
  });
  if (!modalState.visible || modalState.zIndex < 1000 || modalState.pointerEvents !== 'auto' || modalState.direction !== 'rtl' || modalState.activeElement !== 'teamEmail') {
    throw new Error(`invalid team modal state: ${JSON.stringify(modalState)}`);
  }
  if (modalState.background === 'rgba(0, 0, 0, 0)' || modalState.background === 'transparent') throw new Error('team modal is transparent');

  await page.click('.team-dialog-backdrop');
  await page.waitForSelector('#teamDialog', { hidden: true, timeout: 5000 });
  await page.click('#teamAddBtn');
  await page.waitForSelector('#teamDialog .team-dialog-box', { visible: true, timeout: 5000 });
  await page.click('.team-dialog-actions [data-close]');
  await page.waitForSelector('#teamDialog', { hidden: true, timeout: 5000 });
  await page.click('#teamAddBtn');
  await page.waitForSelector('#teamDialog .team-dialog-box', { visible: true, timeout: 5000 });
  await page.keyboard.press('Escape');
  await page.waitForSelector('#teamDialog', { hidden: true, timeout: 5000 });
  const restoredFocus = await page.evaluate(() => document.activeElement?.id || null);
  if (restoredFocus !== 'teamAddBtn') throw new Error(`focus was not restored: ${restoredFocus}`);
  if (errors.length) throw new Error(`browser errors: ${JSON.stringify(errors)}`);
  console.log('Client/team browser smoke test passed.');
} finally {
  await browser.close();
}
