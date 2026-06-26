'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Play, Plus, RefreshCw } from 'lucide-react';
import type { PrinterConfigDTO, PrinterStatus, PrinterType, PrintJobDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import {
  createPrinter,
  listPrinterHistory,
  listPrinters,
  testPrinter,
} from '@/services/printers.service';

export function PrintersScreen() {
  const { t, formatDateTime, printerTypeLabel, statusLabel } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [printers, setPrinters] = useState<PrinterConfigDTO[]>([]);
  const [history, setHistory] = useState<PrintJobDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: '',
    ipAddress: '',
    port: '9100',
    type: 'RECEIPT' as PrinterType,
    status: 'ONLINE' as PrinterStatus,
  });

  async function load() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setPrinters([]);
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [printersData, historyData] = await Promise.all([
        listPrinters(activeRestaurantId),
        listPrinterHistory(activeRestaurantId),
      ]);
      setPrinters(printersData);
      setHistory(historyData);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('printers.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [restaurantId]);

  async function handleCreate() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setError(t('printers.title'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createPrinter({
        restaurantId: activeRestaurantId,
        name: draft.name,
        ipAddress: draft.ipAddress,
        port: Number(draft.port),
        type: draft.type,
        status: draft.status,
      });
      setDraft({ name: '', ipAddress: '', port: '9100', type: 'RECEIPT', status: 'ONLINE' });
      await load();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('printers.add')));
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(printer: PrinterConfigDTO) {
    try {
      setError(null);
      await testPrinter(printer.name);
      await load();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('printers.test')));
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('printers.title')}</h2>
          <p>{t('printers.subtitle')}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => void load()}>
          <RefreshCw size={16} />
          <span>{t('menu.refresh')}</span>
        </button>
      </section>

      {error ? (
        <div className="panel error-banner flex items-center gap-2 mt-4 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="panel mt-4">
        <div className="panel-header">
          <div>
            <h3>{t('printers.add')}</h3>
            <p>{t('printers.createDescription')}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 mt-4">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('printers.name')}
            value={draft.name}
            onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('printers.ipAddress')}
            value={draft.ipAddress}
            onChange={(e) => setDraft((s) => ({ ...s, ipAddress: e.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('printers.port')}
            value={draft.port}
            onChange={(e) => setDraft((s) => ({ ...s, port: e.target.value }))}
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={draft.type}
            onChange={(e) => setDraft((s) => ({ ...s, type: e.target.value as PrinterType }))}
          >
            <option value="RECEIPT">{printerTypeLabel('RECEIPT')}</option>
            <option value="KITCHEN">{printerTypeLabel('KITCHEN')}</option>
            <option value="BAR">{printerTypeLabel('BAR')}</option>
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={draft.status}
            onChange={(e) => setDraft((s) => ({ ...s, status: e.target.value as PrinterStatus }))}
          >
            <option value="ONLINE">{statusLabel('ONLINE')}</option>
            <option value="OFFLINE">{statusLabel('OFFLINE')}</option>
            <option value="LOW_PAPER">{statusLabel('LOW_PAPER')}</option>
          </select>
        </div>
        <button
          type="button"
          className="primary-btn mt-4"
          disabled={saving}
          onClick={() => void handleCreate()}
        >
          <Plus size={16} />
          <span>{saving ? t('common.saving') : t('printers.register')}</span>
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>{t('printers.registered')}</h3>
              <p>{t('printers.liveRecords')}</p>
            </div>
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-400">{t('printers.loading')}</div>
          ) : (
            <div className="space-y-3 mt-4">
              {printers.map((printer) => (
                <div key={printer.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <strong className="block text-slate-800">{printer.name}</strong>
                      <span className="text-xs text-slate-500">
                        {printer.ipAddress}:{printer.port} / {printerTypeLabel(printer.type)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="ghost-btn small"
                      onClick={() => void handleTest(printer)}
                    >
                      <Play size={14} />
                      <span>{t('printers.test')}</span>
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {t('printers.status')}: {statusLabel(printer.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>{t('printers.history')}</h3>
              <p>{t('printers.latestJobs')}</p>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            {history.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-100 p-4">
                <strong className="block text-slate-800">{job.printerName}</strong>
                <span className="text-xs text-slate-500">
                  {printerTypeLabel(job.type)} / {statusLabel(job.status)}
                </span>
                <div className="mt-2 text-xs text-slate-500">{formatDateTime(job.createdAt)}</div>
                {job.errorMessage ? (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {job.errorMessage}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
