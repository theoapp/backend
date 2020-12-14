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

import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import GroupManager from '../lib/managers/GroupManager';
import {
  adminAddGroupPermission,
  adminCreateGroup,
  adminCreateGroupAccount,
  adminCreateGroupAccounts,
  adminDeleteGroup,
  adminDeleteGroupAccount,
  adminDeleteGroupPermission,
  adminEditGroup,
  adminGetGroup,
  adminUpdateGroupPermission
} from '../lib/helpers/AdminHelper';

export default function handleGroups(express) {
  const router = express.Router();
  router.get('/', requireAdminAuthMiddleware, async (req, res, next) => {
    const gm = new GroupManager(req.db);
    try {
      const { limit, offset, order_by, sort, name } = req.query;
      let ret;
      if (name) {
        ret = await gm.search(name, Number(limit), Number(offset), order_by, sort);
      } else {
        ret = await gm.getAll(Number(limit), Number(offset), false, order_by, sort);
      }
      res.json(ret);
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  router.post('/', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminCreateGroup(req.db, req.body, req);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.get('/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminGetGroup(req.db, req.params.id);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.post('/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    res.set('X-Sunset', '1.0.0');
    try {
      const { id, ids } = req.body;
      if (id && ids) {
        res.status(400);
        res.json({ status: 400, reason: 'Only one between id and ids must be used' });
        return;
      }
      if (!id && !ids) {
        res.status(400);
        res.json({ status: 400, reason: 'One between id and ids must be used' });
        return;
      }
      let done;
      if (id) {
        done = await adminCreateGroupAccount(req.db, req.params.id, id, req);
        res.status(204);
        res.end();
      } else if (ids) {
        done = await adminCreateGroupAccounts(req.db, req.params.id, ids, req);
        res.status(200);
        res.json(done);
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unknown error' });
      }
    } catch (err) {
      console.error(err);
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.put('/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    const { active } = req.body;
    try {
      const done = await adminEditGroup(req.db, req.params.id, active, req);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unknown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.delete('/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteGroup(req.db, req.params.id, req);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unknown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.post('/:id/account', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const { id } = req.body;
      if (!id) {
        res.status(400);
        res.json({ status: 400, reason: 'Invalid payload' });
        return;
      }
      await adminCreateGroupAccount(req.db, req.params.id, id, req);
      res.status(204);
      res.end();
    } catch (err) {
      console.error(err);
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.post('/:id/accounts', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const { ids } = req.body;
      if (!ids) {
        res.status(400);
        res.json({ status: 400, reason: 'Invalid payload' });
        return;
      }
      const done = await adminCreateGroupAccounts(req.db, req.params.id, ids, req);
      res.status(200);
      res.json(done);
    } catch (err) {
      console.error(err);
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.delete('/:id/:account_id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteGroupAccount(req.db, req.params.id, req.params.account_id, req);
      if (done > 0) {
        res.status(204);
        res.end();
      } else {
        res.status(404);
        res.json({ status: 404, reason: 'Account was not in this group' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.post('/:id/permissions', requireAdminAuthMiddleware, async (req, res) => {
    const { user, host, ssh_options } = req.body;
    try {
      const ret = await adminAddGroupPermission(req.db, req.params.id, user, host, ssh_options, req);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.delete('/:id/permissions/:permission_id', requireAdminAuthMiddleware, async (req, res) => {
    try {
      const done = await adminDeleteGroupPermission(req.db, req.params.id, Number(req.params.permission_id), req);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unknown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.put('/:id/permissions/:permission_id', requireAdminAuthMiddleware, async (req, res) => {
    try {
      const done = await adminUpdateGroupPermission(
        req.db,
        req.params.id,
        Number(req.params.permission_id),
        req.body.ssh_options,
        req
      );
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unknown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
  return router;
}
