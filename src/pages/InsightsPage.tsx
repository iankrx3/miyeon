import { useEffect, useState } from 'react';
import type { UserSession } from '../types';
import { supabase } from '../lib/supabase/client';

type Row = {
  name: string;
  visitor_id: string;
  path: string | null;
  props: Record<string, unknown>;
  created_at: string;
};

type Access = 'loading' | 'unconfigured' | 'signed-out' | 'forbidden' | 'schema' | 'ready' | 'error';

const STEPS = ['fix', 'change', 'restore', 'trip', 'budget', 'language'] as const;

function textProp(row: Row, key: string): string {
  const value = row.props?.[key];
  return typeof value === 'string' ? value : '';
}

function visitors(rows: Row[], pred: (row: Row) => boolean): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) if (pred(row)) ids.add(row.visitor_id);
  return ids;
}

function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayKey(iso: string): string {
  return formatDay(new Date(iso));
}

function recentDays(count: number): string[] {
  const days: string[] = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(start);
    date.setDate(start.getDate() - i);
    days.push(formatDay(date));
  }
  return days;
}

async function loadEvents(since: string): Promise<{ rows: Row[]; truncated: boolean }> {
  if (!supabase) return { rows: [], truncated: false };
  const pageSize = 1000;
  const rows: Row[] = [];
  for (let from = 0; from < 20000; from += pageSize) {
    const { data, error } = await supabase
      .from('product_events')
      .select('name,visitor_id,path,props,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = (data ?? []) as Row[];
    rows.push(...batch);
    if (batch.length < pageSize) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max === 0 ? 0 : Math.max(value === 0 ? 0 : 4, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-miyeon-ink">{label}</span>
        <span className="tabular-nums text-miyeon-main/70">{value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-miyeon-surface">
        <div className="h-2 rounded-full bg-miyeon-accent" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function InsightsPage({ session, onSignIn }: { session: UserSession; onSignIn: () => void }) {
  const [days, setDays] = useState<7 | 30>(7);
  const [access, setAccess] = useState<Access>('loading');
  const [rows, setRows] = useState<Row[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) {
        setAccess('unconfigured');
        return;
      }
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        if (!cancelled) setAccess('signed-out');
        return;
      }
      const { data: allowed, error: accessError } = await supabase.rpc('is_analytics_reader');
      if (cancelled) return;
      if (accessError) {
        setAccess(accessError.message.toLowerCase().includes('is_analytics_reader') ? 'schema' : 'error');
        setError(accessError.message);
        return;
      }
      if (!allowed) {
        setAccess('forbidden');
        return;
      }
      setAccess('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [session.user?.id]);

  useEffect(() => {
    if (access !== 'ready' || !supabase) return;
    let cancelled = false;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    setError(null);
    void loadEvents(since)
      .then((result) => {
        if (cancelled) return;
        setRows(result.rows);
        setTruncated(result.truncated);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '기록을 읽지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [access, days]);

  const started = visitors(rows, (row) => row.name === 'quiz_start');
  const answeredLanguage = visitors(rows, (row) => row.name === 'quiz_step' && textProp(row, 'step') === 'language');
  const completed = visitors(rows, (row) => row.name === 'quiz_complete');
  const outbound = visitors(rows, (row) => row.name === 'outbound_click');
  const funnelMax = Math.max(started.size, 1);

  const stepCounts = STEPS.map((step) => ({
    step,
    count: visitors(rows, (row) => row.name === 'quiz_step' && textProp(row, 'step') === step).size,
  }));
  const fixCount = stepCounts[0]?.count ?? 0;

  const pageViews = rows.filter((row) => row.name === 'page_view');
  const daysInRange = recentDays(days);
  const daily = daysInRange.map((day) => {
    const onDay = pageViews.filter((row) => dayKey(row.created_at) === day);
    return {
      day: day.slice(5),
      all: visitors(onDay, () => true).size,
      start: visitors(onDay, (row) => row.path === '/start').size,
      home: visitors(onDay, (row) => row.path === '/').size,
    };
  });
  const dailyMax = Math.max(1, ...daily.map((day) => day.all));

  const langCounts = new Map<string, number>();
  const seenLang = new Set<string>();
  for (const row of rows) {
    if (seenLang.has(row.visitor_id)) continue;
    seenLang.add(row.visitor_id);
    const lang = textProp(row, 'lang') || 'en';
    langCounts.set(lang, (langCounts.get(lang) ?? 0) + 1);
  }

  const subtypeCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.name !== 'outbound_click') continue;
    const subtype = textProp(row, 'subtype') || 'unknown';
    subtypeCounts.set(subtype, (subtypeCounts.get(subtype) ?? 0) + 1);
  }

  const campaignCounts = new Map<string, { start: number; complete: number; outbound: number }>();
  const campaignOf = new Map<string, string>();
  for (const row of rows) {
    const campaign = textProp(row, 'utm_campaign');
    if (campaign && !campaignOf.has(row.visitor_id)) campaignOf.set(row.visitor_id, campaign);
  }
  const bump = (id: string, field: 'start' | 'complete' | 'outbound') => {
    const key = campaignOf.get(id) || '(none)';
    const current = campaignCounts.get(key) ?? { start: 0, complete: 0, outbound: 0 };
    current[field] += 1;
    campaignCounts.set(key, current);
  };
  started.forEach((id) => bump(id, 'start'));
  completed.forEach((id) => bump(id, 'complete'));
  outbound.forEach((id) => bump(id, 'outbound'));

  return (
    <div className="mx-auto max-w-xl px-5 py-6">
      <p className="text-[11px] font-medium tracking-[0.18em] text-miyeon-accent-dark">INSIGHTS</p>
      <h1 className="mt-1 font-display text-[28px] font-bold text-miyeon-ink">방문자</h1>
      <p className="mt-1 text-[13px] text-miyeon-main/60">사람 수는 브라우저 하나당 하나입니다. 이메일 주소는 여기 없습니다.</p>

      {access === 'loading' && <p className="mt-8 text-sm text-miyeon-main/60">불러오는 중…</p>}

      {access === 'unconfigured' && (
        <p className="mt-8 text-sm text-miyeon-main/70">Supabase가 설정되어 있지 않아 기록을 볼 수 없습니다.</p>
      )}

      {access === 'signed-out' && (
        <div className="mt-8">
          <p className="text-sm text-miyeon-main/70">Google 계정으로 로그인해야 봅니다. 데모 로그인은 포함되지 않습니다.</p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-4 rounded-full bg-miyeon-ink px-5 py-3 text-sm font-medium text-white"
          >
            로그인
          </button>
        </div>
      )}

      {access === 'forbidden' && (
        <p className="mt-8 text-sm text-miyeon-main/70">
          이 계정은 열람 권한이 없습니다. Supabase의 analytics_readers에 이 이메일을 넣은 뒤 다시 여세요.
        </p>
      )}

      {access === 'schema' && (
        <p className="mt-8 text-sm text-miyeon-main/70">
          아직 표를 만들지 않았습니다. supabase/schema/analytics_schema.sql 을 SQL 에디터에서 실행하고, analytics_readers에
          본인 이메일을 넣으세요.
        </p>
      )}

      {access === 'error' && <p className="mt-8 text-sm text-miyeon-accent-dark">{error}</p>}

      {access === 'ready' && (
        <>
          <div className="mt-5 flex gap-2">
            {([7, 30] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={`rounded-full px-4 py-2 text-[13px] ${
                  days === option ? 'bg-miyeon-ink text-white' : 'bg-miyeon-surface text-miyeon-main'
                }`}
              >
                {option}일
              </button>
            ))}
          </div>
          {truncated && (
            <p className="mt-3 text-[12px] text-miyeon-main/60">최근 2만 건까지만 집계했습니다.</p>
          )}
          {error && <p className="mt-3 text-sm text-miyeon-accent-dark">{error}</p>}

          <section className="mt-6 rounded-2xl border border-miyeon-line p-4">
            <h2 className="text-[13px] font-medium text-miyeon-ink">퍼널</h2>
            <div className="mt-3 space-y-3">
              <Bar label="퀴즈 시작" value={started.size} max={funnelMax} />
              <Bar label="마지막 문항" value={answeredLanguage.size} max={funnelMax} />
              <Bar label="결과 생성" value={completed.size} max={funnelMax} />
              <Bar label="Creatrip으로 이동" value={outbound.size} max={funnelMax} />
            </div>
            <p className="mt-3 text-[12px] text-miyeon-main/55">
              시작 위치 · 홈 {visitors(rows, (row) => row.name === 'quiz_start' && textProp(row, 'entry') === 'home').size}
              {' · '}
              광고·매거진 {visitors(rows, (row) => row.name === 'quiz_start' && textProp(row, 'entry') === 'start').size}
            </p>
          </section>

          <section className="mt-4 rounded-2xl border border-miyeon-line p-4">
            <h2 className="text-[13px] font-medium text-miyeon-ink">문항 이탈</h2>
            <p className="mt-1 text-[12px] text-miyeon-main/55">첫 문항을 넘긴 사람 대비</p>
            <div className="mt-3 space-y-3">
              {stepCounts.map((step) => (
                <Bar
                  key={step.step}
                  label={`${step.step}${fixCount ? ` · ${Math.round((step.count / fixCount) * 100)}%` : ''}`}
                  value={step.count}
                  max={Math.max(fixCount, 1)}
                />
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-miyeon-line p-4">
            <h2 className="text-[13px] font-medium text-miyeon-ink">하루 방문자</h2>
            <p className="mt-1 text-[12px] text-miyeon-main/55">전체 · /start · 홈</p>
            <div className="mt-3 space-y-2">
              {daily.map((day) => (
                <div key={day.day} className="flex items-center gap-3 text-[12px]">
                  <span className="w-12 shrink-0 tabular-nums text-miyeon-main/60">{day.day}</span>
                  <div className="h-2 flex-1 rounded-full bg-miyeon-surface">
                    <div
                      className="h-2 rounded-full bg-miyeon-accent"
                      style={{ width: `${Math.round((day.all / dailyMax) * 100)}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right tabular-nums text-miyeon-ink">
                    {day.all} · {day.start} · {day.home}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-miyeon-line p-4">
            <h2 className="text-[13px] font-medium text-miyeon-ink">언어</h2>
            <ul className="mt-3 space-y-1 text-[13px]">
              {[...langCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([lang, count]) => (
                  <li key={lang} className="flex justify-between">
                    <span>{lang}</span>
                    <span className="tabular-nums">{count}</span>
                  </li>
                ))}
              {langCounts.size === 0 && <li className="text-miyeon-main/50">아직 없습니다.</li>}
            </ul>
            <h2 className="mt-5 text-[13px] font-medium text-miyeon-ink">나가는 카테고리</h2>
            <ul className="mt-3 space-y-1 text-[13px]">
              {[...subtypeCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([subtype, count]) => (
                  <li key={subtype} className="flex justify-between">
                    <span>{subtype}</span>
                    <span className="tabular-nums">{count}</span>
                  </li>
                ))}
              {subtypeCounts.size === 0 && <li className="text-miyeon-main/50">아직 없습니다.</li>}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl border border-miyeon-line p-4">
            <h2 className="text-[13px] font-medium text-miyeon-ink">캠페인</h2>
            <p className="mt-1 text-[12px] text-miyeon-main/55">시작 · 결과 · Creatrip. UTM이 없으면 (none)</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              {[...campaignCounts.entries()]
                .sort((a, b) => b[1].start - a[1].start)
                .map(([campaign, count]) => (
                  <li key={campaign} className="flex justify-between gap-3">
                    <span className="truncate">{campaign}</span>
                    <span className="shrink-0 tabular-nums">
                      {count.start} · {count.complete} · {count.outbound}
                    </span>
                  </li>
                ))}
              {campaignCounts.size === 0 && <li className="text-miyeon-main/50">아직 없습니다.</li>}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
