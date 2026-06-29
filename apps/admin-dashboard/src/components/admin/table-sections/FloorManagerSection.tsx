'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { X } from 'lucide-react';
import type { FloorDTO } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';
import type { FloorFormState } from './table-types';
import { initialFloorForm } from './table-types';

type FloorManagerSectionProps = {
  saving: boolean;
  onSaveFloor: (draft: FloorFormState, editing: FloorDTO | null) => void;
  onDeleteFloor: (floor: FloorDTO) => void;
};

export type FloorManagerSectionHandle = {
  openCreateFloorModal: () => void;
  openEditFloorModal: (floor: FloorDTO) => void;
};

export const FloorManagerSection = forwardRef<FloorManagerSectionHandle, FloorManagerSectionProps>(function FloorManagerSection(
  {
    saving,
    onSaveFloor,
  }: FloorManagerSectionProps,
  ref,
) {
  const { t } = useI18n();
  const [floorForm, setFloorForm] = useState<FloorFormState>(initialFloorForm);
  const [editingFloor, setEditingFloor] = useState<FloorDTO | null>(null);
  const [showFloorModal, setShowFloorModal] = useState(false);

  function openCreateFloorModal() {
    setEditingFloor(null);
    setFloorForm(initialFloorForm);
    setShowFloorModal(true);
  }

  function openEditFloorModal(floor: FloorDTO) {
    setEditingFloor(floor);
    setFloorForm({ name: floor.name });
    setShowFloorModal(true);
  }

  function closeFloorModal() {
    if (saving) {
      return;
    }
    setShowFloorModal(false);
    setEditingFloor(null);
    setFloorForm(initialFloorForm);
  }

  useImperativeHandle(ref, () => ({
    openCreateFloorModal,
    openEditFloorModal,
  }), []);

  return showFloorModal ? (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <h3>{editingFloor ? t('tables.editTitle') : t('tables.createTitle')}</h3>
            <p>{editingFloor ? 'Rename this floor.' : 'Create a floor before adding its tables.'}</p>
          </div>
          <button type="button" className="icon-btn" onClick={closeFloorModal}>
            <X size={16} />
          </button>
        </div>

        <div className="form-stack">
          <input
            type="text"
            placeholder="Floor name"
            value={floorForm.name}
            onChange={(event) => setFloorForm({ name: event.target.value })}
          />

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={closeFloorModal}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={async () => {
                await onSaveFloor(floorForm, editingFloor);
                closeFloorModal();
              }}
              disabled={saving}
            >
              <span>{saving ? t('common.saving') : editingFloor ? t('tables.edit') : 'Create Floor'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
});
