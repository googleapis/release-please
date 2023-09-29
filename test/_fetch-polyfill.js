// nock, used to mock HTTP requests, currently does not support the undici network stack from node v18+. As a
// consequence node native fetch isn't supported either and won't be intercepted.
// See https://github.com/nock/nock/issues/2183 and https://github.com/nock/nock/issues/2397.
//
// This file replace the native fetch by the polyfill node-fetch when node v18 is run with the flag
// --no-experimental-fetch. That's only intended as a temporary solution, the experimental flag is expected to be
// removed starting from node v22.
const fetch = require('node-fetch');
const {Headers, Request, Response} = fetch;

/* eslint-disable @typescript-eslint/no-explicit-any */
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}
