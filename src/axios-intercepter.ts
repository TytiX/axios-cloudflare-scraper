import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { isProtectedByStormwall, getStormwallCookie } from 'stormwall-bypass';

import { getUserAgent, isCloudflareCaptchaChallenge, isCloudflareJSChallenge } from './utils';
import { fillCookiesJar } from './fillCookieJar';

function isCloudflareIUAMError(error) {
  if (error.response) {
    const body = error.response.data;
    return isCloudflareJSChallenge(body) || isCloudflareCaptchaChallenge(body);
  }
  return false;
}

const jar = new CookieJar();

function cloudflareRequestInterceptor(config) {
  config.jar = jar;
  config.headers = {
    'User-Agent': getUserAgent()
  };
  return config;
}

function cloudflareResponseInterceptor(response) {
  const { jar, url } = response.config;
  const targetUrl = url;
  const body = response.data;
  if (isProtectedByStormwall(body)) {
    const cookie = getStormwallCookie(body);
    jar.setCookie(cookie, targetUrl, { loose: false });
    return axios(response.config); //request(options);
  }
  return response;
}

async function cloudflareResponseErrorInterceptor(error) {
  if (isCloudflareIUAMError(error)) {
    const { config } = error;
    await fillCookiesJar(axios, config);
    return axios(config);
  }
  // throw error;
  return Promise.reject(error);
}

export function axiosCloudflareScraper(axios) {
  axios.interceptors.request.use(cloudflareRequestInterceptor);
  axios.interceptors.response.use(cloudflareResponseInterceptor, cloudflareResponseErrorInterceptor);
}
