'use client';

import { CalendarRange } from 'lucide-react';
import type { StaffMemberDTO } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';

type RangePreset = 'TODAY' | 'WEEK' | 'CUSTOM';
type RiskSeverity = 'high' | 'medium' | 'low';

export type RiskFiltersProps = {
  rangePreset: RangePreset;
  staffCode: string;
  search: string;
  severity: 'ALL' | RiskSeverity;
  fromDate: string;
  toDate: string;
  staff: StaffMemberDTO[];
  onRangePresetChange: (preset: RangePreset) => void;
  onStaffCodeChange: (code: string) => void;
  onSearchChange: (search: string) => void;
  onSeverityChange: (severity: 'ALL' | RiskSeverity) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onReset: () => void;
};

function currentDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function minusDaysInputValue(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function RiskFilters({
  rangePreset,
  staffCode,
  search,
  severity,
  fromDate,
  toDate,
  staff,
  onRangePresetChange,
  onStaffCodeChange,
  onSearchChange,
  onSeverityChange,
  onFromDateChange,
  onToDateChange,
  onReset,
}: RiskFiltersProps) {
  const { t, roleLabel } = useI18n();

  return (
    <section className="panel mt-6 rounded-[30px] border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-950">{t('employeeRisk.filterTitle')}</h3>
          <p className="text-sm text-slate-500">{t('employeeRisk.filterSubtitle')}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onReset}>
          <CalendarRange size={16} />
          <span>{t('employeeRisk.resetFilters')}</span>
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-6 flex flex-wrap gap-2">
          <button
            type="button"
            className={`ghost-btn small ${rangePreset === 'TODAY' ? 'active' : ''}`}
            onClick={() => {
              onRangePresetChange('TODAY');
              onFromDateChange(currentDateInputValue());
              onToDateChange(currentDateInputValue());
            }}
          >
            {t('employeeRisk.rangeToday')}
          </button>
          <button
            type="button"
            className={`ghost-btn small ${rangePreset === 'WEEK' ? 'active' : ''}`}
            onClick={() => {
              onRangePresetChange('WEEK');
              onFromDateChange(minusDaysInputValue(6));
              onToDateChange(currentDateInputValue());
            }}
          >
            {t('employeeRisk.rangeWeek')}
          </button>
          <button
            type="button"
            className={`ghost-btn small ${rangePreset === 'CUSTOM' ? 'active' : ''}`}
            onClick={() => onRangePresetChange('CUSTOM')}
          >
            {t('employeeRisk.rangeCustom')}
          </button>
        </div>

        <select
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          value={staffCode}
          onChange={(event) => onStaffCodeChange(event.target.value)}
        >
          <option value="">{t('employeeRisk.allStaff')}</option>
          {staff.map((member) => (
            <option key={member.id} value={member.staffCode ?? ''}>
              {member.name} - {roleLabel(member.role)}
            </option>
          ))}
        </select>

        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('employeeRisk.searchPlaceholder')}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <select
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          value={severity}
          onChange={(event) => onSeverityChange(event.target.value as 'ALL' | RiskSeverity)}
        >
          <option value="ALL">{t('employeeRisk.allSeverities')}</option>
          <option value="high">{t('employeeRisk.severityHigh')}</option>
          <option value="medium">{t('employeeRisk.severityMedium')}</option>
          <option value="low">{t('employeeRisk.severityLow')}</option>
        </select>

        <input
          type="date"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          value={fromDate}
          onChange={(event) => {
            onRangePresetChange('CUSTOM');
            onFromDateChange(event.target.value);
          }}
        />

        <input
          type="date"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          value={toDate}
          onChange={(event) => {
            onRangePresetChange('CUSTOM');
            onToDateChange(event.target.value);
          }}
        />
      </div>
    </section>
  );
}
