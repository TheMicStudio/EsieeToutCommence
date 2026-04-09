'use server';

/**
 * AI Reviewer — Couche d'abstraction multi-provider pour la validation du planning
 * Utilise uniquement fetch (pas de SDK) → 0 dépendance supplémentaire
 * Providers : Claude, OpenAI GPT, Google Gemini, Mistral
 *
 * Ref: docs/features/09_module_gestion_planning — US24
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from '@/modules/auth/actions';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AIProviderId = 'claude' | 'openai' | 'gemini' | 'mistral';

export interface AIProviderInfo {
  id: AIProviderId;
  name: string;
  model: string;
  available: boolean; // true si la clé env est présente
}

export interface PlanningIssue {
  type: 'overload' | 'clustering' | 'gap' | 'imbalance' | 'soft_conflict';
  severity: 'warning' | 'error';
  entity: string;          // nom du prof ou de la classe concernée
  detail: string;          // description humaine
  week?: string;           // semaine concernée si applicable
}

export interface PlanningSuggestion {
  session_id?: string;
  action: 'move' | 'swap' | 'split' | 'add_teacher';
  description: string;
  proposed_slot?: string;  // ISO timestamp
}

export interface AIReviewResult {
  quality_score: number;           // 0-100
  summary: string;                 // résumé en 2-3 phrases
  issues: PlanningIssue[];
  suggestions: PlanningSuggestion[];
  conflict_resolutions: {
    subject_name: string;
    class_nom: string;
    resolution: string;
  }[];
  provider: AIProviderId;
  model: string;
}

// ─── Détection des providers disponibles ──────────────────────────────────────

export async function getAvailableProviders(): Promise<AIProviderInfo[]> {
  return [
    {
      id: 'claude',
      name: 'Claude (Anthropic)',
      model: 'claude-haiku-4-5-20251001',
      available: Boolean(process.env.ANTHROPIC_API_KEY),
    },
    {
      id: 'openai',
      name: 'GPT (OpenAI)',
      model: 'gpt-4o-mini',
      available: Boolean(process.env.OPENAI_API_KEY),
    },
    {
      id: 'gemini',
      name: 'Gemini (Google)',
      model: 'gemini-1.5-flash',
      available: Boolean(process.env.GEMINI_API_KEY),
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      model: 'mistral-small-latest',
      available: Boolean(process.env.MISTRAL_API_KEY),
    },
  ];
}

// ─── Prompt système ────────────────────────────────────────────────────────────

function buildReviewPrompt(planningData: string): string {
  return `Tu es un expert en organisation scolaire et gestion de planning éducatif.
Analyse ce planning scolaire et identifie les problèmes de qualité (contraintes SOFT).
Les contraintes HARD (conflits de salle, double-booking) ont déjà été vérifiées automatiquement.

Tu dois détecter :
- Surcharge professeur : plus de 3 cours par jour, ou plus de 20h par semaine
- Clustering : trop de matières différentes le même jour pour une classe
- Gap : une matière absente pendant plus de 3 semaines consécutives
- Déséquilibre : répartition inégale des cours sur l'année
- Soft conflicts : sessions back-to-back sans pause pour les élèves

Réponds UNIQUEMENT en JSON valide, sans markdown, avec cette structure exacte :
{
  "quality_score": <0-100>,
  "summary": "<résumé en 2-3 phrases>",
  "issues": [
    {
      "type": "<overload|clustering|gap|imbalance|soft_conflict>",
      "severity": "<warning|error>",
      "entity": "<nom prof ou classe>",
      "detail": "<description>",
      "week": "<YYYY-MM-DD ou null>"
    }
  ],
  "suggestions": [
    {
      "action": "<move|swap|split|add_teacher>",
      "description": "<description de l'action>",
      "proposed_slot": "<ISO timestamp ou null>"
    }
  ],
  "conflict_resolutions": [
    {
      "subject_name": "<matière>",
      "class_nom": "<classe>",
      "resolution": "<suggestion de résolution>"
    }
  ]
}

Planning à analyser :
${planningData}`;
}

// ─── Appels REST par provider ──────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callMistral(prompt: string): Promise<string> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`Mistral API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

async function callProvider(provider: AIProviderId, prompt: string): Promise<string> {
  switch (provider) {
    case 'claude':  return callClaude(prompt);
    case 'openai':  return callOpenAI(prompt);
    case 'gemini':  return callGemini(prompt);
    case 'mistral': return callMistral(prompt);
    default: throw new Error(`Provider inconnu : ${provider}`);
  }
}

function parseAIResponse(raw: string, provider: AIProviderId, model: string): AIReviewResult {
  // Nettoyer si l'IA a quand même mis du markdown
  const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  const parsed = JSON.parse(cleaned);
  return {
    quality_score: Math.max(0, Math.min(100, parsed.quality_score ?? 50)),
    summary: parsed.summary ?? '',
    issues: parsed.issues ?? [],
    suggestions: parsed.suggestions ?? [],
    conflict_resolutions: parsed.conflict_resolutions ?? [],
    provider,
    model,
  };
}

// ─── Sérialiser le planning pour l'IA ─────────────────────────────────────────

function serializePlanning(sessions: Record<string, unknown>[], conflicts: Record<string, unknown>[]): string {
  // Résumé compact pour ne pas dépasser le context window
  const byClass = new Map<string, { subject: string; count: number; hours: number }[]>();

  for (const s of sessions) {
    const cid = s.class_id as string;
    const subj = s.subject_name as string;
    if (!byClass.has(cid)) byClass.set(cid, []);
    const existing = byClass.get(cid)!.find((x) => x.subject === subj);
    const hours = (new Date(s.end_timestamp as string).getTime() - new Date(s.start_timestamp as string).getTime()) / 3600000;
    if (existing) { existing.count++; existing.hours += hours; }
    else byClass.get(cid)!.push({ subject: subj, count: 1, hours });
  }

  const lines: string[] = [];
  for (const [classId, subjects] of byClass.entries()) {
    const cls = sessions.find((s) => s.class_id === classId);
    lines.push(`Classe ${cls?.class_name ?? classId}:`);
    for (const subj of subjects) {
      lines.push(`  - ${subj.subject}: ${subj.count} séances, ${subj.hours.toFixed(1)}h`);
    }
  }

  if (conflicts.length > 0) {
    lines.push('\nConflits détectés:');
    for (const c of conflicts.slice(0, 20)) {
      lines.push(`  - ${c.class_nom} / ${c.subject_name}: ${c.reason}`);
    }
  }

  lines.push(`\nTotal sessions: ${sessions.length}`);
  lines.push(`Total conflits: ${conflicts.length}`);

  return lines.join('\n');
}

// ─── Action principale ─────────────────────────────────────────────────────────

export async function reviewPlanningWithAI(
  runId: string,
  provider: AIProviderId
): Promise<{ result?: AIReviewResult; error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') return { error: 'Accès refusé.' };

  const providers = await getAvailableProviders();
  const providerInfo = providers.find((p) => p.id === provider);
  if (!providerInfo?.available) return { error: `Provider "${provider}" non configuré. Vérifiez la clé API dans les variables d'environnement.` };

  const admin = createAdminClient();

  // Charger les sessions du run
  const { data: sessions } = await admin
    .from('scheduled_sessions')
    .select('class_id, teacher_id, subject_name, start_timestamp, end_timestamp, status, conflict_reason')
    .eq('run_id', runId);

  if (!sessions || sessions.length === 0) return { error: 'Aucune session dans ce run.' };

  const conflicts = sessions.filter((s) => s.status === 'CONFLICT_ERROR');
  const normalSessions = sessions.filter((s) => s.status !== 'CONFLICT_ERROR');

  const planningText = serializePlanning(
    normalSessions as Record<string, unknown>[],
    conflicts as Record<string, unknown>[]
  );

  const prompt = buildReviewPrompt(planningText);

  let rawResponse: string;
  try {
    rawResponse = await callProvider(provider, prompt);
  } catch (e) {
    return { error: `Erreur API ${providerInfo.name} : ${(e as Error).message}` };
  }

  let result: AIReviewResult;
  try {
    result = parseAIResponse(rawResponse, provider, providerInfo.model);
  } catch {
    return { error: 'La réponse de l\'IA n\'est pas du JSON valide. Réessayez.' };
  }

  // Sauvegarder la review dans le run
  await admin.from('planning_runs').update({
    ai_provider: provider,
    ai_review: result as unknown as Record<string, unknown>,
  }).eq('id', runId);

  return { result };
}
