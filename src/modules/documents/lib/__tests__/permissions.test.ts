import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canWrite, canAdmin, resolveFolderPermission } from '../permissions';
import type { DocPermissionLevel } from '../../types';

// ── canWrite() ────────────────────────────────────────────────────────────────

describe('canWrite()', () => {
  it('renvoie true pour "write"', () => {
    expect(canWrite('write')).toBe(true);
  });

  it('renvoie true pour "admin" (admin implique write)', () => {
    expect(canWrite('admin')).toBe(true);
  });

  it('renvoie false pour "read"', () => {
    expect(canWrite('read')).toBe(false);
  });
});

// ── canAdmin() ────────────────────────────────────────────────────────────────

describe('canAdmin()', () => {
  it('renvoie true uniquement pour "admin"', () => {
    expect(canAdmin('admin')).toBe(true);
  });

  it('renvoie false pour "write"', () => {
    expect(canAdmin('write')).toBe(false);
  });

  it('renvoie false pour "read"', () => {
    expect(canAdmin('read')).toBe(false);
  });
});

// ── resolveFolderPermission() ─────────────────────────────────────────────────

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';

function makeAdminMock(
  folders: Array<{ id: string; parent_id: string | null }>,
  perms: Array<{ folder_id: string; user_target?: string; role_target?: string; level: DocPermissionLevel }>,
) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'doc_folders') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((_col: string, id: string) => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: folders.find((f) => f.id === id) ?? null,
            }),
          })),
        };
      }
      if (table === 'doc_permissions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((_col: string, folderId: string) => ({
            // Résolution Promise directe (chaîne terminée par await sur le builder)
            then: (resolve: (v: { data: typeof perms }) => void) =>
              resolve({ data: perms.filter((p) => p.folder_id === folderId) }),
          })),
        };
      }
      return {};
    }),
  };
}

describe('resolveFolderPermission()', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renvoie "admin" par défaut si aucune règle ne correspond', async () => {
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeAdminMock(
        [{ id: 'folder-1', parent_id: null }],
        [], // aucune règle
      ),
    );

    const level = await resolveFolderPermission('user-x', 'eleve', 'folder-1');
    expect(level).toBe('admin');
  });

  it('priorité permission individuelle > permission par rôle', async () => {
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeAdminMock(
        [{ id: 'folder-1', parent_id: null }],
        [
          { folder_id: 'folder-1', role_target: 'eleve',  level: 'read'  },
          { folder_id: 'folder-1', user_target: 'user-x', level: 'write' },
        ],
      ),
    );

    const level = await resolveFolderPermission('user-x', 'eleve', 'folder-1');
    expect(level).toBe('write');
  });

  it('applique la permission par rôle si aucune règle individuelle', async () => {
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeAdminMock(
        [{ id: 'folder-1', parent_id: null }],
        [{ folder_id: 'folder-1', role_target: 'eleve', level: 'read' }],
      ),
    );

    const level = await resolveFolderPermission('user-x', 'eleve', 'folder-1');
    expect(level).toBe('read');
  });
});
