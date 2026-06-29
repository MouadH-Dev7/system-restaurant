'use client';

import { useI18n } from '@/hooks/use-i18n';
import { FormSection, SelectField, TextField } from './staff-form-primitives';

type SalaryType = 'MONTHLY' | 'DAILY';

export type StaffFormPayrollValues = {
  salaryType: SalaryType;
  salaryAmount: string;
};

export type StaffFormPayrollProps = {
  values: StaffFormPayrollValues;
  onChange: <K extends keyof StaffFormPayrollValues>(field: K, value: StaffFormPayrollValues[K]) => void;
};

function SalaryOptions(value: SalaryType, onChange: (value: SalaryType) => void, t: ReturnType<typeof useI18n>['t']) {
  return (
    <SelectField label={t('staff.salaryType')} value={value} onChange={(next) => onChange(next as SalaryType)}>
      <option value="MONTHLY">{t('staff.salaryMonthly')}</option>
      <option value="DAILY">{t('staff.salaryDaily')}</option>
    </SelectField>
  );
}

export function StaffFormPayroll({ values, onChange }: StaffFormPayrollProps) {
  const { t } = useI18n();

  return (
    <FormSection title={t('staff.payroll')} description={t('staff.payrollDescription')}>
      <div className="grid gap-4 md:grid-cols-2">
        {SalaryOptions(values.salaryType, (value) => onChange('salaryType', value), t)}
        <TextField
          label={t('staff.salaryAmount')}
          type="number"
          value={values.salaryAmount}
          onChange={(value) => onChange('salaryAmount', value)}
        />
      </div>
    </FormSection>
  );
}
