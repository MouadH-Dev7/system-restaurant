'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Database, Layers, Radio, RefreshCw, Server, ShieldCheck, Terminal } from 'lucide-react';
import type {
  AuditLogDTO,
  OrdersSummaryDTO,
  PrinterConfigDTO,
  PrintJobDTO,
} from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { getOrdersSummary } from '@/services/analytics.service';
import { listLogs } from '@/services/logs.service';
import { listPrinterHistory, listPrinters } from '@/services/printers.service';
import { getSystemHealth, type SystemHealthResponse } from '@/services/system.service';

type TerminalLine = {
  id: string;
  time: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
};

function toTerminalType(status: AuditLogDTO['status']): TerminalLine['type'] {
  if (status === 'SUCCESS') return 'SUCCESS';
  if (status === 'WARNING') return 'WARNING';
  return 'ERROR';
}

export function MonitoringScreen() {
  const { t, formatDateTime, formatNumber, statusLabel } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [printers, setPrinters] = useState<PrinterConfigDTO[]>([]);
  const [history, setHistory] = useState<PrintJobDTO[]>([]);
  const [summary, setSummary] = useState<OrdersSummaryDTO | null>(null);
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  useEffect(() => {
    void load(true);
    const interval = window.setInterval(() => {
      void load(false);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [restaurantId]);

  async function load(showLoader: boolean) {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setLogs([]);
      setPrinters([]);
      setHistory([]);
      setSummary(null);
      setHealth(null);
      setLoading(false);
      setRefreshing(false);
      setLastCheckTime('');
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const [logsResult, nextPrinters, nextHistory, nextSummary, nextHealth] = await Promise.all([
        listLogs(activeRestaurantId),
        listPrinters(activeRestaurantId),
        listPrinterHistory(activeRestaurantId),
        getOrdersSummary(activeRestaurantId),
        getSystemHealth(),
      ]);

      setLogs(logsResult.data);
      setPrinters(nextPrinters);
      setHistory(nextHistory);
      setSummary(nextSummary);
      setHealth(nextHealth);
      setLastCheckTime(nextHealth.checkedAt);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('monitoring.title')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const terminalLines = useMemo<TerminalLine[]>(() => {
    return logs.slice(0, 10).map((log) => ({
      id: log.id,
      time: new Date(log.createdAt).toLocaleTimeString('en-GB', { hour12: false }),
      type: toTerminalType(log.status),
      message: `[${log.module}] ${log.action}`,
    }));
  }, [logs]);

  const printerWarnings = printers.filter((printer) => printer.status !== 'ONLINE');
  const failedPrints = history.filter((job) => job.status === 'FAILED').length;
  const completedPrints = history.filter((job) => job.status === 'COMPLETED').length;
  const warningLogs = logs.filter((log) => log.status === 'WARNING');
  const failedLogs = logs.filter((log) => log.status === 'FAILED');
  const totalActiveOrders =
    (summary?.pending ?? 0) + (summary?.preparing ?? 0) + (summary?.ready ?? 0);
  const services = [
    {
      key: 'api',
      title: t('monitoring.nestGateway'),
      subtitle: 'Admin API',
      status: health?.api.status === 'online' ? t('monitoring.active') : statusLabel('WARNING'),
      valueA: `${formatNumber(health?.api.latencyMs ?? 0)} ms`,
      labelA: t('monitoring.latency'),
      valueB: `${formatNumber(health?.api.memoryMb ?? 0)} MB`,
      labelB: t('monitoring.ramUsage'),
    },
    {
      key: 'database',
      title: t('monitoring.prismaPostgres'),
      subtitle: 'Audit + Orders',
      status: health?.database.status === 'online' ? t('monitoring.active') : statusLabel('WARNING'),
      valueA: health?.database.status === 'online' ? t('monitoring.active') : t('status.offline'),
      labelA: t('monitoring.connections'),
      valueB: `${formatNumber(totalActiveOrders)}`,
      labelB: t('orders.kitchenLoad'),
    },
    {
      key: 'redis',
      title: t('monitoring.redisMemory'),
      subtitle: 'Printer Queue',
      status: health?.redis.status === 'online' ? t('monitoring.active') : statusLabel('WARNING'),
      valueA: `${formatNumber(completedPrints)}`,
      labelA: t('printers.history'),
      valueB: `${formatNumber(failedPrints)}`,
      labelB: statusLabel('FAILED'),
    },
    {
      key: 'ws',
      title: 'WebSockets',
      subtitle: 'Realtime Orders',
      status: health?.realtime.status === 'online' ? t('monitoring.connected') : statusLabel('WARNING'),
      valueA: `${formatNumber(health?.realtime.connectedClients ?? 0)}`,
      labelA: t('monitoring.clientsOnline'),
      valueB: `${formatNumber(summary?.ready ?? 0)}`,
      labelB: statusLabel('READY'),
    },
  ];

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('monitoring.title')}</h2>
          <p>{t('monitoring.subtitle')}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => void load(false)} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? t('common.loading') : t('orders.refresh')}</span>
        </button>
      </section>

      {error ? <div className="panel error-banner mt-4">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {services.map((service) => (
          <div key={service.key} className="panel bg-white border border-slate-200 space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100">
                  {service.key === 'api' ? <Server size={18} /> : service.key === 'database' ? <Database size={18} /> : service.key === 'redis' ? <Layers size={18} /> : <Radio size={18} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{service.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{service.subtitle}</span>
                </div>
              </div>
              <span className="badge bg-emerald-50 text-emerald-700 font-black border border-emerald-100 text-[10px]">
                {service.status}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-500">
              <span>{service.labelA}</span>
              <strong className="text-slate-800 font-extrabold">{service.valueA}</strong>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>{service.labelB}</span>
              <strong className="text-slate-800 font-extrabold">{service.valueB}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="panel space-y-4 mt-6 bg-slate-900 border-slate-800 text-slate-300 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Terminal size={15} className="text-emerald-500" /> {t('monitoring.heartbeatConsole')}
          </h3>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
            <span>
              {t('monitoring.lastDiagnostics')}: <span className="text-slate-300">{lastCheckTime ? formatDateTime(lastCheckTime) : '-'}</span>
            </span>
          </div>
        </div>

        <div className="font-mono text-[10.5px] leading-relaxed space-y-1.5 max-h-[250px] overflow-y-auto pr-2 min-h-[140px] select-text">
          {loading && terminalLines.length === 0 ? (
            <div className="text-center py-10 text-slate-600 font-sans text-xs">{t('common.loading')}</div>
          ) : terminalLines.length === 0 ? (
            <div className="text-center py-10 text-slate-600 font-sans text-xs">{t('monitoring.emptyTerminal')}</div>
          ) : (
            terminalLines.map((log) => {
              let logColorClass = 'text-slate-400';
              if (log.type === 'SUCCESS') logColorClass = 'text-emerald-400 font-bold';
              else if (log.type === 'WARNING') logColorClass = 'text-amber-400 font-bold';
              else if (log.type === 'ERROR') logColorClass = 'text-rose-400 font-black';

              return (
                <div key={log.id} className="flex gap-2.5 items-start border-l border-slate-800 pl-3">
                  <span className="text-slate-600">[{log.time}]</span>
                  <span className={`uppercase font-bold w-14 shrink-0 ${logColorClass}`}>{log.type}</span>
                  <span className="text-slate-300 flex-1">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="panel space-y-4 mt-6 bg-white border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <Activity size={16} className="text-sky-600" /> {t('monitoring.criticalAlerts')}
        </h3>

        {printerWarnings.length > 0 ? (
          printerWarnings.map((printer) => (
            <div key={printer.id} className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="font-bold">{t('monitoring.hardwareAlert')}:</strong> {printer.name} - {statusLabel(printer.status)}
                <span className="text-[10px] text-slate-400 block mt-1 font-semibold">{printer.ipAddress}:{printer.port}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-bold">{t('monitoring.sslHealth')}:</strong> {t('monitoring.active')}
              <span className="text-[10px] text-slate-400 block mt-1 font-semibold">{formatNumber(printers.length)} {t('printers.registered')}</span>
            </div>
          </div>
        )}

        {warningLogs.length > 0 || failedLogs.length > 0 ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-bold">{t('notifications.title')}:</strong> {formatNumber(warningLogs.length + failedLogs.length)} {t('logs.title')}
              <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                {warningLogs[0] ? `${warningLogs[0].module} - ${warningLogs[0].action}` : failedLogs[0]?.action}
              </span>
            </div>
          </div>
        ) : null}
      </div>

    </>
  );
}
