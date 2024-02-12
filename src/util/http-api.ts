import * as https from 'https';

// Hmmm... no-experimental-fetch flag is used. Ok
// (await fetch(url)).json()
export const http = {
  async getJson<T = any>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      https
        .get(url, res => {
          let data = '';
          res.on('data', chunk => {
            data += chunk;
          });
          res.on('end', () => {
            resolve(JSON.parse(data));
          });
        })
        .on('error', err => {
          reject(err.message);
        });
    });
  },
};
