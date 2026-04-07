'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { closeAttendanceSession } from '../actions';
import { AttendanceCounter } from './AttendanceCounter';
import { Button } from '@/components/ui/button';
import type { AttendanceSession } from '../types';

interface QrCodeDisplayProps {
  session: AttendanceSession;
  classSize: number;
  initialCount: number;
  scanBaseUrl: string;
}

export function QrCodeDisplay({ session, classSize, initialCount, scanBaseUrl }: QrCodeDisplayProps) {
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
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
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

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const scanUrl = `${scanBaseUrl}/dashboard/emargement/scan?code=${session.code_unique}`;
  const expired = secondsLeft === 0;

  return (
    <div className="flex flex-col items-center gap-6 py-6 lg:flex-row lg:items-start lg:gap-12">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-4">
        <div className={`rounded-2xl border-4 p-4 transition-opacity ${expired ? 'border-destructive opacity-40' : 'border-primary'}`}>
          <QRCodeSVG value={scanUrl} size={256} level="M" />
        </div>
        {expired ? (
          <p className="font-semibold text-destructive">QR Code expiré</p>
        ) : (
          <p className="text-2xl font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Scannez avec l&apos;application ou la caméra</p>
      </div>

      {/* Compteur + actions */}
      <div className="flex flex-col items-center gap-6 lg:items-start">
        <AttendanceCounter
          sessionId={session.id}
          classSize={classSize}
          initialCount={initialCount}
        />
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={closing}
          className="mt-4"
        >
          {closing ? 'Fermeture…' : 'Clore la session'}
        </Button>
      </div>
    </div>
  );
}
