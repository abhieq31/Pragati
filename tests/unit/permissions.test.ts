/**
 * Unit tests for the central capability matrix.
 *
 * The matrix is the single source of truth for "which role may do what" —
 * these tests pin the invariants the rest of the app builds on, so a future
 * edit that accidentally narrows or widens a role fails loudly here instead
 * of silently changing who can see or destroy what.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { can, rolesWith, toRole, CAPABILITIES, type Capability } from '../../src/lib/permissions';

describe('toRole — legacy coercion', () => {
  it('maps legacy stored roles onto current ones', () => {
    assert.equal(toRole('pm'), 'lead');
    assert.equal(toRole('employee'), 'contributor');
    assert.equal(toRole('admin'), 'admin');
    assert.equal(toRole('master_admin'), 'master_admin');
  });

  it('treats unknown/missing roles as contributor (least privilege)', () => {
    assert.equal(toRole(undefined), 'contributor');
    assert.equal(toRole(null), 'contributor');
    assert.equal(toRole('superuser'), 'contributor');
  });
});

describe('capability matrix invariants', () => {
  it('admin holds every capability except tenant provisioning', () => {
    for (const cap of Object.keys(CAPABILITIES) as Capability[]) {
      if (cap === 'tenants.manage') {
        assert.equal(can('admin', cap), false, `admin must NOT hold ${cap}`);
      } else {
        assert.equal(can('admin', cap), true, `admin must hold ${cap}`);
      }
    }
  });

  it('master_admin is a strict superset of admin', () => {
    for (const cap of Object.keys(CAPABILITIES) as Capability[]) {
      if (can('admin', cap)) {
        assert.equal(can('master_admin', cap), true, `master_admin must hold ${cap}`);
      }
    }
    assert.equal(can('master_admin', 'tenants.manage'), true);
  });

  it('contributors hold no workspace-level capability', () => {
    for (const cap of Object.keys(CAPABILITIES) as Capability[]) {
      assert.equal(can('contributor', cap), false, `contributor must NOT hold ${cap}`);
    }
  });

  it('leads manage teams and shared projects, but nothing admin-only', () => {
    assert.equal(can('lead', 'teams.manage'), true);
    assert.equal(can('lead', 'projects.create_shared'), true);
    assert.equal(can('lead', 'workspace.view_all'), false);
    assert.equal(can('lead', 'users.manage'), false);
    assert.equal(can('lead', 'audit.view'), false);
    assert.equal(can('lead', 'admin.console'), false);
    assert.equal(can('lead', 'tasks.delete_any'), false);
  });

  it('legacy stored roles resolve through the same matrix', () => {
    assert.equal(can('pm', 'teams.manage'), true);
    assert.equal(can('pm', 'users.manage'), false);
    assert.equal(can('employee', 'teams.manage'), false);
  });
});

describe('rolesWith — route-guard helper', () => {
  it('returns a mutable copy that matches the matrix', () => {
    const roles = rolesWith('users.manage');
    assert.deepEqual(roles, ['admin', 'master_admin']);
    roles.push('lead'); // mutating the copy…
    assert.deepEqual(rolesWith('users.manage'), ['admin', 'master_admin']); // …never the matrix
  });

  it('admin-only routes implicitly admit master_admin', () => {
    // requireRole(req, ...rolesWith(c)) — this is the property that fixes
    // master_admin being locked out of requireRole(req, 'admin') routes.
    for (const cap of ['users.bulk_manage', 'users.force_logout', 'audit.view'] as Capability[]) {
      assert.ok(rolesWith(cap).includes('master_admin'), `${cap} must admit master_admin`);
    }
  });
});
