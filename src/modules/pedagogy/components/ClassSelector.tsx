import Link from 'next/link';
import type { Class } from '../types';

interface ClassSelectorProps {
  classes: Class[];
  activeClassId: string;
  basePath: string;
}

export function ClassSelector({ classes, activeClassId, basePath }: ClassSelectorProps) {
  if (classes.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {classes.map((c) => (
        <Link
          key={c.id}
          href={`${basePath}?classe=${c.id}`}
          className={[
            'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
            c.id === activeClassId
              ? 'bg-[#0471a6] text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          ].join(' ')}
        >
          {c.nom}{' '}
          <span className={['text-xs', c.id === activeClassId ? 'opacity-70' : 'text-slate-400'].join(' ')}>
            Promo {c.annee}
          </span>
        </Link>
      ))}
    </div>
  );
}
