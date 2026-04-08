export type DocPermissionLevel = 'read' | 'write' | 'admin';

export interface DocFolder {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocFile {
  id: string;
  folder_id: string;
  name: string;
  description?: string | null;
  tags: string[];
  mime_type?: string | null;
  size_bytes?: number | null;
  storage_path: string;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
}

export interface DocPermission {
  id: string;
  folder_id: string;
  role_target?: string | null;
  user_target?: string | null;
  level: DocPermissionLevel;
  granted_by: string;
  granted_at: string;
}

export interface DocShareLink {
  id: string;
  file_id?: string | null;
  folder_id?: string | null;
  token: string;
  label?: string | null;
  expires_at?: string | null;
  max_uses?: number | null;
  uses_count: number;
  created_by: string;
  created_at: string;
}

export interface DocBreadcrumb {
  id: string;
  name: string;
}

// Nœud de l'arborescence (enrichi côté client)
export interface FolderNode extends DocFolder {
  children: FolderNode[];
}

// Résultat de recherche unifié
export interface DocSearchResult {
  type: 'folder' | 'file';
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  folder_id?: string;
  mime_type?: string | null;
  uploaded_at?: string;
  created_at?: string;
}

// Utilisateur simplifié pour le sélecteur de permissions
export interface DocUser {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface ActionState {
  error?: string;
  success?: boolean;
  data?: unknown;
}
