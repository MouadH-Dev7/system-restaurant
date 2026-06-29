'use client';

import { useI18n } from '@/hooks/use-i18n';
import { FormSection, TextField } from './staff-form-primitives';

export type StaffFormPersonalValues = {
  name: string;
  phone: string;
  nationalId: string;
  birthDate: string;
  hireDate: string;
  address: string;
};

export type StaffFormPersonalProps = {
  values: StaffFormPersonalValues;
  onChange: <K extends keyof StaffFormPersonalValues>(field: K, value: StaffFormPersonalValues[K]) => void;
};

export function StaffFormPersonal({ values, onChange }: StaffFormPersonalProps) {
  const { t } = useI18n();

  return (
    <FormSection title={t('staff.personalInfo')} description={t('staff.personalInfoDescription')}>
      <TextField
        label={t('staff.fullName')}
        value={values.name}
        onChange={(value) => onChange('name', value)}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={t('staff.phone')}
          value={values.phone}
          onChange={(value) => onChange('phone', value)}
        />
        <TextField
          label={t('staff.nationalId')}
          value={values.nationalId}
          onChange={(value) => onChange('nationalId', value)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={t('staff.birthDate')}
          type="date"
          value={values.birthDate}
          onChange={(value) => onChange('birthDate', value)}
        />
        <TextField
          label={t('staff.hireDate')}
          type="date"
          value={values.hireDate}
          onChange={(value) => onChange('hireDate', value)}
        />
      </div>
      <TextField
        label={t('staff.address')}
        value={values.address}
        onChange={(value) => onChange('address', value)}
      />
    </FormSection>
  );
}
