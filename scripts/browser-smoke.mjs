import puppeteer from 'puppeteer-core';

const baseUrl = process.env.MENU_TEST_BASE_URL || 'http://127.0.0.1:3000';
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
});

const errors = [];
const failedRequests = [];

async function inspectPage(path, assertion) {
  const page = await browser.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ path, text: message.text() });
  });
  page.on('pageerror', (error) => errors.push({ path, text: error.message }));
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.includes('/vendor/') || url.includes('supabase-client.js') || url.includes('supabase-config.js')) {
      failedRequests.push({ path, url, failure: request.failure()?.errorText || 'unknown failure' });
    }
  });

  const response = await page.goto(baseUrl + path, { waitUntil: 'networkidle2', timeout: 30000 });
  if (!response || response.status() !== 200) throw new Error(`${path}: expected HTTP 200`);
  await assertion(page);
  await page.close();
}

try {
  await inspectPage('/', async (page) => {
    await page.waitForSelector('#serviceRequestForm', { timeout: 10000 });
    await page.type('#reqBusinessName', 'اختبار تحقق محلي');
    await page.type('#reqContactName', 'فحص');
    await page.type('#reqContactPhone', 'invalid');
    await page.click('#submitRequestBtn');
    await page.waitForFunction(() => document.getElementById('formStatus')?.textContent?.includes('رقم هاتف صالح'), { timeout: 5000 });
  });

  await inspectPage('/owner', async (page) => {
    await page.waitForSelector('#ownerAuthSection:not([hidden])', { timeout: 10000 });
    const hasDemoControl = await page.$('#demoOperatorBtn');
    if (hasDemoControl) throw new Error('/owner: production demo control is still present');
  });

  await inspectPage('/admin', async (page) => {
    await page.waitForSelector('#authCard', { timeout: 10000 });
    const runtimeScripts = await page.$$eval('script[src^="admin-runtime/"]', (scripts) => scripts.map((script) => script.getAttribute('src')));
    if (runtimeScripts.length !== 7) throw new Error('/admin: controlled local runtime is incomplete');
  });

  await inspectPage('/client', async (page) => {
    await page.waitForSelector('#authSection:not([hidden])', { timeout: 10000 });
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    const menuButton = await page.$('#mobileMenuToggle');
    if (!menuButton) throw new Error('/client: mobile navigation control is missing');
  });

  await inspectPage('/menu?tenant=oaza', async (page) => {
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.waitForFunction(
      () => document.getElementById('dataModeLabel')?.textContent?.includes('مباشر'),
      { timeout: 30000 }
    );
    const productCount = await page.$$eval('#menuList .menu-item', (items) => items.length);
    if (productCount < 1) throw new Error('/menu?tenant=oaza: live menu has no rendered products');
  });

  await inspectPage('/website', async (page) => {
    await page.waitForSelector('#wsWizard', { timeout: 10000 });
  });

  await inspectPage('/visibility', async (page) => {
    await page.waitForSelector('#vsWizard', { timeout: 10000 });
  });

  if (errors.length || failedRequests.length) {
    throw new Error(JSON.stringify({ errors, failedRequests }, null, 2));
  }
  console.log('Browser smoke test passed.');
} finally {
  await browser.close();
}
