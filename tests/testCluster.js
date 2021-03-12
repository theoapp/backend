// Copyright 2019 AuthKeys srl
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import dotenv from 'dotenv';
import { describe, it } from 'mocha';
import assert from 'assert';
import fetch from 'node-fetch';

const baseURLs = [];
dotenv.config();

for (const name in process.env) {
  const value = process.env[name];
  const match = name.match(/^THEO_URL_(.*)$/);
  if (match) {
    baseURLs.push(value);
  }
}

const tokensOne = {
  tokens: {
    admins: [{ token: 'xYxYxY', assignee: 'admin' }],
    clients: ['ababababab', 'cdcdcdcdcdcd']
  }
};

const tokensTwo = {
  tokens: {
    admins: [{ token: 'wZwZwZwZwZ', assignee: 'admin' }],
    clients: ['efefefefef', 'ghghghghghgh']
  }
};

describe('Core', function () {
  describe('Check environment', function () {
    assert.strictEqual(baseURLs.length >= 2, true);
  });
  describe('Send tokens', function () {
    it('should return 204 from ' + baseURLs[0], async function () {
      const res = await fetch(baseURLs[0] + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.CORE_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(tokensOne)
      });
      assert.strictEqual(res.status, 204);
    });
  });
  describe('Check tokens', function () {
    for (let i = 0; i < baseURLs.length; i++) {
      const base_url = baseURLs[i];
      it('should return 401 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/tokens', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.admins[0].token,
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify(tokensOne)
        });
        assert.strictEqual(res.status, 401);
      });

      it('should return 200 for server ' + base_url, function (done) {
        setTimeout(async () => {
          const res = await fetch(base_url + '/accounts', {
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + tokensOne.tokens.admins[0].token
            }
          });
          try {
            assert.strictEqual(res.status, 200);
            done();
          } catch (e) {
            done(e);
          }
        }, 200);
      });

      it('should return 401 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/accounts', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.clients[0]
          }
        });
        assert.strictEqual(res.status, 401);
      });

      it('should return 200 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.admins[0].token
          }
        });
        assert.strictEqual(res.status, 200);
      });

      it('should return 200 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.clients[0]
          }
        });
        assert.strictEqual(res.status, 200);
      });

      it('should return 200 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.clients[1]
          }
        });
        assert.strictEqual(res.status, 200);
      });
    }
  });

  describe('Resend tokens', function () {
    it('should return 204', async function () {
      const res = await fetch(baseURLs[1] + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.CORE_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(tokensTwo)
      });
      assert.strictEqual(res.status, 204);
    });
  });
  describe('Recheck tokens', function () {
    for (let i = 0; i < baseURLs.length; i++) {
      const base_url = baseURLs[i];
      it('should return 401 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/tokens', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.admins[0].token,
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify(tokensOne)
        });
        assert.strictEqual(res.status, 401);
      });

      it('should return 401 for server ' + base_url, function (done) {
        setTimeout(async () => {
          const res = await fetch(base_url + '/accounts', {
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + tokensOne.tokens.admins[0].token
            }
          });
          try {
            assert.strictEqual(res.status, 401);
            done();
          } catch (e) {
            done(e);
          }
        }, 200);
      });

      it('should return 401 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/accounts', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensTwo.tokens.clients[0]
          }
        });
        assert.strictEqual(res.status, 401);
      });

      it('should return 401 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.admins[0].token
          }
        });
        assert.strictEqual(res.status, 401);
      });

      it('should return 200 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensTwo.tokens.admins[0].token
          }
        });
        assert.strictEqual(res.status, 200);
      });

      it('should return 200 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensTwo.tokens.clients[0]
          }
        });
        assert.strictEqual(res.status, 200);
      });

      it('should return 200 for server ' + base_url, async function () {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensTwo.tokens.clients[1]
          }
        });
        assert.strictEqual(res.status, 200);
      });
    }
  });
});
