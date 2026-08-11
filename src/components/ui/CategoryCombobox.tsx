import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Plus, Check, ChevronDown } from 'lucide-react';
import { CATEGORIES, MACRO_CATEGORIES } from '@/mockData';
import type { Category } from '@/types';

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
  placeholder?: string;
  label?: string;
  allowCustom?: boolean;
  customCategories?: string[];
  onAddCustom?: (label: string) => void;
}

export function CategoryCombobox({
  selected,
  onChange,
  maxSelections = 5,
  placeholder = 'Buscar especialidade...',
  label = 'Especialidades',
  allowCustom = true,
  customCategories = [],
  onAddCustom,
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allCategories = useMemo(() => {
    const customCats: Category[] = customCategories
      .filter((c) => !CATEGORIES.some((cat) => cat.id === c))
      .map((c) => ({ id: c, label: c, icon: 'Tag', color: '#6b7280', macro: 'custom' }));
    return [...CATEGORIES, ...customCats];
  }, [customCategories]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allCategories;
    const q = query.toLowerCase().trim();
    return allCategories.filter((c) => c.label.toLowerCase().includes(q));
  }, [allCategories, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, Category[]> = {};
    for (const c of filtered) {
      if (!groups[c.macro]) groups[c.macro] = [];
      groups[c.macro].push(c);
    }
    return groups;
  }, [filtered]);

  const flatFiltered = useMemo(() => {
    const arr: Category[] = [];
    for (const macroId of Object.keys(grouped)) {
      arr.push(...grouped[macroId]);
    }
    return arr;
  }, [grouped]);

  const exactMatch = useMemo(() => {
    if (!query.trim()) return true;
    return allCategories.some((c) => c.label.toLowerCase() === query.toLowerCase().trim());
  }, [allCategories, query]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      if (selected.length >= maxSelections) return;
      onChange([...selected, id]);
    }
  };

  const addCustom = () => {
    const term = query.trim();
    if (!term) return;
    if (onAddCustom) {
      onAddCustom(term);
    }
    toggle(term);
    setQuery('');
    setOpen(false);
  };

  const selectedCats = allCategories.filter((c) => selected.includes(c.id));

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="mb-1.5 block text-xs font-semibold text-neutral-500">{label}</label>}

      {/* Selected tags */}
      {selectedCats.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedCats.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: c.color }}>
              {c.label}
              <button type="button" onClick={() => toggle(c.id)} className="ml-0.5 rounded-full hover:bg-white/20"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightIdx(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, flatFiltered.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter') { e.preventDefault(); if (flatFiltered[highlightIdx]) toggle(flatFiltered[highlightIdx].id); }
            else if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 pointer-events-none" />
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-neutral-400">{selected.length}/{maxSelections === 999 ? '∞' : maxSelections} selecionadas</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {/* Custom tag option */}
          {allowCustom && query.trim() && !exactMatch && (
            <button
              type="button"
              onClick={addCustom}
              className="flex w-full items-center gap-2 border-b border-neutral-100 px-3 py-2.5 text-left text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:border-neutral-700 dark:text-primary-400 dark:hover:bg-primary-500/10"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Adicionar "{query.trim()}" como nova especialidade
            </button>
          )}

          {flatFiltered.length === 0 && !allowCustom && (
            <p className="px-3 py-4 text-center text-sm text-neutral-400">Nenhuma especialidade encontrada.</p>
          )}

          {Object.entries(grouped).map(([macroId, cats]) => {
            const macro = MACRO_CATEGORIES.find((m) => m.id === macroId);
            return (
              <div key={macroId}>
                <div className="sticky top-0 bg-neutral-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                  {macro?.label ?? macroId}
                </div>
                {cats.map((c) => {
                  const idx = flatFiltered.indexOf(c);
                  const isSelected = selected.includes(c.id);
                  const isHighlighted = idx === highlightIdx;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${isHighlighted ? 'bg-neutral-100 dark:bg-neutral-700' : ''} ${isSelected ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: isSelected ? c.color : 'transparent', border: isSelected ? 'none' : `1.5px solid ${c.color}40` }}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
