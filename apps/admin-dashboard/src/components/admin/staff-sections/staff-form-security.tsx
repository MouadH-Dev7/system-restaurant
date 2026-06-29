'use client';

import type { UserRole } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';
import { FormSection, SelectField, TextField, ToggleField } from './staff-form-primitives';

export type StaffFormSecurityValues = {
  staffCode: string;
  role: UserRole;
  password: string;
  isActive: boolean;
};

export type StaffFormSecurityProps = {
  values: StaffFormSecurityValues;
  onChange: <K extends keyof StaffFormSecurityValues>(field: K, value: StaffFormSecurityValues[K]) => void;
  isEdit?: boolean;
};

function RoleOptions(value: UserRole, onChange: (value: UserRole) => void, t: ReturnType<typeof useI18n>['t'], roleLabel: ReturnType<typeof useI18n>['roleLabel']) {
  return (
    <SelectField label={t('common.role')} value={value} onChange={(next) => onChange(next as UserRole)}>
      <option value="ADMIN">{roleLabel('ADMIN')}</option>
      <option value="CHEF">{roleLabel('CHEF')}</option>
      <option value="CASHIER">{roleLabel('CASHIER')}</option>
      <option value="WAITER">{roleLabel('WAITER')}</option>
    </SelectField>
  );
}

export function StaffFormSecurity({ values, onChange, isEdit }: StaffFormSecurityProps) {
  const { t, roleLabel } = useI18n();

  return (
    <FormSection title={t('staff.securityAccess')} description={t('staff.securityAccessDescription')}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={t('staff.staffCode')}
          value={values.staffCode}
          onChange={(value) => onChange('staffCode', value)}
        />
        {RoleOptions(values.role, (value) => onChange('role', value), t, roleLabel)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={isEdit ? t('staff.newPassword') : t('common.password')}
          type="password"
          value={values.password}
          onChange={(value) => onChange('password', value)}
        />
        <ToggleField
          label={t('staff.accountStatus')}
          checked={values.isActive}
          hint={values.isActive ? t('staff.active') : t('staff.inactive')}
          onChange={(checked) => onChange('isActive', checked)}
        />
      </div>
    </FormSection>
  );
}
