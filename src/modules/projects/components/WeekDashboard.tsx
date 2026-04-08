'use client';

import { useState } from 'react';
import {
  Users, MessageSquare, BookOpen, CalendarClock, ClipboardList,
  Plus, Star, ArrowRight, ChevronLeft, GitBranch, Presentation, Lock, UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { GroupWorkspaceTabs } from './GroupWorkspaceTabs';
import { GroupChat } from './GroupChat';
import { GroupWhiteboardView } from './GroupWhiteboardView';
import { WeekCourseMaterialsPanel } from './WeekCourseMaterialsPanel';
import { SoutenanceGrid } from './SoutenanceGrid';
import { CreateSoutenanceSlotsForm } from './CreateSoutenanceSlotsForm';
import { RetroBoard } from './RetroBoard';
import { JoinGroupButton } from './JoinGroupButton';
import { SubmitLinksForm } from './SubmitLinksForm';
import { GradeGroupForm } from './GradeGroupForm';
import type {
  ProjectGroup, GroupMessage, GroupWhiteboard,
  WeekCourseMaterial, SoutenanceSlot, RetroBoard as RetroBoardType,
  RetroPostit,
} from '../types';

interface WeekDashboardProps {
  weekId: string;
  week: { title: string; start_date: string; end_date: string };
  groups: ProjectGroup[];
  myGroup: ProjectGroup | null;
  messages: GroupMessage[];
  whiteboard: GroupWhiteboard | null;
  materials: WeekCourseMaterial[];
  slots: SoutenanceSlot[];
  retroBoard: RetroBoardType | null;
  retroPostits: RetroPostit[];
  currentUserId: string;
  currentUserName: string;
  isProf: boolean;
}

type TabId = 'groupes' | 'espace' | 'supports' | 'creneaux' | 'retro';

function getInitials(prenom?: string, nom?: string) {
  return `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?';
}

const AVATAR_COLORS = [
  'bg-[#89aae6]/20 text-[#3685b5]',
  'bg-[#ac80a0]/20 text-[#ac80a0]',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-violet-100 text-violet-600',
  'bg-rose-100 text-rose-600',
];

export function WeekDashboard({
  weekId, week, groups, myGroup, messages, whiteboard,
  materials, slots, retroBoard, retroPostits,
  currentUserId, currentUserName, isProf,
}: WeekDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('groupes');

  const start = new Date(week.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const end = new Date(week.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const allTabs: { id: TabId; label: string; icon: React.ElementType; badge?: number; hidden: boolean }[] = [
    { id: 'groupes',  label: 'Groupes',    icon: Users,         badge: groups.length,                hidden: false },
    { id: 'espace',   label: 'Mon espace', icon: MessageSquare, badge: undefined,                    hidden: isProf || !myGroup },
    { id: 'supports', label: 'Supports',   icon: BookOpen,      badge: materials.length || undefined, hidden: false },
    { id: 'creneaux', label: 'Créneaux',   icon: CalendarClock, badge: slots.length || undefined,    hidden: false },
    { id: 'retro',    label: 'Rétro',      icon: ClipboardList, badge: undefined,                    hidden: false },
  ];
  const tabs = allTabs.filter((t) => !t.hidden);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/projets"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors mt-0.5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#061826]">{week.title}</h1>
          <p className="mt-0.5 text-sm text-slate-400">{start} → {end}</p>
        </div>
        <div className="hidden sm:flex items-center gap-5 shrink-0">
          <div className="text-center">
            <p className="text-xl font-bold text-[#061826]">{groups.length}</p>
            <p className="text-[11px] text-slate-400">groupes</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-xl font-bold text-[#061826]">{slots.length}</p>
            <p className="text-[11px] text-slate-400">créneaux</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-xl font-bold text-[#061826]">{materials.length}</p>
            <p className="text-[11px] text-slate-400">supports</p>
          </div>
        </div>
      </div>

      {/* ── Bandeau mon groupe ───────────────────────────────── */}
      {!isProf && myGroup && (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#0471a6]/5 to-[#89aae6]/5 border border-[#0471a6]/15 px-5 py-3.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-[#061826]">
            Vous êtes dans <span className="font-bold text-[#0471a6]">{myGroup.group_name}</span>
          </p>
          {myGroup.note !== undefined && myGroup.note !== null && (
            <div className="flex items-center gap-1.5 rounded-xl bg-[#0471a6]/10 px-3 py-1">
              <Star className="h-3.5 w-3.5 text-[#0471a6]" />
              <span className="text-sm font-bold text-[#0471a6]">{myGroup.note}/20</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('espace')}
            className="ml-auto text-xs font-semibold text-[#0471a6] hover:underline"
          >
            Ouvrir mon espace →
          </button>
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-[#0471a6] text-[#0471a6]'
                  : 'border-transparent text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.badge !== undefined && (
                <span className={[
                  'rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                  activeTab === tab.id ? 'bg-[#0471a6]/10 text-[#0471a6]' : 'bg-slate-100 text-slate-400',
                ].join(' ')}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Onglet Groupes ──────────────────────────────────── */}
      {activeTab === 'groupes' && (
        <div className="space-y-4">
          {!isProf && !myGroup && (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#89aae6]/50 bg-[#89aae6]/5 px-4 py-3">
              <Plus className="h-4 w-4 text-[#0471a6] shrink-0" />
              <p className="text-sm text-slate-600 flex-1">Vous n&apos;êtes dans aucun groupe pour cette semaine.</p>
              <Link
                href={`/dashboard/projets/${weekId}/groupes`}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#0471a6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
              >
                Rejoindre / créer <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {groups.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-400">Aucun groupe créé pour cette semaine.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => {
                const members = group.members ?? [];
                const isMember = members.some((m) => m.student_id === currentUserId);
                const isMyGrp = myGroup?.id === group.id;
                const spots = group.capacite_max - members.length;
                const isFull = spots <= 0;

                return (
                  <div
                    key={group.id}
                    className={[
                      'rounded-2xl border overflow-hidden',
                      isMyGrp
                        ? 'border-[#0471a6]/20 bg-gradient-to-b from-[#0471a6]/3 to-white shadow-sm'
                        : 'border-slate-200/70 bg-white shadow-sm',
                    ].join(' ')}
                  >
                    {/* Card header */}
                    <div className={['flex items-center justify-between gap-3 px-4 py-3.5 border-b', isMyGrp ? 'border-[#0471a6]/10 bg-[#0471a6]/5' : 'border-slate-100 bg-slate-50/60'].join(' ')}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isMyGrp && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />}
                          <p className="font-semibold text-[#061826] truncate">{group.group_name}</p>
                        </div>
                        <p className="mt-0.5 text-[11px]">
                          {isFull
                            ? <span className="text-red-500 font-medium inline-flex items-center gap-1"><Lock className="h-3 w-3" />Complet</span>
                            : <span className="text-emerald-600 font-medium">{spots} place{spots > 1 ? 's' : ''} libre{spots > 1 ? 's' : ''}</span>
                          }
                        </p>
                      </div>
                      {group.note !== undefined && group.note !== null && (
                        <div className="flex items-center gap-1 rounded-lg bg-[#0471a6]/10 px-2.5 py-1 shrink-0">
                          <Star className="h-3 w-3 text-[#0471a6]" />
                          <span className="text-xs font-bold text-[#0471a6]">{group.note}/20</span>
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-4 space-y-3">
                      {/* Avatars membres */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {members.map((m, i) => (
                          <div
                            key={m.student_id}
                            title={`${m.prenom} ${m.nom}`}
                            className={['flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold', AVATAR_COLORS[i % AVATAR_COLORS.length]].join(' ')}
                          >
                            {getInitials(m.prenom, m.nom)}
                          </div>
                        ))}
                        {Array.from({ length: Math.min(spots > 0 ? spots : 0, 3) }).map((_, i) => (
                          <div key={`e-${i}`} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-slate-200">
                            <UserPlus className="h-3 w-3 text-slate-300" />
                          </div>
                        ))}
                        <span className="ml-0.5 text-xs text-slate-400">{members.length}/{group.capacite_max}</span>
                      </div>

                      {/* Livrables */}
                      {(group.repo_url || group.slides_url) && (
                        <div className="flex gap-2">
                          {group.repo_url && (
                            <a href={group.repo_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                              <GitBranch className="h-3 w-3" />GitHub
                            </a>
                          )}
                          {group.slides_url && (
                            <a href={group.slides_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                              <Presentation className="h-3 w-3" />Slides
                            </a>
                          )}
                        </div>
                      )}

                      {/* Feedback prof */}
                      {group.feedback_prof && (
                        <p className="text-xs italic text-slate-500 border-l-2 border-slate-200 pl-3">
                          &ldquo;{group.feedback_prof}&rdquo;
                        </p>
                      )}

                      {/* Actions */}
                      {!isProf && !myGroup && (
                        <JoinGroupButton groupId={group.id} weekId={weekId} isMember={isMember} isFull={isFull} />
                      )}
                      {isMember && !isProf && (
                        <SubmitLinksForm groupId={group.id} initialRepo={group.repo_url} initialSlides={group.slides_url} />
                      )}
                      {isProf && (
                        <GradeGroupForm groupId={group.id} initialNote={group.note} initialFeedback={group.feedback_prof} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Mon espace ───────────────────────────────── */}
      {activeTab === 'espace' && myGroup && (
        <GroupWorkspaceTabs
          chatContent={
            <GroupChat
              groupId={myGroup.id}
              initialMessages={messages}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              memberNames={Object.fromEntries(
                (myGroup.members ?? []).map((m) => [m.student_id, `${m.prenom} ${m.nom}`])
              )}
            />
          }
          whiteboardContent={
            <GroupWhiteboardView
              groupId={myGroup.id}
              initialData={whiteboard?.data ?? null}
            />
          }
        />
      )}

      {/* ── Onglet Supports ─────────────────────────────────── */}
      {activeTab === 'supports' && (
        <WeekCourseMaterialsPanel weekId={weekId} materials={materials} isProf={isProf} />
      )}

      {/* ── Onglet Créneaux ─────────────────────────────────── */}
      {activeTab === 'creneaux' && (
        <div className="space-y-5">
          {isProf && (
            <CreateSoutenanceSlotsForm weekId={weekId} groupCount={groups.length} hasSlots={slots.length > 0} />
          )}
          <SoutenanceGrid slots={slots} weekId={weekId} myGroupId={myGroup?.id} />
        </div>
      )}

      {/* ── Onglet Rétro ────────────────────────────────────── */}
      {activeTab === 'retro' && (
        <div>
          {retroBoard ? (
            <RetroBoard
              board={retroBoard}
              initialPostits={retroPostits}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isProf={isProf}
            />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-400">
                {isProf ? 'Le tableau de rétro sera créé automatiquement à la première ouverture.' : 'Le tableau de rétro n\'est pas encore disponible.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
