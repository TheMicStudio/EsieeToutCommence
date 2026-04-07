'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { CheckInResult } from './CheckInResult';

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<{ success?: boolean; statut?: string; error?: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  async function generateFingerprint(): Promise<string> {
    const raw = `${navigator.userAgent}|${screen.width}x${screen.height}|${navigator.language}`;
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function startScan() {
    setScanning(true);
    setResult(null);
    setCameraError('');
    try {
      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const deviceId = devices[devices.length - 1]?.deviceId;

      await reader.decodeFromVideoDevice(deviceId, videoRef.current!, async (qrResult, err) => {
        if (qrResult) {
          readerRef.current = null;
          setScanning(false);
          const text = qrResult.getText();
          // Extraire le code_unique de l'URL
          const match = text.match(/[?&]code=([^&]+)/);
          if (!match) {
            setResult({ error: 'QR Code invalide' });
            return;
          }
          const codeUnique = match[1];
          const fingerprint = await generateFingerprint();

          const res = await fetch('/api/attendance/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codeUnique, deviceFingerprint: fingerprint }),
          });
          const data = await res.json();
          setResult(data);
        }
        if (err && !(err instanceof TypeError)) {
          // Erreurs de scan normales (frame sans QR) — ignorer
        }
      });
    } catch {
      setCameraError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      setScanning(false);
    }
  }

  function stopScan() {
    readerRef.current = null;
    setScanning(false);
  }

  useEffect(() => {
    return () => { readerRef.current = null; };
  }, []);

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4">
        <CheckInResult result={result} />
        <button
          type="button"
          onClick={() => { setResult(null); startScan(); }}
          className="text-sm text-primary underline underline-offset-4"
        >
          Scanner à nouveau
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {scanning ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative overflow-hidden rounded-2xl border-4 border-primary">
            <video ref={videoRef} className="h-64 w-64 object-cover sm:h-80 sm:w-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-40 rounded-lg border-2 border-white/60" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Pointez la caméra vers le QR Code</p>
          <button
            type="button"
            onClick={stopScan}
            className="text-sm text-destructive underline underline-offset-4"
          >
            Annuler
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-64 w-64 items-center justify-center rounded-2xl border-4 border-dashed border-muted-foreground/30 sm:h-80 sm:w-80">
            <p className="text-center text-sm text-muted-foreground px-4">
              Appuyez sur le bouton ci-dessous pour scanner le QR Code
            </p>
          </div>
          {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}
          <button
            type="button"
            onClick={startScan}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ouvrir la caméra
          </button>
        </div>
      )}
    </div>
  );
}
