'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save, Wifi } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import { getNetworkInfo, type NetworkInfoDTO } from '@/services/tables.service';

const CUSTOMER_APP_HOST_KEY = 'restaurant:customer-app-host';
const LAST_LAN_IP_KEY = 'restaurant:last-lan-ip';

type QrMode = 'AUTO_IP' | 'AUTO_HOSTNAME' | 'CUSTOM';

function buildServiceUrl(host: string, port: number) {
  return `http://${host}:${port}`;
}

export function NetworksScreen() {
  const { language } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoDTO | null>(null);
  const [qrMode, setQrMode] = useState<QrMode>('AUTO_IP');
  const [customHost, setCustomHost] = useState('');
  const [previousLanIp, setPreviousLanIp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const copy = useMemo(
    () => ({
      title: language === 'ar' ? 'إعدادات الشبكة' : language === 'fr' ? 'Parametres reseau' : 'Network Settings',
      subtitle:
        language === 'ar'
          ? 'إدارة روابط الشبكة المحلية لجميع شاشات المطعم.'
          : language === 'fr'
            ? 'Gerez les liens reseau locaux pour tous les ecrans du restaurant.'
            : 'Manage local network links for all restaurant screens.',
      refresh:
        language === 'ar'
          ? 'تحديث الشبكة الحالية'
          : language === 'fr'
            ? 'Actualiser le reseau actuel'
            : 'Refresh current network',
      infoTitle: language === 'ar' ? 'معلومات الشبكة' : language === 'fr' ? 'Informations reseau' : 'Network Info',
      infoSubtitle:
        language === 'ar'
          ? 'عند تغيير الشبكة اضغط تحديث لتتغير كل الروابط تلقائيا حسب IP الجديد.'
          : language === 'fr'
            ? 'Si le reseau change, actualisez pour reconstruire tous les liens avec la nouvelle IP.'
            : 'When the network changes, refresh to rebuild all links using the new IP address.',
      loading:
        language === 'ar'
          ? 'جارٍ تحميل معلومات الشبكة...'
          : language === 'fr'
            ? 'Chargement des informations reseau...'
            : 'Loading network info...',
      serverIp: language === 'ar' ? 'IP الخادم' : language === 'fr' ? 'IP du serveur' : 'Server IP',
      hostname: language === 'ar' ? 'اسم المضيف' : language === 'fr' ? 'Nom d hote' : 'Hostname',
      localDomain: language === 'ar' ? 'النطاق المحلي' : language === 'fr' ? 'Domaine local' : 'Local Domain',
      previousIp: language === 'ar' ? 'IP السابق' : language === 'fr' ? 'IP precedente' : 'Previous IP',
      notFound: language === 'ar' ? 'غير موجود' : language === 'fr' ? 'Introuvable' : 'Not Found',
      linkMode: language === 'ar' ? 'وضع الروابط' : language === 'fr' ? 'Mode des liens' : 'Link Mode',
      autoIp: language === 'ar' ? 'IP محلي ديناميكي' : language === 'fr' ? 'IP locale dynamique' : 'Dynamic LAN IP',
      autoHostname: language === 'ar' ? 'اسم مضيف .local' : language === 'fr' ? 'Nom d hote .local' : 'Hostname .local',
      customMode: language === 'ar' ? 'مضيف مخصص' : language === 'fr' ? 'Hote personnalise' : 'Custom Host',
      customHost: language === 'ar' ? 'المضيف المخصص' : language === 'fr' ? 'Hote personnalise' : 'Custom Host',
      save: language === 'ar' ? 'حفظ' : language === 'fr' ? 'Enregistrer' : 'Save',
      resolvedHost: language === 'ar' ? 'المضيف المعتمد' : language === 'fr' ? 'Hote retenu' : 'Resolved Host',
      linksTitle: language === 'ar' ? 'روابط الشاشات' : language === 'fr' ? 'Liens des ecrans' : 'Screen Links',
      linksSubtitle:
        language === 'ar'
          ? 'هذه الروابط تتغير حسب IP الشبكة الحالية أو حسب المضيف الذي تختاره.'
          : language === 'fr'
            ? 'Ces liens changent selon l IP actuelle du reseau ou l hote choisi.'
            : 'These links change based on the current network IP or the host you choose.',
      customer: language === 'ar' ? 'واجهة الزبون' : language === 'fr' ? 'Ecran client' : 'Customer App',
      pos: language === 'ar' ? 'واجهة الكاشير' : language === 'fr' ? 'Ecran POS' : 'POS',
      kitchen: language === 'ar' ? 'واجهة المطبخ' : language === 'fr' ? 'Ecran cuisine' : 'Kitchen',
      admin: language === 'ar' ? 'واجهة الأدمن' : language === 'fr' ? 'Ecran admin' : 'Admin',
      waiter: language === 'ar' ? 'واجهة النادل' : language === 'fr' ? 'Ecran serveur' : 'Waiter',
      backend: language === 'ar' ? 'الباكند' : language === 'fr' ? 'Backend' : 'Backend',
    }),
    [language],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(CUSTOMER_APP_HOST_KEY) ?? '';
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
      const previousLanIp = window.localStorage.getItem(LAST_LAN_IP_KEY) ?? '';
      setPreviousLanIp(previousLanIp);
      const info = await getNetworkInfo(clientHost);
      setNetworkInfo(info);
      window.localStorage.setItem('restaurant:local-domain', info.localDomain);
      if (info.lanAddress?.trim()) {
        window.localStorage.setItem(LAST_LAN_IP_KEY, info.lanAddress.trim());
      }
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, copy.title));
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
      window.localStorage.setItem(CUSTOMER_APP_HOST_KEY, 'AUTO_IP');
      setCustomHost('');
      return;
    }

    if (nextMode === 'AUTO_HOSTNAME') {
      window.localStorage.setItem(CUSTOMER_APP_HOST_KEY, 'AUTO_HOSTNAME');
      setCustomHost('');
      return;
    }

    const value = customHost.trim();
    if (value) {
      window.localStorage.setItem(CUSTOMER_APP_HOST_KEY, value);
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
        { label: copy.customer, url: buildServiceUrl(host, 3001) },
        { label: copy.pos, url: buildServiceUrl(host, 3002) },
        { label: copy.kitchen, url: buildServiceUrl(host, 3003) },
        { label: copy.admin, url: buildServiceUrl(host, 3004) },
        { label: copy.waiter, url: buildServiceUrl(host, 3005) },
        { label: copy.backend, url: buildServiceUrl(host, 4000) },
      ]
    : [];

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" className="ghost-btn" onClick={() => void load()}>
            <RefreshCw size={16} />
            <span>{copy.refresh}</span>
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
                <span>{copy.infoTitle}</span>
              </h3>
              <p>{copy.infoSubtitle}</p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <h3>{copy.loading}</h3>
            </div>
          ) : networkInfo ? (
            <div className="mt-4 space-y-3">
              <div className="summary-row">
                <span>{copy.serverIp}</span>
                <strong className="font-mono">{networkInfo.lanAddress ?? copy.notFound}</strong>
              </div>
              <div className="summary-row">
                <span>{copy.previousIp}</span>
                <strong className="font-mono">{previousLanIp || copy.notFound}</strong>
              </div>
              <div className="summary-row">
                <span>{copy.hostname}</span>
                <strong className="font-mono">{networkInfo.hostname}</strong>
              </div>
              <div className="summary-row">
                <span>{copy.localDomain}</span>
                <strong className="font-mono text-indigo-600">{networkInfo.localDomain}</strong>
              </div>

              <div className="summary-row flex-col items-start gap-2 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{copy.linkMode}</span>
                <select
                  value={qrMode}
                  onChange={(event) => handleSaveMode(event.target.value as QrMode)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="AUTO_IP">{copy.autoIp}</option>
                  <option value="AUTO_HOSTNAME">{copy.autoHostname}</option>
                  <option value="CUSTOM">{copy.customMode}</option>
                </select>
              </div>

              {qrMode === 'CUSTOM' ? (
                <div className="summary-row flex-col items-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{copy.customHost}</span>
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
                      <span>{copy.save}</span>
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="summary-row">
                <span>{copy.resolvedHost}</span>
                <strong className="font-mono text-emerald-700">{host || '-'}</strong>
              </div>
            </div>
          ) : null}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>{copy.linksTitle}</h3>
              <p>{copy.linksSubtitle}</p>
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
