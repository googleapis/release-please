import {expect} from 'chai';
import {GraphqlResponseError} from '@octokit/graphql';
import {
  isOctokitGraphqlResponseError,
  isOctokitRequestError,
} from '../../src/errors';
import {RequestError} from '@octokit/request-error';

describe('Errors', () => {
  describe('isOctokitRequestError', () => {
    it('should return true for valid RequestError', () => {
      const error = new RequestError('Not Found', 404, {
        request: {method: 'GET', url: '/foo/bar', headers: {}},
        headers: {},
      });
      expect(isOctokitRequestError(error)).to.be.true;
    });

    it('should return false for invalid RequestError', () => {
      const error = {
        name: 'SomeOtherError',
        status: 500,
        request: 'invalid_request_object',
      };
      expect(isOctokitRequestError(error)).to.be.false;
    });
  });

  describe('isOctokitGraphqlResponseError', () => {
    it('should return true for valid GraphqlResponseError', () => {
      const error = new GraphqlResponseError(
        {
          method: 'GET',
          url: '/foo/bar',
        },
        {},
        {
          data: {},
          errors: [
            {
              type: 'FORBIDDEN',
              message: 'Resource not accessible by integration',
              path: ['foo'],
              extensions: {},
              locations: [
                {
                  line: 123,
                  column: 456,
                },
              ],
            },
          ],
        }
      );
      expect(isOctokitGraphqlResponseError(error)).to.be.true;
    });

    it('should return false for invalid GraphqlResponseError', () => {
      const error = {
        request: {},
        headers: {},
        response: {},
        name: 'SomeOtherError',
        errors: [],
      };
      expect(isOctokitGraphqlResponseError(error)).to.be.false;
    });
  });
});
