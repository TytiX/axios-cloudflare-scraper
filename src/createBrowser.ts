import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getUserAgent } from './utils';

const {
  PUPPETEER_HEADLESS = 'true',
  PUPPETEER_IGNORE_HTTPS_ERROR = 'false',
  HTTP_PROXY,
  HTTPS_PROXY
} = process.env;

import peppeteerCore from 'puppeteer';

const puppeteer = addExtra(peppeteerCore);
const stealth = StealthPlugin();
puppeteer.use(stealth);

export async function createBrowser(options) {
  const {
    proxy = HTTP_PROXY || HTTPS_PROXY,
    // browserWSEndpoint,
    // browserUrl,
    puppeteerOptions: userPuppeteerOptions = {}
  } = options;
  const ignoreHTTPSErrors = PUPPETEER_IGNORE_HTTPS_ERROR === 'true';

  // if (browserWSEndpoint || browserUrl) {
  //   return puppeteer.connect({ browserWSEndpoint, browserUrl, ignoreHTTPSErrors });
  // }

  let args = ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=' + getUserAgent()];
  if(userPuppeteerOptions.args) {
    args = args.concat(userPuppeteerOptions.args)
  }
  if (proxy) {
    args.push(`--proxy-server=${proxy}`);
  }

  let puppeteerOptions = {
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    headless: PUPPETEER_HEADLESS === 'true',
    ignoreHTTPSErrors,
    ...userPuppeteerOptions,
    args
  };

  return await puppeteer.launch(puppeteerOptions);
}
