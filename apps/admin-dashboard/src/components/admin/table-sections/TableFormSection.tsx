'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { X } from 'lucide-react';
import type { FloorDTO, TableDTO } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';
import type { TableFormState } from './table-types';
import { initialTableForm } from './table-types';

type TableFormSectionProps = {
  saving: boolean;
  floors: FloorDTO[];
  onSaveTable: (form: TableFormState, editing: TableDTO | null) => Promise<void>;
};

export type TableFormSectionHandle = {
  openCreateTableModal: (floorId?: string) => void;
  openEditTableModal: (table: TableDTO) => void;
};

export const TableFormSection = forwardRef<TableFormSectionHandle, TableFormSectionProps>(function TableFormSection(
  {
    saving,
    floors,
    onSaveTable,
  }: TableFormSectionProps,
  ref,
) {
  const { t, statusLabel } = useI18n();
  const [tableForm, setTableForm] = useState<TableFormState>(initialTableForm);
  const [editingTable, setEditingTable] = useState<TableDTO | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);

  function openCreateTableModal(floorId?: string) {
    setEditingTable(null);
    setTableForm({ ...initialTableForm, floorId: floorId ?? floors[0]?.id ?? '' });
    setShowTableModal(true);
  }

  function openEditTableModal(table: TableDTO) {
    setEditingTable(table);
    setTableForm({
      number: String(table.number),
      capacity: String(table.capacity),
      status: table.status,
      floorId: table.floorId ?? '',
      shape: table.shape ?? 'round',
    });
    setShowTableModal(true);
  }

  function closeTableModal() {
    if (saving) {
      return;
    }
    setShowTableModal(false);
    setEditingTable(null);
    setTableForm(initialTableForm);
  }

  useImperativeHandle(ref, () => ({
    openCreateTableModal,
    openEditTableModal,
  }), []);

  return showTableModal ? (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <h3>
              {editingTable
                ? `${t('tables.editTitle')} ${editingTable.number}`
                : t('tables.createTitle')}
            </h3>
            <p>{editingTable ? t('tables.editDescription') : t('tables.createDescription')}</p>
          </div>
          <button type="button" className="icon-btn" onClick={closeTableModal}>
            <X size={16} />
          </button>
        </div>

        <div className="form-stack">
          <select
            value={tableForm.floorId}
            onChange={(event) => setTableForm((current) => ({ ...current, floorId: event.target.value }))}
          >
            <option value="">Select floor</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder={t('tables.number')}
            value={tableForm.number}
            onChange={(event) =>
              setTableForm((current) => ({ ...current, number: event.target.value }))
            }
          />
          <input
            type="number"
            placeholder={t('tables.capacity')}
            value={tableForm.capacity}
            onChange={(event) =>
              setTableForm((current) => ({ ...current, capacity: event.target.value }))
            }
          />
          <select
            value={tableForm.shape}
            onChange={(event) =>
              setTableForm((current) => ({
                ...current,
                shape: event.target.value as 'round' | 'square',
              }))
            }
          >
            <option value="round">Round</option>
            <option value="square">Square</option>
          </select>
          <select
            value={tableForm.status}
            onChange={(event) =>
              setTableForm((current) => ({ ...current, status: event.target.value as 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' }))
            }
          >
            <option value="AVAILABLE">{statusLabel('AVAILABLE')}</option>
            <option value="OCCUPIED">{statusLabel('OCCUPIED')}</option>
            <option value="RESERVED">{statusLabel('RESERVED')}</option>
          </select>

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={closeTableModal}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={async () => {
                await onSaveTable(tableForm, editingTable);
                closeTableModal();
              }}
              disabled={saving}
            >
              <span>
                {saving
                  ? t('common.saving')
                  : editingTable
                    ? t('tables.editTitle')
                    : t('tables.createTable')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
});
