'use client';

import { useState } from 'react';
import {
  Users, MessageSquare, BookOpen, CalendarClock, ClipboardList,
  Plus, Star, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { GroupCard } from './GroupCard';
import { GroupWorkspaceTabs } from './GroupWorkspaceTabs';
import { GroupChat } from './GroupChat';
import { GroupWhiteboardView } from './GroupWhiteboardView';
import { WeekCourseMaterialsPanel } from './WeekCourseMaterialsPanel';
import { SoutenanceGrid } from './SoutenanceGrid';
import { CreateSoutenanceSlotsForm } from './CreateSoutenanceSlotsForm';
import { RetroBoard } from './RetroBoard';
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

export function WeekDashboard({
  weekId, week, groups, myGroup, messages, whiteboard,
  materials, slots, retroBoard, retroPostits,
  currentUserId, currentUserName, isProf,
}: WeekDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('groupes');

  const start = new Date(week.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const end = new Date(week.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const allTabs = [
    { id: 'groupes'  as TabId, label: 'Groupes',   icon: Users,         badge: groups.length,               hidden: false },
    { id: 'espace'   as TabId, label: 'Mon espace', icon: MessageSquare, badge: undefined,                   hidden: isProf || !myGroup },
    { id: 'supports' as TabId, label: 'Supports',   icon: BookOpen,      badge: materials.length || undefined, hidden: false },
    { id: 'creneaux' as TabId, label: 'Créneaux',   icon: CalendarClock, badge: slots.length || undefined,   hidden: false },
    { id: 'retro'    as TabId, label: 'Rétro',      icon: ClipboardList, badge: undefined,                   hidden: false },
  ];
  const tabs = allTabs.filter((t) => !t.hidden);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">{week.title}</h1>
          <p className="text-sm text-slate-500">{start} → {end}</p>
        </div>
        {/* Stats rapides */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-center">
            <p className="text-xl font-bold text-[#0471a6]">{groups.length}</p>
            <p className="text-[11px] text-slate-400">groupes</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-xl font-bold text-[#0471a6]">{slots.length}</p>
            <p className="text-[11px] text-slate-400">créneaux</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-xl font-bold text-[#0471a6]">{materials.length}</p>
            <p className="text-[11px] text-slate-400">supports</p>
          </div>
        </div>
      </div>

      {/* ── Bandeau mon groupe (élève membre) ────────────────── */}
      {!isProf && myGroup && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#89aae6]/10 border border-[#89aae6]/30 px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-[#061826]">
            Vous êtes dans <span className="font-semibold text-[#0471a6]">{myGroup.group_name}</span>
          </p>
          {myGroup.note !== undefined && myGroup.note !== null && (
            <div className="ml-auto flex items-center gap-1.5 rounded-xl bg-[#0471a6]/10 px-3 py-1">
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
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-0">
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
        <div className="space-y-5">
          {!isProf && !myGroup && (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#89aae6]/50 bg-[#89aae6]/5 px-4 py-3">
              <Plus className="h-4 w-4 text-[#0471a6] shrink-0" />
              <p className="text-sm text-slate-600 flex-1">Vous n&apos;êtes dans aucun groupe pour cette semaine.</p>
              <Link
                href={`/dashboard/projets/${weekId}/groupes`}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#0471a6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  weekId={weekId}
                  currentUserId={currentUserId}
                  isProf={isProf}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Mon espace (chat + tableau) ──────────────── */}
      {activeTab === 'espace' && myGroup && (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
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
        </div>
      )}

      {/* ── Onglet Supports ─────────────────────────────────── */}
      {activeTab === 'supports' && (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <WeekCourseMaterialsPanel weekId={weekId} materials={materials} isProf={isProf} />
        </div>
      )}

      {/* ── Onglet Créneaux ─────────────────────────────────── */}
      {activeTab === 'creneaux' && (
        <div className="space-y-5">
          {isProf && (
            <CreateSoutenanceSlotsForm
              weekId={weekId}
              groupCount={groups.length}
              hasSlots={slots.length > 0}
            />
          )}
          <SoutenanceGrid
            slots={slots}
            weekId={weekId}
            myGroupId={myGroup?.id}
          />
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
          ) : isProf ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">Le tableau de rétro n&apos;existe pas encore.</p>
              <p className="text-xs text-slate-400">Il sera créé automatiquement à la première ouverture.</p>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-400">Le tableau de rétro n&apos;est pas encore disponible.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
