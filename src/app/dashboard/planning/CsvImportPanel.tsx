'use client';

import { useRef, useState, useTransition } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Users,
  GraduationCap,
  Briefcase,
  Eye,
  Loader2,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  parseCsvContent,
  parseXlsxToCSV,
  importCsvStudents,
  type ImportPreview,
  type ImportResult,
} from '@/modules/admin/planning-actions';

const inputCls =
  'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

// ─── Modal de confirmation ────────────────────────────────────────────────────

function WarningModal({
  preview,
  onConfirm,
  onCancel,
  loading,
}: {
  preview: ImportPreview;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200/70 overflow-hidden">
        {/* En-tête rouge */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-900 text-lg leading-tight">
              Confirmer l&apos;importation
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Cette action va créer des comptes utilisateurs réels. Lisez attentivement.
            </p>
          </div>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 space-y-4">

          {/* Résumé */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center">
              <p className="text-2xl font-bold text-[#0471a6]">{preview.total}</p>
              <p className="text-xs text-slate-500 mt-0.5">étudiants</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{preview.tp_count}</p>
              <p className="text-xs text-emerald-600 mt-0.5">temps plein</p>
            </div>
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{preview.alt_count}</p>
              <p className="text-xs text-blue-600 mt-0.5">alternants</p>
            </div>
          </div>

          {/* Classe */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Classe créée ou mise à jour</p>
              <p className="text-sm font-semibold text-[#061826]">{preview.classe_nom}</p>
            </div>
          </div>

          {/* Avertissements */}
          <div className="space-y-2">
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Mot de passe temporaire :</strong>{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">
                  Prenom.NOM2025
                </code>{' '}
                — à communiquer aux étudiants. Ils devront le changer.
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Les emails déjà enregistrés seront <strong>ignorés</strong> sans erreur.
                Les nouveaux comptes sont créés avec la confirmation email automatique.
              </p>
            </div>
          </div>

          {/* Erreurs de parsing si présentes */}
          {preview.errors.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold text-rose-700 mb-1">
                {preview.errors.length} ligne(s) ignorée(s) lors du parsing :
              </p>
              <ul className="space-y-0.5 max-h-20 overflow-y-auto">
                {preview.errors.map((e, i) => (
                  <li key={i} className="text-xs text-rose-600">• {e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Checkbox confirmation */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#0471a6]"
            />
            <span className="text-sm text-slate-700">
              J&apos;ai vérifié les données et je confirme la création de{' '}
              <strong>{preview.total} compte(s)</strong> étudiant(s).
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/60">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Importation...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Confirmer l&apos;import</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Résultat d'import ────────────────────────────────────────────────────────

function ImportResultView({
  result,
  onReset,
}: {
  result: ImportResult;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-3xl font-bold text-emerald-700">{result.created}</p>
          <p className="text-xs text-emerald-600 mt-1">compte(s) créé(s)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-3xl font-bold text-slate-500">{result.skipped}</p>
          <p className="text-xs text-slate-400 mt-1">déjà existant(s)</p>
        </div>
        <div className={[
          'rounded-2xl border p-4 text-center',
          result.errors.length > 0
            ? 'border-rose-200 bg-rose-50'
            : 'border-slate-200 bg-slate-50',
        ].join(' ')}>
          <p className={[
            'text-3xl font-bold',
            result.errors.length > 0 ? 'text-rose-600' : 'text-slate-400',
          ].join(' ')}>
            {result.errors.length}
          </p>
          <p className={[
            'text-xs mt-1',
            result.errors.length > 0 ? 'text-rose-500' : 'text-slate-400',
          ].join(' ')}>
            erreur(s)
          </p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700 mb-2">Erreurs rencontrées :</p>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {result.errors.map((e, i) => (
              <li key={i} className="text-xs text-rose-600">• {e}</li>
            ))}
          </ul>
        </div>
      )}

      {result.created > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Rappel : le mot de passe temporaire des nouveaux comptes est{' '}
            <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">
              Prenom.NOM2025
            </code>
            . Communiquez-le aux étudiants.
          </p>
        </div>
      )}

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
      >
        <Upload className="h-4 w-4" />
        Nouvel import
      </button>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function CsvImportPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isParsing, startParsing] = useTransition();
  const [isImporting, startImporting] = useTransition();

  function reset() {
    setPreview(null);
    setResult(null);
    setParseError(null);
    setShowModal(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function fileTocsv(file: File): Promise<string> {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) return file.text();

    // XLSX parsé côté serveur (server action) pour éviter les problèmes de bundling
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    const res = await parseXlsxToCSV(base64);
    if (res.error || !res.csv) throw new Error(res.error ?? 'Erreur de lecture XLSX');
    return res.csv;
  }

  async function handleFile(file: File) {
    const name = file.name.toLowerCase();
    const supported = name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.xlsx') || name.endsWith('.xls');
    if (!supported) {
      setParseError('Format non supporté. Utilisez un fichier .csv, .xlsx ou .xls exporté depuis Excel.');
      return;
    }
    setParseError(null);
    let content: string;
    try {
      content = await fileTocsv(file);
    } catch {
      setParseError('Impossible de lire le fichier. Vérifiez qu\'il n\'est pas corrompu.');
      return;
    }
    startParsing(async () => {
      const parsed = await parseCsvContent(content);
      if (parsed.total === 0 && parsed.errors.length > 0) {
        setParseError(parsed.errors[0]);
      } else {
        setPreview(parsed);
      }
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleConfirm() {
    if (!preview) return;
    startImporting(async () => {
      const res = await importCsvStudents(preview.students);
      setResult(res);
      setShowModal(false);
      setPreview(null);
    });
  }

  // Résultat final
  if (result) {
    return <ImportResultView result={result} onReset={reset} />;
  }

  return (
    <>
      {showModal && preview && (
        <WarningModal
          preview={preview}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
          loading={isImporting}
        />
      )}

      <div className="space-y-4">
        {!preview ? (
          /* Zone de drop */
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? fileRef.current?.click() : undefined}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={[
              'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all',
              dragging
                ? 'border-[#0471a6] bg-[#0471a6]/5'
                : 'border-slate-200 bg-slate-50/60 hover:border-[#89aae6] hover:bg-slate-50',
            ].join(' ')}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className={[
              'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
              dragging ? 'bg-[#0471a6]/10' : 'bg-white border border-slate-200',
            ].join(' ')}>
              {isParsing ? (
                <Loader2 className="h-7 w-7 text-[#0471a6] animate-spin" />
              ) : (
                <Upload className="h-7 w-7 text-slate-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#061826]">
                {isParsing ? 'Analyse en cours…' : 'Glissez le fichier ici'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                ou cliquez pour parcourir · .xlsx, .xls ou .csv
              </p>
            </div>
            {parseError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}
          </div>
        ) : (
          /* Prévisualisation */
          <div className="space-y-4">
            {/* En-tête résumé */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#89aae6]/20">
                  <FileText className="h-5 w-5 text-[#3685b5]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#061826]">Fichier analysé</p>
                  <p className="text-xs text-slate-400">{preview.classe_nom}</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#89aae6]/20">
                  <Users className="h-4 w-4 text-[#3685b5]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#061826]">{preview.total}</p>
                  <p className="text-xs text-slate-400">étudiants</p>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-700">{preview.tp_count}</p>
                  <p className="text-xs text-emerald-600">temps plein</p>
                </div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-700">{preview.alt_count}</p>
                  <p className="text-xs text-blue-600">alternants</p>
                </div>
              </div>
            </div>

            {/* Erreurs de parsing */}
            {preview.errors.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">
                  {preview.errors.length} ligne(s) ignorée(s) :
                </p>
                <ul className="space-y-0.5">
                  {preview.errors.slice(0, 5).map((e, i) => (
                    <li key={i} className="text-xs text-amber-700">• {e}</li>
                  ))}
                  {preview.errors.length > 5 && (
                    <li className="text-xs text-amber-500">
                      … et {preview.errors.length - 5} autre(s)
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 bg-slate-50 border-b border-slate-200 px-4 py-3">
                <Eye className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-[#061826]">Aperçu des données</p>
                <span className="ml-auto text-xs text-slate-400">5 premiers</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Prénom</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Nom</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Email</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Parcours</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Mot de passe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {preview.students.slice(0, 5).map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-[#061826]">{s.prenom}</td>
                        <td className="px-4 py-2.5 text-slate-600">{s.nom}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{s.email}</td>
                        <td className="px-4 py-2.5">
                          <span className={[
                            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                            s.type_parcours === 'alternant'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700',
                          ].join(' ')}>
                            {s.type_parcours === 'alternant' ? 'ALT' : 'TP'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">
                            {s.mot_de_passe}
                          </code>
                        </td>
                      </tr>
                    ))}
                    {preview.total > 5 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-2.5 text-center text-xs text-slate-400">
                          … et {preview.total - 5} autre(s) étudiant(s)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bouton import */}
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Importer {preview.total} étudiant{preview.total > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
