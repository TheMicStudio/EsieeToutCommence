'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AttendanceRecord } from '../types';

interface AttendanceCounterProps {
  sessionId: string;
  classSize: number;
  initialCount: number;
}

export function AttendanceCounter({ sessionId, classSize, initialCount }: AttendanceCounterProps) {
  const [count, setCount] = useState(initialCount);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`presence-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance_records',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        setCount((prev) => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, supabase]);

  const pct = classSize > 0 ? Math.round((count / classSize) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-5xl font-bold tabular-nums text-primary">{count}</span>
      <span className="text-sm text-muted-foreground">/ {classSize} élèves présents</span>
      <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}
