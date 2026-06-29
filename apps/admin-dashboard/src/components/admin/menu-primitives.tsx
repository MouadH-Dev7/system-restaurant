'use client';

import { type ReactNode } from 'react';
import type { TranslationPanelLanguage } from './menu-types';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  className?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-slate-500 mb-1">
        {label}
      </span>
      <input
        type={type}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/10 ${className}`}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-slate-500 mb-1">
        {label}
      </span>
      <textarea
        rows={rows}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/10 ${className}`}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function ImagePreview({
  label,
  src,
  emptyLabel,
}: {
  label: string;
  src: string | null | undefined;
  emptyLabel: string;
}) {
  const normalized = src?.trim();

  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {normalized ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img src={normalized} alt={label} className="h-44 w-full object-cover" />
        </div>
      ) : (
        <div className="mt-3 flex h-44 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export function SimpleImagePreview({ src, emptyLabel }: { src: string; emptyLabel: string }) {
  const normalized = src.trim();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      {normalized ? (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <img src={normalized} alt="Menu preview" className="h-44 w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export function TranslationFields({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="mt-3 grid gap-3 grid-cols-1">{children}</div>
    </div>
  );
}

export function TranslationLanguageSwitcher({
  activeLanguage,
  onChange,
  focused = false,
}: {
  activeLanguage: TranslationPanelLanguage;
  onChange: (language: TranslationPanelLanguage) => void;
  focused?: boolean;
}) {
  return (
    <div
      className={`flex gap-1 shadow-sm w-full sm:w-auto ${
        focused
          ? 'bg-transparent p-0 border-0'
          : 'bg-white rounded-xl p-1 border border-slate-200'
      }`}
    >
      {(
        [
          { key: 'ar', label: 'العربية' },
          { key: 'en', label: 'English' },
          { key: 'fr', label: 'Français' },
        ] as const
      ).map((entry) => (
        <button
          key={entry.key}
          type="button"
          className={`flex-1 sm:flex-initial text-center py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
            activeLanguage === entry.key
              ? 'bg-[var(--admin-primary)] text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
          onClick={() => onChange(entry.key)}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}

export function TranslationPane({
  activeLanguage,
  children,
}: {
  activeLanguage: TranslationPanelLanguage;
  children: Partial<Record<TranslationPanelLanguage, ReactNode>>;
}) {
  return <>{children[activeLanguage] ?? null}</>;
}

export function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
        active
          ? 'bg-[#cf6d43] text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function EmptyStateCard({ message }: { message: string }) {
  return (
    <div className="menu-empty-card rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
      {message}
    </div>
  );
}

export function SelectionCard({
  active,
  title,
  subtitle,
  caption,
  imageSrc,
  onClick,
  focused = false,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  caption?: string;
  imageSrc?: string | null;
  onClick: () => void;
  focused?: boolean;
}) {
  return (
    <button
      type="button"
      className={`menu-selection-card w-full rounded-[28px] border p-4 text-start transition ${
        active
          ? focused
            ? 'border-[var(--admin-primary)] bg-[color-mix(in_srgb,var(--admin-primary-faint)_35%,white)] shadow-sm'
            : 'border-[#cf6d43] bg-[#fff5ef] shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {imageSrc ? <img src={imageSrc} alt={title} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-slate-900">{title}</h4>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          {caption ? <p className="mt-2 truncate text-xs text-slate-400">{caption}</p> : null}
        </div>
      </div>
    </button>
  );
}

export function ThemePresetCard({
  active,
  title,
  description,
  accentClass,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  accentClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`group rounded-[28px] border p-4 text-left transition ${
        active
          ? 'border-[#cf6d43] bg-[#fff5ef] shadow-md shadow-[#cf6d43]/10'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <div className={`rounded-[22px] bg-gradient-to-br ${accentClass} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
          </div>
          <div
            className={`mt-1 h-3 w-3 rounded-full border border-white/70 ${
              active ? 'bg-[#cf6d43]' : 'bg-white/80'
            }`}
          />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="h-3 rounded-full bg-white/80" />
          <div className="h-3 rounded-full bg-white/60" />
          <div className="h-3 rounded-full bg-white/40" />
        </div>
        <div className="mt-3 h-20 rounded-[18px] border border-white/70 bg-white/55 backdrop-blur-sm" />
      </div>
    </button>
  );
}
