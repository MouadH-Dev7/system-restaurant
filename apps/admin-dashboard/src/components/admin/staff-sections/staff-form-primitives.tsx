'use client';

import type { ReactNode } from 'react';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#cf6d43] focus:ring-2 focus:ring-[#cf6d43]/10';

export function TextField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {props.label}
      </span>
      <input
        className={inputClassName}
        type={props.type ?? 'text'}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

export function TextAreaField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {props.label}
      </span>
      <textarea
        className={`${inputClassName} min-h-[110px] resize-y`}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

export function SelectField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {props.label}
      </span>
      <select className={inputClassName} value={props.value} onChange={(event) => props.onChange(event.target.value)}>
        {props.children}
      </select>
    </label>
  );
}

export function ToggleField(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {props.label}
      </span>
      <label className="flex h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700">
        <input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} />
        <span>{props.hint}</span>
      </label>
    </div>
  );
}

export function FormSection(props: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900">{props.title}</h4>
        <p className="mt-1 text-xs text-slate-500">{props.description}</p>
      </div>
      <div className="grid gap-4">{props.children}</div>
    </div>
  );
}
