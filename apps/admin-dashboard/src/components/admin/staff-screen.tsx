'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { CreateStaffInput, StaffMemberDTO, UpdateStaffInput, UserRole } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { useStaff } from '@/hooks/use-admin-queries';
import { createStaff, updateStaff } from '@/services/staff.service';
import { StaffFormPersonal, StaffFormSecurity, StaffFormPayroll } from './staff-sections';
import { TextField, TextAreaField, FormSection } from './staff-sections';

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

export function StaffScreen() {
  const { t, formatCurrency, formatDateTime, formatNumber, roleLabel } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const queryClient = useQueryClient();
  const { data: staff = [], isLoading: loading, error: fetchError } = useStaff();
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<StaffDraft>(emptyDraft);
  const [editDraft, setEditDraft] = useState<StaffDraft>(emptyDraft);

  const error = fetchError ? (fetchError as Error).message : apiError;

  const selectedStaff = useMemo(
    () => staff.find((member) => member.id === selectedStaffId) ?? null,
    [selectedStaffId, staff],
  );

  useEffect(() => {
    setEditDraft(toDraft(selectedStaff));
  }, [selectedStaff]);

  useEffect(() => {
    if (staff.length > 0) {
      setSelectedStaffId((current) =>
        current && staff.some((member) => member.id === current)
          ? current
          : staff[0]!.id,
      );
    }
  }, [staff]);

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

  async function invalidateAndSync(createdId?: string) {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'staff', restaurantId] });
    if (createdId) {
      setSelectedStaffId(createdId);
    }
  }

  async function handleCreate() {
    if (!restaurantId) {
      setApiError(t('staff.title'));
      return;
    }

    if (!createDraft.name.trim() || !createDraft.staffCode.trim() || !createDraft.password.trim()) {
      setApiError(t('staff.requiredFields'));
      return;
    }

    try {
      setSavingCreate(true);
      setApiError(null);
      const created = await createStaff(buildCreatePayload(restaurantId, createDraft));
      setCreateDraft(emptyDraft());
      await invalidateAndSync(created.id);
    } catch (nextError) {
      setApiError(getApiErrorMessage(nextError, t('staff.add')));
    } finally {
      setSavingCreate(false);
    }
  }

  async function handleSaveSelected() {
    if (!selectedStaff) {
      return;
    }

    if (!editDraft.name.trim() || !editDraft.staffCode.trim()) {
      setApiError(t('staff.requiredFields'));
      return;
    }

    try {
      setSavingEdit(true);
      setApiError(null);
      await updateStaff(selectedStaff.id, buildUpdatePayload(editDraft));
      await invalidateAndSync();
    } catch (nextError) {
      setApiError(getApiErrorMessage(nextError, t('staff.editAccount')));
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <h2>{t('staff.title')}</h2>
          <p>{t('staff.subtitle')}</p>
        </div>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['admin', 'staff', restaurantId] })}
        >
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

          <StaffFormPersonal
            values={{
              name: createDraft.name,
              phone: createDraft.phone,
              nationalId: createDraft.nationalId,
              birthDate: createDraft.birthDate,
              hireDate: createDraft.hireDate,
              address: createDraft.address,
            }}
            onChange={(field, value) =>
              setCreateDraft((current) => ({ ...current, [field]: value }))
            }
          />
          <StaffFormSecurity
            values={{
              staffCode: createDraft.staffCode,
              role: createDraft.role,
              password: createDraft.password,
              isActive: createDraft.isActive,
            }}
            onChange={(field, value) =>
              setCreateDraft((current) => ({ ...current, [field]: value }))
            }
          />
          <StaffFormPayroll
            values={{
              salaryType: createDraft.salaryType,
              salaryAmount: createDraft.salaryAmount,
            }}
            onChange={(field, value) =>
              setCreateDraft((current) => ({ ...current, [field]: value }))
            }
          />

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
                <StaffFormPersonal
                  values={{
                    name: editDraft.name,
                    phone: editDraft.phone,
                    nationalId: editDraft.nationalId,
                    birthDate: editDraft.birthDate,
                    hireDate: editDraft.hireDate,
                    address: editDraft.address,
                  }}
                  onChange={(field, value) =>
                    setEditDraft((current) => ({ ...current, [field]: value }))
                  }
                />
                <StaffFormSecurity
                  isEdit
                  values={{
                    staffCode: editDraft.staffCode,
                    role: editDraft.role,
                    password: editDraft.password,
                    isActive: editDraft.isActive,
                  }}
                  onChange={(field, value) =>
                    setEditDraft((current) => ({ ...current, [field]: value }))
                  }
                />
                <StaffFormPayroll
                  values={{
                    salaryType: editDraft.salaryType,
                    salaryAmount: editDraft.salaryAmount,
                  }}
                  onChange={(field, value) =>
                    setEditDraft((current) => ({ ...current, [field]: value }))
                  }
                />

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
