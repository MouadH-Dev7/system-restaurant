'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, Plus, RefreshCw, Save } from 'lucide-react';
import type { CreateStaffInput, StaffMemberDTO, UpdateStaffInput, UserRole } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { createStaff, listStaff, updateStaff } from '@/services/staff.service';

type SalaryType = 'MONTHLY' | 'DAILY';

type StaffDraft = {
  name: string;
  password: string;
  role: UserRole;
  phone: string;
  nationalId: string;
  birthDate: string;
  hireDate: string;
  address: string;
  staffCode: string;
  salaryType: SalaryType;
  salaryAmount: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  isActive: boolean;
};

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#cf6d43] focus:ring-2 focus:ring-[#cf6d43]/10';

function emptyDraft(): StaffDraft {
  return {
    name: '',
    password: '',
    role: 'CASHIER',
    phone: '',
    nationalId: '',
    birthDate: '',
    hireDate: '',
    address: '',
    staffCode: '',
    salaryType: 'MONTHLY',
    salaryAmount: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
    isActive: true,
  };
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

function toDraft(member: StaffMemberDTO | null): StaffDraft {
  if (!member) {
    return emptyDraft();
  }

  return {
    name: member.name,
    password: '',
    role: member.role,
    phone: member.phone ?? '',
    nationalId: member.nationalId ?? '',
    birthDate: toDateInput(member.birthDate),
    hireDate: toDateInput(member.hireDate),
    address: member.address ?? '',
    staffCode: member.staffCode,
    salaryType: member.salaryType ?? 'MONTHLY',
    salaryAmount: member.salaryAmount != null ? String(member.salaryAmount) : '',
    emergencyContactName: member.emergencyContactName ?? '',
    emergencyContactPhone: member.emergencyContactPhone ?? '',
    notes: member.notes ?? '',
    isActive: member.isActive,
  };
}

function parseAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildCreatePayload(restaurantId: string, draft: StaffDraft): CreateStaffInput {
  return {
    restaurantId,
    name: draft.name,
    staffCode: draft.staffCode,
    password: draft.password,
    role: draft.role,
    phone: draft.phone || null,
    nationalId: draft.nationalId || null,
    birthDate: draft.birthDate || null,
    hireDate: draft.hireDate || null,
    address: draft.address || null,
    salaryType: draft.salaryType,
    salaryAmount: draft.salaryAmount ? parseAmount(draft.salaryAmount) : null,
    emergencyContactName: draft.emergencyContactName || null,
    emergencyContactPhone: draft.emergencyContactPhone || null,
    notes: draft.notes || null,
    isActive: draft.isActive,
  };
}

function buildUpdatePayload(draft: StaffDraft): UpdateStaffInput {
  return {
    name: draft.name,
    staffCode: draft.staffCode,
    password: draft.password || undefined,
    role: draft.role,
    phone: draft.phone || null,
    nationalId: draft.nationalId || null,
    birthDate: draft.birthDate || null,
    hireDate: draft.hireDate || null,
    address: draft.address || null,
    salaryType: draft.salaryType,
    salaryAmount: draft.salaryAmount ? parseAmount(draft.salaryAmount) : null,
    emergencyContactName: draft.emergencyContactName || null,
    emergencyContactPhone: draft.emergencyContactPhone || null,
    notes: draft.notes || null,
    isActive: draft.isActive,
  };
}

function TextField(props: {
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

function TextAreaField(props: {
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

function SelectField(props: {
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

function ToggleField(props: {
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

function FormSection(props: { title: string; description: string; children: ReactNode }) {
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

export function StaffScreen() {
  const { t, formatCurrency, formatDateTime, formatNumber, roleLabel } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [staff, setStaff] = useState<StaffMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<StaffDraft>(emptyDraft);
  const [editDraft, setEditDraft] = useState<StaffDraft>(emptyDraft);

  async function load() {
    if (!restaurantId) {
      setStaff([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const records = await listStaff(restaurantId);
      setStaff(records);
      setSelectedStaffId((current) =>
        current && records.some((member) => member.id === current) ? current : (records[0]?.id ?? null),
      );
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('staff.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [restaurantId]);

  const selectedStaff = useMemo(
    () => staff.find((member) => member.id === selectedStaffId) ?? null,
    [selectedStaffId, staff],
  );

  useEffect(() => {
    setEditDraft(toDraft(selectedStaff));
  }, [selectedStaff]);

  const stats = useMemo(
    () => ({
      total: staff.length,
      admins: staff.filter((member) => member.role === 'ADMIN').length,
      waiters: staff.filter((member) => member.role === 'WAITER').length,
      operations: staff.filter((member) => member.role === 'CHEF' || member.role === 'CASHIER').length,
      active: staff.filter((member) => member.isActive).length,
    }),
    [staff],
  );

  async function handleCreate() {
    if (!restaurantId) {
      setError(t('staff.title'));
      return;
    }

    if (!createDraft.name.trim() || !createDraft.staffCode.trim() || !createDraft.password.trim()) {
      setError(t('staff.requiredFields'));
      return;
    }

    try {
      setSavingCreate(true);
      setError(null);
      const created = await createStaff(buildCreatePayload(restaurantId, createDraft));
      setCreateDraft(emptyDraft());
      await load();
      setSelectedStaffId(created.id);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('staff.add')));
    } finally {
      setSavingCreate(false);
    }
  }

  async function handleSaveSelected() {
    if (!selectedStaff) {
      return;
    }

    if (!editDraft.name.trim() || !editDraft.staffCode.trim()) {
      setError(t('staff.requiredFields'));
      return;
    }

    try {
      setSavingEdit(true);
      setError(null);
      await updateStaff(selectedStaff.id, buildUpdatePayload(editDraft));
      await load();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('staff.editAccount')));
    } finally {
      setSavingEdit(false);
    }
  }

  function renderRoleOptions(value: UserRole, onChange: (value: UserRole) => void) {
    return (
      <SelectField label={t('common.role')} value={value} onChange={(next) => onChange(next as UserRole)}>
        <option value="ADMIN">{roleLabel('ADMIN')}</option>
        <option value="CHEF">{roleLabel('CHEF')}</option>
        <option value="CASHIER">{roleLabel('CASHIER')}</option>
        <option value="WAITER">{roleLabel('WAITER')}</option>
      </SelectField>
    );
  }

  function renderSalaryOptions(value: SalaryType, onChange: (value: SalaryType) => void) {
    return (
      <SelectField label={t('staff.salaryType')} value={value} onChange={(next) => onChange(next as SalaryType)}>
        <option value="MONTHLY">{t('staff.salaryMonthly')}</option>
        <option value="DAILY">{t('staff.salaryDaily')}</option>
      </SelectField>
    );
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <h2>{t('staff.title')}</h2>
          <p>{t('staff.subtitle')}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => void load()}>
          <RefreshCw size={16} />
          <span>{t('menu.refresh')}</span>
        </button>
      </section>

      {error ? (
        <div className="panel error-banner flex items-center gap-2 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-5">
        <div className="panel">
          <strong>{formatNumber(stats.total)}</strong>
          <p>{t('staff.total')}</p>
        </div>
        <div className="panel">
          <strong>{formatNumber(stats.active)}</strong>
          <p>{t('staff.activeMembers')}</p>
        </div>
        <div className="panel">
          <strong>{formatNumber(stats.admins)}</strong>
          <p>{t('staff.admins')}</p>
        </div>
        <div className="panel">
          <strong>{formatNumber(stats.waiters)}</strong>
          <p>{t('staff.waiters')}</p>
        </div>
        <div className="panel">
          <strong>{formatNumber(stats.operations)}</strong>
          <p>{t('staff.operations')}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="panel space-y-4">
          <div className="panel-header">
            <div>
              <h3>{t('staff.add')}</h3>
              <p>{t('staff.createDescription')}</p>
            </div>
          </div>

          <FormSection title={t('staff.personalInfo')} description={t('staff.personalInfoDescription')}>
            <TextField
              label={t('staff.fullName')}
              value={createDraft.name}
              onChange={(value) => setCreateDraft((current) => ({ ...current, name: value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label={t('staff.phone')}
                value={createDraft.phone}
                onChange={(value) => setCreateDraft((current) => ({ ...current, phone: value }))}
              />
              <TextField
                label={t('staff.nationalId')}
                value={createDraft.nationalId}
                onChange={(value) => setCreateDraft((current) => ({ ...current, nationalId: value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label={t('staff.birthDate')}
                type="date"
                value={createDraft.birthDate}
                onChange={(value) => setCreateDraft((current) => ({ ...current, birthDate: value }))}
              />
              <TextField
                label={t('staff.hireDate')}
                type="date"
                value={createDraft.hireDate}
                onChange={(value) => setCreateDraft((current) => ({ ...current, hireDate: value }))}
              />
            </div>
            <TextField
              label={t('staff.address')}
              value={createDraft.address}
              onChange={(value) => setCreateDraft((current) => ({ ...current, address: value }))}
            />
          </FormSection>

          <FormSection title={t('staff.securityAccess')} description={t('staff.securityAccessDescription')}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label={t('staff.staffCode')}
                value={createDraft.staffCode}
                onChange={(value) => setCreateDraft((current) => ({ ...current, staffCode: value }))}
              />
              {renderRoleOptions(createDraft.role, (value) =>
                setCreateDraft((current) => ({ ...current, role: value })),
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label={t('common.password')}
                type="password"
                value={createDraft.password}
                onChange={(value) => setCreateDraft((current) => ({ ...current, password: value }))}
              />
              <ToggleField
                label={t('staff.accountStatus')}
                checked={createDraft.isActive}
                hint={createDraft.isActive ? t('staff.active') : t('staff.inactive')}
                onChange={(checked) => setCreateDraft((current) => ({ ...current, isActive: checked }))}
              />
            </div>
          </FormSection>

          <FormSection title={t('staff.payroll')} description={t('staff.payrollDescription')}>
            <div className="grid gap-4 md:grid-cols-2">
              {renderSalaryOptions(createDraft.salaryType, (value) =>
                setCreateDraft((current) => ({ ...current, salaryType: value })),
              )}
              <TextField
                label={t('staff.salaryAmount')}
                type="number"
                value={createDraft.salaryAmount}
                onChange={(value) => setCreateDraft((current) => ({ ...current, salaryAmount: value }))}
              />
            </div>
          </FormSection>

          <FormSection title={t('staff.additionalInfo')} description={t('staff.additionalInfoDescription')}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label={t('staff.emergencyContactName')}
                value={createDraft.emergencyContactName}
                onChange={(value) =>
                  setCreateDraft((current) => ({ ...current, emergencyContactName: value }))
                }
              />
              <TextField
                label={t('staff.emergencyContactPhone')}
                value={createDraft.emergencyContactPhone}
                onChange={(value) =>
                  setCreateDraft((current) => ({ ...current, emergencyContactPhone: value }))
                }
              />
            </div>
            <TextAreaField
              label={t('staff.notes')}
              value={createDraft.notes}
              onChange={(value) => setCreateDraft((current) => ({ ...current, notes: value }))}
            />
          </FormSection>

          <button
            type="button"
            className="primary-btn"
            disabled={savingCreate}
            onClick={() => void handleCreate()}
          >
            <Plus size={16} />
            <span>{savingCreate ? t('common.creating') : t('staff.createAccount')}</span>
          </button>
        </div>

        <div className="space-y-6">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>{t('staff.accounts')}</h3>
                <p>{t('staff.liveRecords')}</p>
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-400">{t('staff.loading')}</div>
            ) : staff.length ? (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {staff.map((member) => {
                  const active = member.id === selectedStaffId;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`rounded-[28px] border p-4 text-left transition ${
                        active
                          ? 'border-[#cf6d43] bg-[#fff7f2] shadow-[0_20px_40px_rgba(207,109,67,0.12)]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedStaffId(member.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-slate-900">{member.name}</h4>
                          <p className="mt-1 text-sm text-slate-500">{roleLabel(member.role)}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            member.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.isActive ? t('staff.active') : t('staff.inactive')}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-600">
                        <p>{member.phone || member.staffCode}</p>
                        <p>{member.staffCode}</p>
                        <p>
                          {member.salaryAmount != null
                            ? `${formatCurrency(member.salaryAmount)} / ${
                                member.salaryType === 'DAILY'
                                  ? t('staff.salaryDaily')
                                  : t('staff.salaryMonthly')
                              }`
                            : t('staff.noSalaryDefined')}
                        </p>
                        <p>{formatDateTime(member.createdAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                {t('staff.noStaff')}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>{t('staff.editAccount')}</h3>
                <p>{t('staff.editDescription')}</p>
              </div>
            </div>

            {selectedStaff ? (
              <div className="mt-5 grid gap-4">
                <FormSection title={t('staff.personalInfo')} description={t('staff.personalInfoDescription')}>
                  <TextField
                    label={t('staff.fullName')}
                    value={editDraft.name}
                    onChange={(value) => setEditDraft((current) => ({ ...current, name: value }))}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label={t('staff.phone')}
                      value={editDraft.phone}
                      onChange={(value) => setEditDraft((current) => ({ ...current, phone: value }))}
                    />
                    <TextField
                      label={t('staff.nationalId')}
                      value={editDraft.nationalId}
                      onChange={(value) =>
                        setEditDraft((current) => ({ ...current, nationalId: value }))
                      }
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label={t('staff.birthDate')}
                      type="date"
                      value={editDraft.birthDate}
                      onChange={(value) => setEditDraft((current) => ({ ...current, birthDate: value }))}
                    />
                    <TextField
                      label={t('staff.hireDate')}
                      type="date"
                      value={editDraft.hireDate}
                      onChange={(value) => setEditDraft((current) => ({ ...current, hireDate: value }))}
                    />
                  </div>
                  <TextField
                    label={t('staff.address')}
                    value={editDraft.address}
                    onChange={(value) => setEditDraft((current) => ({ ...current, address: value }))}
                  />
                </FormSection>

                <FormSection title={t('staff.securityAccess')} description={t('staff.securityAccessDescription')}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label={t('staff.staffCode')}
                      value={editDraft.staffCode}
                      onChange={(value) => setEditDraft((current) => ({ ...current, staffCode: value }))}
                    />
                    {renderRoleOptions(editDraft.role, (value) =>
                      setEditDraft((current) => ({ ...current, role: value })),
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label={t('staff.newPassword')}
                      type="password"
                      value={editDraft.password}
                      onChange={(value) => setEditDraft((current) => ({ ...current, password: value }))}
                    />
                    <ToggleField
                      label={t('staff.accountStatus')}
                      checked={editDraft.isActive}
                      hint={editDraft.isActive ? t('staff.active') : t('staff.inactive')}
                      onChange={(checked) => setEditDraft((current) => ({ ...current, isActive: checked }))}
                    />
                  </div>
                </FormSection>

                <FormSection title={t('staff.payroll')} description={t('staff.payrollDescription')}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {renderSalaryOptions(editDraft.salaryType, (value) =>
                      setEditDraft((current) => ({ ...current, salaryType: value })),
                    )}
                    <TextField
                      label={t('staff.salaryAmount')}
                      type="number"
                      value={editDraft.salaryAmount}
                      onChange={(value) => setEditDraft((current) => ({ ...current, salaryAmount: value }))}
                    />
                  </div>
                </FormSection>

                <FormSection title={t('staff.additionalInfo')} description={t('staff.additionalInfoDescription')}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label={t('staff.emergencyContactName')}
                      value={editDraft.emergencyContactName}
                      onChange={(value) =>
                        setEditDraft((current) => ({ ...current, emergencyContactName: value }))
                      }
                    />
                    <TextField
                      label={t('staff.emergencyContactPhone')}
                      value={editDraft.emergencyContactPhone}
                      onChange={(value) =>
                        setEditDraft((current) => ({ ...current, emergencyContactPhone: value }))
                      }
                    />
                  </div>
                  <TextAreaField
                    label={t('staff.notes')}
                    value={editDraft.notes}
                    onChange={(value) => setEditDraft((current) => ({ ...current, notes: value }))}
                  />
                </FormSection>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={savingEdit}
                    onClick={() => void handleSaveSelected()}
                  >
                    <Save size={16} />
                    <span>{savingEdit ? t('common.saving') : t('staff.saveChanges')}</span>
                  </button>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {t('staff.lastUpdated')}: {formatDateTime(selectedStaff.updatedAt)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                {t('staff.selectStaffPrompt')}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
