import { Suspense } from 'react';
import { TrendingUp } from 'lucide-react';
import { LoginForm } from '@/modules/auth/components/LoginForm';

export const metadata = { title: 'Connexion — Coding Hub' };

const AVATARS = [
  { src: 'https://i.pravatar.cc/48?img=47', alt: 'Utilisateur 1' },
  { src: 'https://i.pravatar.cc/48?img=12', alt: 'Utilisateur 2' },
  { src: 'https://i.pravatar.cc/48?img=32', alt: 'Utilisateur 3' },
];

const CHART_BARS = [
  { h: 16, opacity: 0.35 },
  { h: 26, opacity: 0.55 },
  { h: 20, opacity: 0.75 },
  { h: 32, opacity: 1 },
];

export default function LoginPage() {
  return (
    <main className="h-screen overflow-hidden bg-[#F1F5F9] flex p-6 gap-6 font-sans">

      {/* ── LEFT PANEL (50%) ─────────────────────────────────────── */}
      <div className="w-1/2 flex flex-col gap-6">

        {/* Login Card */}
        <div
          className="flex-1 bg-white rounded-[28px] border border-[#E2E8F0] flex items-center justify-center"
          style={{ boxShadow: '0 1px 0 rgba(15,23,42,0.06), 0 10px 30px rgba(15,23,42,0.06)' }}
        >
          <div className="w-full max-w-md px-8 py-8">

            {/* Heading */}
            <h1
              className="text-center text-[32px] font-bold tracking-tight text-[#1E293B] leading-tight"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              Bienvenue sur EsieeToutCommence
            </h1>

            {/* Subtitle */}
            <p className="text-center text-[14px] font-medium text-[#6b7a90] mt-2 mb-8">
              Accès unifié pour l&apos;éducation tech.
            </p>

            {/* Form */}
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        {/* Trust Card */}
        <div
          className="bg-white rounded-[28px] border border-[#E2E8F0] py-3 px-5 flex items-center justify-center gap-3"
          style={{ boxShadow: '0 1px 0 rgba(15,23,42,0.06), 0 10px 30px rgba(15,23,42,0.06)' }}
        >
          {/* Overlapping avatars */}
          <div className="flex items-center">
            {AVATARS.map((av, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={av.src}
                alt={av.alt}
                className={`h-9 w-9 rounded-full object-cover border-2 border-white${i > 0 ? ' -ml-2' : ''}`}
                style={{ zIndex: AVATARS.length - i }}
              />
            ))}
          </div>
          {/* Text */}
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Rejoignez 20K+ utilisateurs</p>
            <p className="text-[12px] font-medium text-slate-500">Approuvé par 800+ établissements</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (50%) ────────────────────────────────────── */}
      <div className="w-1/2 bg-[#0F172A] rounded-[28px] relative overflow-hidden">

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Central cyan glow orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,163,224,0.18) 0%, transparent 70%)' }}
        />

        {/* ─── Campus SVG illustration ─── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 420 320" className="w-[72%]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ground line */}
            <line x1="30" y1="290" x2="390" y2="290" stroke="#1E3A5F" strokeWidth="2" />

            {/* Main building */}
            <rect x="110" y="155" width="200" height="135" fill="#0D1F3C" stroke="#00A3E0" strokeWidth="1.2" rx="2" />
            {/* Roof wing */}
            <rect x="155" y="105" width="110" height="55" fill="#0D1F3C" stroke="#00A3E0" strokeWidth="1.2" rx="2" />
            {/* Antenna */}
            <line x1="210" y1="105" x2="210" y2="68" stroke="#00A3E0" strokeWidth="1.5" />
            <circle cx="210" cy="62" r="5" fill="#00A3E0" opacity="0.9" />
            {/* Signal rings */}
            <circle cx="210" cy="62" r="12" stroke="#00A3E0" strokeWidth="0.8" opacity="0.4" />
            <circle cx="210" cy="62" r="20" stroke="#00A3E0" strokeWidth="0.8" opacity="0.2" />

            {/* Windows – main building */}
            {[130, 170, 230, 270].map((x) =>
              [180, 215, 250].map((y) => (
                <rect key={`w${x}-${y}`} x={x} y={y} width="16" height="14" rx="2"
                  fill="#00A3E0" opacity={y === 215 ? 0.7 : 0.45} />
              ))
            )}
            {/* Windows – roof wing */}
            {[170, 210].map((x) => (
              <rect key={`rw${x}`} x={x} y={120} width="14" height="22" rx="2"
                fill="#00A3E0" opacity="0.55" />
            ))}

            {/* Door */}
            <rect x="195" y="252" width="30" height="38" rx="2" fill="#00A3E0" opacity="0.5" />

            {/* Side buildings */}
            <rect x="52" y="205" width="55" height="85" fill="#0D1F3C" stroke="#1E3A5F" strokeWidth="1" rx="1" />
            {[62, 84].map((x) => [215, 240, 265].map((y) => (
              <rect key={`sb${x}-${y}`} x={x} y={y} width="10" height="10" rx="1"
                fill="#00A3E0" opacity="0.3" />
            )))}

            <rect x="313" y="218" width="55" height="72" fill="#0D1F3C" stroke="#1E3A5F" strokeWidth="1" rx="1" />
            {[323, 345].map((x) => [228, 252, 276].map((y) => (
              <rect key={`sb2${x}-${y}`} x={x} y={y} width="10" height="10" rx="1"
                fill="#00A3E0" opacity="0.3" />
            )))}

            {/* Decorative arcs */}
            <path d="M 60 290 Q 210 200 360 290" stroke="#00A3E0" strokeWidth="0.6" opacity="0.15" fill="none" />
            <path d="M 80 290 Q 210 230 340 290" stroke="#00A3E0" strokeWidth="0.6" opacity="0.1" fill="none" />

            {/* Orbit ring (decorative) */}
            <ellipse cx="210" cy="160" rx="180" ry="35" stroke="#00A3E0" strokeWidth="0.7" opacity="0.12" />
          </svg>
        </div>

        {/* ─── Floating code block ─── */}
        <div
          className="absolute top-8 left-8 rounded-lg p-4 border"
          style={{
            background: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex gap-1.5 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <div className="space-y-1 font-mono text-[11px] leading-relaxed">
            <div>
              <span className="text-[#00A3E0]">const</span>
              <span className="text-white"> user </span>
              <span className="text-slate-400">= </span>
              <span className="text-emerald-400">await </span>
              <span className="text-white">auth</span>
              <span className="text-slate-400">.</span>
              <span className="text-[#00A3E0]">getUser</span>
              <span className="text-slate-400">()</span>
            </div>
            <div className="text-slate-500">{'// ✓ Session active'}</div>
            <div>
              <span className="text-purple-400">return</span>
              <span className="text-white"> dashboard</span>
              <span className="text-slate-400">.</span>
              <span className="text-[#00A3E0]">load</span>
              <span className="text-slate-400">(user)</span>
            </div>
          </div>
        </div>

        {/* ─── Stats chip ─── */}
        <div
          className="absolute top-8 right-8 rounded-lg p-3 border"
          style={{
            background: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <p className="text-[10px] text-slate-400 mb-1">Étudiants connectés</p>
          <p className="text-2xl font-bold text-white">2 847</p>
          <p className="text-[10px] text-[#00A3E0] mt-0.5">↑ 12% aujourd&apos;hui</p>
        </div>

        {/* ─── Modules status chip ─── */}
        <div
          className="absolute right-8 bottom-24 rounded-lg px-3 py-2 border"
          style={{
            background: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00A3E0]" style={{ boxShadow: '0 0 6px #00A3E0' }} />
            <span className="font-mono text-[11px] text-[#00A3E0]">modules.loaded</span>
            <span className="font-mono text-[11px] text-emerald-400">✓ 7</span>
          </div>
        </div>

        {/* Accent rings */}
        <div className="absolute bottom-28 left-8 w-14 h-14 rounded-full border border-[#00A3E0]/20 pointer-events-none" />
        <div className="absolute top-40 left-1/3 w-6 h-6 rounded-full border border-[#00A3E0]/30 pointer-events-none" />

        {/* ─── Bottom Glassmorphism Card ─── */}
        <div
          className="absolute bottom-6 left-6 right-6 rounded-xl p-5 flex items-center gap-4"
          style={{
            background: 'rgba(17,24,39,0.82)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 8px 32px rgba(0,163,224,0.08)',
          }}
        >
          <TrendingUp className="h-5 w-5 text-[#00A3E0] flex-shrink-0" />
          <p className="text-white text-[14px] font-semibold flex-1 leading-snug">
            93,5% de taux de réussite &amp; 800+ entreprises partenaires
          </p>
          {/* Mini chart bars */}
          <div className="flex items-end gap-1">
            {CHART_BARS.map((bar, i) => (
              <div
                key={i}
                className="w-2 rounded-sm"
                style={{ height: `${bar.h}px`, background: `rgba(0,163,224,${bar.opacity})` }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
