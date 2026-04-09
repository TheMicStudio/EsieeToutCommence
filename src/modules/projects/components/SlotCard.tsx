'use client';

import {
  Brain, GitBranch, Cloud, Palette, Clock, MapPin, Video, Users, Monitor,
  BadgeCheck, Info, BookmarkPlus, AlertTriangle, FileText, Code, Database,
  Cpu, Globe, Shield, Zap, Calendar, BookOpen, FlaskConical, BarChart2,
  Network, Server, Layers, Pencil, Settings, Check, X,
  type LucideIcon,
} from 'lucide-react';

/* ── Icon registry ─────────────────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  'brain':         Brain,
  'git-branch':    GitBranch,
  'cloud':         Cloud,
  'palette':       Palette,
  'clock':         Clock,
  'map-pin':       MapPin,
  'video':         Video,
  'users':         Users,
  'monitor':       Monitor,
  'badge-check':   BadgeCheck,
  'info':          Info,
  'bookmark-plus': BookmarkPlus,
  'alert-triangle': AlertTriangle,
  'file-text':     FileText,
  'code':          Code,
  'database':      Database,
  'cpu':           Cpu,
  'globe':         Globe,
  'shield':        Shield,
  'zap':           Zap,
  'calendar':      Calendar,
  'book-open':     BookOpen,
  'flask-conical': FlaskConical,
  'bar-chart-2':   BarChart2,
  'network':       Network,
  'server':        Server,
  'layers':        Layers,
  'pencil':        Pencil,
  'settings':      Settings,
  'check':         Check,
  'x':             X,
};

function resolveIcon(name: string): LucideIcon {
  const key = name.replace(/^lucide:/, '');
  return ICON_MAP[key] ?? Calendar;
}

/* ── Icon background colours ───────────────────────────────────────── */
const ICON_BG: Record<string, string> = {
  slate:   'bg-slate-900 text-white',
  emerald: 'bg-emerald-600 text-white',
  cyan:    'bg-cyan-600 text-white',
  amber:   'bg-amber-500 text-white',
};

/* ── Badge styles ──────────────────────────────────────────────────── */
const BADGE_STYLES: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cyan:    'border-cyan-200 bg-cyan-50 text-cyan-700',
  amber:   'border-amber-200 bg-amber-50 text-amber-700',
  slate:   'border-slate-200 bg-white text-slate-600',
};

/* ── Props ─────────────────────────────────────────────────────────── */
export interface SlotCardProps {
  icon: string;
  iconBg?: 'slate' | 'emerald' | 'cyan' | 'amber';
  title: string;
  badge: {
    label: string;
    type: 'emerald' | 'cyan' | 'amber' | 'slate';
    hasIcon?: boolean;
  };
  description: string;
  metadata: Array<{ icon: string; text: string }>;
  showDetailsBtn?: boolean;
  onReserve?: () => void;
  onDetails?: () => void;
  buttonVariant?: 'primary' | 'secondary';
  reserveLabel?: string;
  reserveDisabled?: boolean;
  /** Replaces the default reserve button with a custom element */
  actions?: React.ReactNode;
}

export function SlotCard({
  icon,
  iconBg = 'slate',
  title,
  badge,
  description,
  metadata,
  showDetailsBtn = false,
  onReserve,
  onDetails,
  buttonVariant = 'primary',
  reserveLabel = 'Réserver',
  reserveDisabled = false,
  actions,
}: SlotCardProps) {
  const MainIcon = resolveIcon(icon);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        {/* Left section */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className={[
            'grid h-12 w-12 place-items-center rounded-2xl shrink-0',
            ICON_BG[iconBg] ?? ICON_BG.slate,
          ].join(' ')}>
            <MainIcon size={20} />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Title + badge */}
            <div className="flex flex-wrap items-center gap-2">
              <h4
                className="text-[16px] font-semibold tracking-tight text-slate-900"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              >
                {title}
              </h4>
              <span className={[
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold',
                BADGE_STYLES[badge.type],
              ].join(' ')}>
                {badge.type === 'cyan' && badge.hasIcon && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                )}
                {badge.type === 'amber' && badge.hasIcon && (
                  <AlertTriangle size={12} />
                )}
                {badge.label}
              </span>
            </div>

            {/* Description */}
            <p className="mt-1 text-[13px] font-medium text-slate-600">
              {description}
            </p>

            {/* Metadata row */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-slate-500">
              {metadata.map((item) => {
                const MetaIcon = resolveIcon(item.icon);
                return (
                  <span key={`${item.icon}-${item.text}`} className="inline-flex items-center gap-1.5">
                    <MetaIcon size={13} className="shrink-0" />
                    {item.text}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 shrink-0 md:mt-1">
          {actions ?? (
            <>
              {showDetailsBtn && (
                <button
                  type="button"
                  onClick={onDetails}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <Info size={15} className="text-slate-700" />
                  Détails
                </button>
              )}
              {onReserve && (
                <button
                  type="button"
                  onClick={onReserve}
                  disabled={reserveDisabled}
                  className={[
                    'inline-flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[13px] font-semibold text-white transition-colors disabled:opacity-50',
                    buttonVariant === 'primary'
                      ? 'bg-[#0471a6] hover:bg-[#0471a6]/90'
                      : 'bg-slate-900 hover:bg-slate-800',
                  ].join(' ')}
                >
                  <BookmarkPlus size={15} />
                  {reserveLabel}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
