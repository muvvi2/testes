import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sunrise, Sun, Moon } from 'lucide-react';
import type { DateAvailability, ShiftSlot } from '@/types';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const SHIFTS: { key: ShiftSlot; label: string; Icon: typeof Sunrise }[] = [
  { key: 'manha', label: 'Manhã', Icon: Sunrise },
  { key: 'tarde', label: 'Tarde', Icon: Sun },
  { key: 'noite', label: 'Noite', Icon: Moon },
];

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDayBackground(dayShifts: Record<ShiftSlot, boolean> | undefined): string {
  if (!dayShifts) return '';
  const active: ShiftSlot[] = [];
  if (dayShifts.manha) active.push('manha');
  if (dayShifts.tarde) active.push('tarde');
  if (dayShifts.noite) active.push('noite');
  if (active.length === 0) return '';
  if (active.length === 1) {
    if (active[0] === 'manha') return 'bg-amber-500 text-white border-amber-600';
    if (active[0] === 'tarde') return 'bg-sky-400 text-white border-sky-500';
    return 'bg-purple-500 text-white border-purple-600';
  }
  return 'text-white border-neutral-300';
}

function getDayGradient(dayShifts: Record<ShiftSlot, boolean> | undefined): string | undefined {
  if (!dayShifts) return undefined;
  const active: string[] = [];
  if (dayShifts.manha) active.push('#f59e0b');
  if (dayShifts.tarde) active.push('#38bdf8');
  if (dayShifts.noite) active.push('#a855f7');
  if (active.length <= 1) return undefined;
  
  if (active.length === 2) {
    return `linear-gradient(135deg, ${active[0]} 50%, ${active[1]} 50%)`;
  }
  return `linear-gradient(135deg, #f59e0b 33%, #38bdf8 33% 66%, #a855f7 66%)`;
}

export function AvailabilityCalendar({
  dateAvailability,
  editable = false,
  onToggle,
}: {
  dateAvailability?: DateAvailability;
  editable?: boolean;
  onToggle?: (dateKey: string, shift: ShiftSlot) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [activeShift, setActiveShift] = useState<ShiftSlot>('manha');

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 sm:p-4">
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={goToday} className="text-center">
          <p className="font-display text-base font-bold text-neutral-900 dark:text-white sm:text-lg">{MONTHS[month]}</p>
          <p className="text-xs text-neutral-500">{year}</p>
        </button>
        <button
          onClick={nextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Shift selector */}
      {editable && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">Turno ativo:</span>
          {SHIFTS.map(({ key, label, Icon }) => {
            const isActive = activeShift === key;
            const colorClasses =
              key === 'manha' ? 'bg-amber-500 border-amber-600 text-white' :
              key === 'tarde' ? 'bg-sky-400 border-sky-500 text-white' :
              'bg-purple-500 border-purple-600 text-white';
            return (
              <button
                key={key}
                onClick={() => setActiveShift(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  isActive ? colorClasses : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            );
          })}
          <span className="ml-1 text-[11px] text-neutral-400">Clique no dia para marcar/desmarcar</span>
        </div>
      )}

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="py-1 text-center text-[10px] font-semibold uppercase text-neutral-400 sm:text-xs">{wd}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dKey = dateKey(year, month, day);
          const dayShifts = dateAvailability?.[dKey];
          const activeCount = dayShifts ? [dayShifts.manha, dayShifts.tarde, dayShifts.noite].filter(Boolean).length : 0;
          const isToday = dKey === todayKey;
          const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const gradient = getDayGradient(dayShifts);
          const solidBg = activeCount === 1 ? getDayBackground(dayShifts) : '';

          const baseClass = 'relative flex h-9 items-center justify-center rounded-lg border text-xs font-medium transition sm:h-11 sm:text-sm';
          let stateClass = '';
          if (gradient) {
            stateClass = 'border-neutral-300 text-white font-bold shadow-sm';
          } else if (solidBg) {
            stateClass = solidBg;
          } else if (isPast) {
            stateClass = 'border-transparent bg-neutral-50 text-neutral-300 dark:bg-neutral-800/40 dark:text-neutral-600';
          } else {
            stateClass = 'border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
          }
          if (editable && !isPast) stateClass += ' hover:scale-105 cursor-pointer active:scale-95';

          return (
            <button
              key={i}
              disabled={!editable || isPast}
              onClick={() => editable && !isPast && onToggle?.(dKey, activeShift)}
              className={`${baseClass} ${stateClass} ${isToday ? 'ring-2 ring-primary-400 ring-offset-1 dark:ring-offset-neutral-900' : ''}`}
              style={gradient ? { background: gradient } : undefined}
              title={dayShifts ? `Manhã: ${dayShifts.manha ? 'Sim' : 'Não'} · Tarde: ${dayShifts.tarde ? 'Sim' : 'Não'} · Noite: ${dayShifts.noite ? 'Sim' : 'Não'}` : ''}
            >
              {day}
              {activeCount > 0 && (
                <span className="absolute bottom-0.5 right-0.5 flex gap-[1px]">
                  {dayShifts?.manha && <span className="h-1 w-1 rounded-full bg-amber-200" />}
                  {dayShifts?.tarde && <span className="h-1 w-1 rounded-full bg-sky-200" />}
                  {dayShifts?.noite && <span className="h-1 w-1 rounded-full bg-purple-200" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
        <span className="text-xs font-semibold text-neutral-500">Legenda:</span>
        {SHIFTS.map(({ key, label, Icon }) => {
          const color =
            key === 'manha' ? 'bg-amber-500' :
            key === 'tarde' ? 'bg-sky-400' :
            'bg-purple-500';
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded ${color}`} />
              <Icon className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{label}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: 'linear-gradient(135deg, #f59e0b 50%, #38bdf8 50%)' }} />
          <span className="text-xs text-neutral-600 dark:text-neutral-400">2 turnos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: 'linear-gradient(135deg, #f59e0b 33%, #38bdf8 33% 66%, #a855f7 66%)' }} />
          <span className="text-xs text-neutral-600 dark:text-neutral-400">3 turnos</span>
        </div>
      </div>
    </div>
  );
}
