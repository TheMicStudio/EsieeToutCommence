export type PostCategory = 'annonce' | 'actu' | 'evenement';

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  annonce:   'Annonce',
  actu:      'Actualité',
  evenement: 'Événement',
};

export const CATEGORY_COLORS: Record<PostCategory, string> = {
  annonce:   'bg-[#89aae6]/20 text-[#0471a6]',
  actu:      'bg-amber-100 text-amber-600',
  evenement: 'bg-emerald-100 text-emerald-600',
};

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  category: PostCategory;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}
