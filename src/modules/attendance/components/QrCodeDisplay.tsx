'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { closeAttendanceSession } from '../actions';
import type { AttendanceSession } from '../types';

interface QrCodeDisplayProps {
  session: AttendanceSession;
  scanBaseUrl: string;
}

export function QrCodeDisplay({ session, scanBaseUrl }: QrCodeDisplayProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = new Date(session.expiration).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  async function handleClose() {
    setClosing(true);
    await closeAttendanceSession(session.id);
    router.push(`/dashboard/emargement/rapport/${session.id}`);
  }

  const scanUrl = `${scanBaseUrl}/dashboard/emargement/scan?code=${session.code_unique}`;
  const expired = secondsLeft === 0;

  const expiresAt = new Date(session.expiration).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-6">

      {/* Titre + sous-titre dans la card */}
      <div className="mb-5">
        <h1 className="text-[26px] font-semibold tracking-tight text-[#0f1a2e]">
          Session d&apos;appel en cours
        </h1>
        <p className="mt-1 text-[13px] text-[#6b7a90]">
          Expire à <span className="text-slate-800">{expiresAt}</span>
        </p>
      </div>

      {/* QR code centré */}
      <div className="flex flex-col items-center justify-center gap-4">

        <div
          className={[
            'rounded-[2rem] border-2 bg-white p-4 transition-opacity',
            expired ? 'border-red-300 opacity-40' : 'border-slate-200',
          ].join(' ')}
          aria-label="QR code de la session"
        >
          <div className="h-[350px] w-[350px] overflow-hidden rounded-2xl bg-white flex items-center justify-center">
            {expired ? (
              <p className="text-sm font-semibold text-red-500">QR Code expiré</p>
            ) : (
              <QRCodeSVG value={scanUrl} size={350} level="M" />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          disabled={closing}
          className="inline-flex items-center justify-center rounded-xl bg-red-700 px-4 py-2 text-[12px] font-semibold text-white hover:bg-red-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Clore la session d'émargement"
        >
          {closing ? 'Fermeture…' : 'Clore la session'}
        </button>

      </div>
    </section>
  );
}
