'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Save, Wifi } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { STORAGE_KEYS } from '@/lib/constants';
import { getNetworkInfo, type NetworkInfoDTO } from '@/services/tables.service';

type QrMode = 'AUTO_IP' | 'AUTO_HOSTNAME' | 'CUSTOM';

function buildServiceUrl(host: string, port: number) {
  return `http://${host}:${port}`;
}

export function NetworksScreen() {
  const { t } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoDTO | null>(null);
  const [qrMode, setQrMode] = useState<QrMode>('AUTO_IP');
  const [customHost, setCustomHost] = useState('');
  const [previousLanIp, setPreviousLanIp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEYS.CUSTOMER_APP_HOST) ?? '';
    if (stored === 'AUTO_HOSTNAME') {
      setQrMode('AUTO_HOSTNAME');
      setCustomHost('');
    } else if (stored === 'AUTO_IP' || !stored) {
      setQrMode('AUTO_IP');
      setCustomHost('');
    } else {
      setQrMode('CUSTOM');
      setCustomHost(stored);
    }
  }, []);

  async function load() {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const clientHost = typeof window !== 'undefined' ? window.location.hostname : undefined;
      const previousLanIp = window.localStorage.getItem(STORAGE_KEYS.LAST_LAN_IP) ?? '';
      setPreviousLanIp(previousLanIp);
      const info = await getNetworkInfo(clientHost);
      setNetworkInfo(info);
      window.localStorage.setItem('restaurant:local-domain', info.localDomain);
      if (info.lanAddress?.trim()) {
        window.localStorage.setItem(STORAGE_KEYS.LAST_LAN_IP, info.lanAddress.trim());
      }
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('networks.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [restaurantId]);

  function handleSaveMode(nextMode: QrMode) {
    setQrMode(nextMode);

    if (nextMode === 'AUTO_IP') {
      window.localStorage.setItem(STORAGE_KEYS.CUSTOMER_APP_HOST, 'AUTO_IP');
      setCustomHost('');
      return;
    }

    if (nextMode === 'AUTO_HOSTNAME') {
      window.localStorage.setItem(STORAGE_KEYS.CUSTOMER_APP_HOST, 'AUTO_HOSTNAME');
      setCustomHost('');
      return;
    }

    const value = customHost.trim();
    if (value) {
      window.localStorage.setItem(STORAGE_KEYS.CUSTOMER_APP_HOST, value);
    }
  }

  function resolvedHost() {
    if (!networkInfo) {
      return '';
    }

    if (qrMode === 'AUTO_HOSTNAME') {
      return networkInfo.localDomain;
    }

    if (qrMode === 'CUSTOM' && customHost.trim()) {
      return customHost.trim();
    }

    return networkInfo.lanAddress ?? networkInfo.hostname;
  }

  const host = resolvedHost();
  const serviceLinks = host
    ? [
        { label: t('networks.appCustomer'), url: buildServiceUrl(host, 3001) },
        { label: t('networks.appPos'), url: buildServiceUrl(host, 3002) },
        { label: t('networks.appKitchen'), url: buildServiceUrl(host, 3003) },
        { label: t('networks.appAdmin'), url: buildServiceUrl(host, 3004) },
        { label: t('networks.appWaiter'), url: buildServiceUrl(host, 3005) },
        { label: t('networks.appBackend'), url: buildServiceUrl(host, 4000) },
      ]
    : [];

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('networks.title')}</h2>
          <p>{t('networks.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" className="ghost-btn" onClick={() => void load()}>
            <RefreshCw size={16} />
            <span>{t('networks.refresh')}</span>
          </button>
        </div>
      </section>

      {error ? <div className="panel error-banner mt-4">{error}</div> : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3 className="flex items-center gap-2">
                <Wifi size={18} />
                <span>{t('networks.infoTitle')}</span>
              </h3>
              <p>{t('networks.infoSubtitle')}</p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <h3>{t('networks.loading')}</h3>
            </div>
          ) : networkInfo ? (
            <div className="mt-4 space-y-3">
              <div className="summary-row">
                <span>{t('networks.serverIp')}</span>
                <strong className="font-mono">{networkInfo.lanAddress ?? t('networks.notFound')}</strong>
              </div>
              <div className="summary-row">
                <span>{t('networks.previousIp')}</span>
                <strong className="font-mono">{previousLanIp || t('networks.notFound')}</strong>
              </div>
              <div className="summary-row">
                <span>{t('networks.hostname')}</span>
                <strong className="font-mono">{networkInfo.hostname}</strong>
              </div>
              <div className="summary-row">
                <span>{t('networks.localDomain')}</span>
                <strong className="font-mono text-indigo-600">{networkInfo.localDomain}</strong>
              </div>

              <div className="summary-row flex-col items-start gap-2 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('networks.linkMode')}</span>
                <select
                  value={qrMode}
                  onChange={(event) => handleSaveMode(event.target.value as QrMode)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="AUTO_IP">{t('networks.autoIp')}</option>
                  <option value="AUTO_HOSTNAME">{t('networks.autoHostname')}</option>
                  <option value="CUSTOM">{t('networks.customMode')}</option>
                </select>
              </div>

              {qrMode === 'CUSTOM' ? (
                <div className="summary-row flex-col items-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('networks.customHost')}</span>
                  <div className="flex w-full gap-2">
                    <input
                      type="text"
                      value={customHost}
                      onChange={(event) => setCustomHost(event.target.value)}
                      placeholder="192.168.1.100"
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    />
                    <button type="button" className="primary-btn" onClick={() => handleSaveMode('CUSTOM')}>
                      <Save size={16} />
                      <span>{t('settings.save')}</span>
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="summary-row">
                <span>{t('networks.resolvedHost')}</span>
                <strong className="font-mono text-emerald-700">{host || '-'}</strong>
              </div>
            </div>
          ) : null}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>{t('networks.linksTitle')}</h3>
              <p>{t('networks.linksSubtitle')}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {serviceLinks.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <strong className="text-slate-900">{item.label}</strong>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm text-indigo-700 underline"
                  >
                    {item.url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
