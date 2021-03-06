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

function cloudflareResponseErrorInterceptor(error) {
  return new Promise( async (resolve, reject) => {
    if (isCloudflareIUAMError(error)) {
      try {
        const { config } = error;
        await fillCookiesJar(axios, config);
        resolve(await axios(config));
      } catch (e) {
        reject(e);
      }
    }
    reject(error);
  });
}

export function axiosCloudflareScraper(axios) {
  axios.interceptors.request.use(cloudflareRequestInterceptor);
  axios.interceptors.response.use(cloudflareResponseInterceptor, cloudflareResponseErrorInterceptor);
}
