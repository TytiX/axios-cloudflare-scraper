import axios from 'axios';
import { axiosCloudflareScraper } from "../axios-intercepter";

describe('get pages', function() {
  axiosCloudflareScraper(axios);
  it('normal page', async () => {
    const response = await axios.get('https://www.google.com/');
    expect(response.status).toBe(200);
  });
  it('protected page', async () => {
    try {
      const response = await axios.get('https://www.frscan.me/changeMangaList?type=text');
      expect(response.status).toBe(200);
    } catch (e) {
      console.log(e);
      expect(e.response.status).toBe(503);
    }
  }, 45000);
});
