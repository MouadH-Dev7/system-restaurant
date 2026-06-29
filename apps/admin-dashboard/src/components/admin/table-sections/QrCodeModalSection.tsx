'use client';

import { X, Download, Printer } from 'lucide-react';
import type { TableDTO } from '@repo/shared-types';
import { useI18n } from '@/hooks/use-i18n';

type QrCodeModalSectionProps = {
  table: TableDTO | null;
  floorName: string;
  onDownload: (table: TableDTO) => void;
  onPrint: (table: TableDTO) => void;
  onClose: () => void;
};

export function QrCodeModalSection({
  table,
  floorName,
  onDownload,
  onPrint,
  onClose,
}: QrCodeModalSectionProps) {
  const { t } = useI18n();

  if (!table) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card qr-modal">
        <div className="modal-head">
          <div>
            <h3>{t('tables.qrPreview')}</h3>
            <p>
              {t('tables.table')} {table.number} - {floorName}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="qr-modal-body">
          <img
            src={table.qrCodeUrl}
            alt={`QR ${t('tables.table')} ${table.number}`}
            className="qr-modal-image"
          />
          <strong>{t('tables.scanToOrder')}</strong>
          <a className="qr-url" href={table.qrPayload} target="_blank" rel="noreferrer">
            {table.qrPayload}
          </a>
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={() => onDownload(table)}>
            <Download size={14} />
            <span>{t('tables.downloadPng')}</span>
          </button>
          <button type="button" className="primary-btn" onClick={() => onPrint(table)}>
            <Printer size={14} />
            <span>{t('tables.printA4')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
