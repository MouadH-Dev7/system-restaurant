'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  HelpCircle,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Check,
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { REALTIME_EVENTS, type AuditLogDTO } from '@repo/shared-types';
import { logout } from '@/auth/service';
import { useAuthStore } from '@/auth/store';
import { navItems, type Screen } from './data';
import { getSocket } from '@/lib/socket';
import { listLogs } from '@/services/logs.service';
import { getSettings } from '@/services/settings.service';
import { useAppStore } from '@/store/app.store';
import { useI18n } from '@/hooks/use-i18n';

type AdminShellProps = {
  activeScreen: Screen;
  children: ReactNode;
};

export function AdminShell({ activeScreen, children }: AdminShellProps) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<AuditLogDTO[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [restaurantName, setRestaurantName] = useState('');
  const joinedRoomRef = useRef<string | null>(null);
  const sidebarNavRef = useRef<HTMLElement | null>(null);
  const session = useAuthStore((state) => state.session);

  const [searchQuery, setSearchQuery] = useState('');

  // Zustand Store integrations
  const { t, dir, locale } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    const socket = getSocket();
    const roomKey = `admin:${restaurantId}`;
    const joinAdminRoom = () => {
      if (joinedRoomRef.current !== roomKey) {
        socket.emit('admin:join', { restaurantId });
        joinedRoomRef.current = roomKey;
      }
    };
    const refreshNotifications = () => {
      void listLogs(restaurantId).then((r) => setNotifications(r.data)).catch(() => setNotifications([]));
    };

    socket.on('connect', joinAdminRoom);
    Object.values(REALTIME_EVENTS).forEach((event) => {
      socket.on(event, refreshNotifications);
    });

    if (socket.connected) {
      joinAdminRoom();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', joinAdminRoom);
      Object.values(REALTIME_EVENTS).forEach((event) => {
        socket.off(event, refreshNotifications);
      });
    };
  }, [restaurantId]);

  useEffect(() => {
    joinedRoomRef.current = null;
  }, [restaurantId]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem('admin-sidebar-scroll-top');
    if (saved && sidebarNavRef.current) {
      sidebarNavRef.current.scrollTop = Number(saved) || 0;
    }
  }, [activeScreen]);

  useEffect(() => {
    if (!restaurantId) {
      setNotifications([]);
      return;
    }

    const activeRestaurantId = restaurantId;

    let active = true;

    async function loadNotifications() {
      try {
        const res = await listLogs(activeRestaurantId);
        if (active) {
          setNotifications(res.data);
        }
      } catch {
        if (active) {
          setNotifications([]);
        }
      }
    }

    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setRestaurantName('');
      return;
    }

    const activeRestaurantId = restaurantId;

    let active = true;

    async function loadRestaurantName() {
      try {
        const settings = await getSettings(activeRestaurantId);
        if (active) {
          setRestaurantName(settings?.restaurantName?.trim() ?? '');
        }
      } catch {
        if (active) {
          setRestaurantName('');
        }
      }
    }

    void loadRestaurantName();

    return () => {
      active = false;
    };
  }, [restaurantId]);

  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => !hiddenIds.includes(notification.id)),
    [hiddenIds, notifications],
  );

  const unreadCount = visibleNotifications.filter((notification) => !readIds.includes(notification.id)).length;
  const restaurantInitials =
    (session?.user.name || restaurantName)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'AD';
  const roleLabel = session?.user.role
    ? `${session.user.role[0]}${session.user.role.slice(1).toLowerCase()}`
    : t('profile.role');
  const menuSubItems = [
    {
      key: 'menu.add.menu',
      href: '/menu/add/menu',
      label: t('menu.addMenu'),
    },
    {
      key: 'menu.add.item',
      href: '/menu/add/item',
      label: t('menu.addItemShortcut'),
    },
    {
      key: 'menu.add.addon',
      href: '/menu/add/addon',
      label: t('menu.addModifierShortcut'),
    },
    {
      key: 'menu.manage.menu',
      href: '/menu/manage/menu',
      label: t('menu.editMenu'),
    },
    {
      key: 'menu.manage.item',
      href: '/menu/manage/item',
      label: t('menu.editItemShortcut'),
    },
    {
      key: 'menu.manage.addon',
      href: '/menu/manage/addon',
      label: t('menu.editModifierShortcut'),
    },
  ];

  useEffect(() => {
    if (pathname?.startsWith('/menu')) {
      setIsMenuExpanded(true);
    }
  }, [pathname]);

  function markAsRead(id: string) {
    setReadIds((current) => (current.includes(id) ? current : [...current, id]));
  }

  function markAllAsRead() {
    setReadIds(visibleNotifications.map((notification) => notification.id));
  }

  function clearNotifications() {
    setHiddenIds(visibleNotifications.map((notification) => notification.id));
  }

  const renderNotificationIcon = (status: AuditLogDTO['status']) => {
    switch (status) {
      case 'WARNING':
        return <AlertTriangle size={16} className="text-amber-500 shrink-0" />;
      case 'FAILED':
        return <XCircle size={16} className="text-rose-500 shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
      default:
        return <Info size={16} className="text-sky-500 shrink-0" />;
    }
  };

  return (
    <main className="admin-shell" dir={dir}>
      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      >
        <div className="admin-brand flex items-center justify-between">
          <div className="brand-info">
            <h1 className="font-bold tracking-tight">{t('brand.name')}</h1>
            <p>{t('brand.subtitle')}</p>
          </div>
          {/* Collapse sidebar button (only on desktop) */}
          <button
            type="button"
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/10 text-white/70 hover:text-white"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav
          ref={sidebarNavRef}
          className="admin-nav"
          onScroll={(event) => {
            window.sessionStorage.setItem(
              'admin-sidebar-scroll-top',
              String(event.currentTarget.scrollTop),
            );
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeScreen;
            const className = active ? 'admin-nav-item active' : 'admin-nav-item';

            if (item.id === 'menu') {
              return (
                <div key={item.id} className="admin-nav-group">
                  <button
                    type="button"
                    className={className}
                    onClick={() => setIsMenuExpanded((current) => !current)}
                  >
                    <Icon size={18} />
                    <span>{t(item.labelKey)}</span>
                    {!isSidebarCollapsed ? (
                      <ChevronDown
                        size={16}
                        className={`admin-nav-chevron ${isMenuExpanded ? 'open' : ''}`}
                      />
                    ) : null}
                  </button>
                  {isMenuExpanded && !isSidebarCollapsed ? (
                    <div className="admin-subnav">
                      <p className="admin-subnav-heading">{t('menu.modeAdd')}</p>
                      {menuSubItems.slice(0, 3).map((subItem) => (
                        <Link
                          key={subItem.key}
                          href={subItem.href}
                          className={`admin-subnav-item ${pathname === subItem.href ? 'active' : ''}`}
                          onClick={() => setIsMobileOpen(false)}
                        >
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                      <p className="admin-subnav-heading">{t('menu.modeEdit')}</p>
                      {menuSubItems.slice(3).map((subItem) => (
                        <Link
                          key={subItem.key}
                          href={subItem.href}
                          className={`admin-subnav-item ${pathname === subItem.href ? 'active' : ''}`}
                          onClick={() => setIsMobileOpen(false)}
                        >
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={className}
                  onClick={() => setIsMobileOpen(false)} // Close menu on mobile click
                >
                  <Icon size={18} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            }

            return (
              <span key={item.id} className={className} aria-disabled="true">
                <Icon size={18} />
                <span>{t(item.labelKey)}</span>
              </span>
            );
          })}
        </nav>

        <div className="admin-profile">
          <div className="admin-avatar">{restaurantInitials}</div>
          <div>
            <strong>{session?.user.name ?? t('profile.name')}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className={`admin-main ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <header className="admin-topbar">
          <div className="flex items-center gap-3">
            {/* Mobile Burger Menu Button */}
            <button
              type="button"
              className="md:hidden icon-btn subtle mr-1"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Global Search Input */}
            <div className="admin-search flex items-center gap-2">
              <Search size={16} />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="admin-topbar-actions">
            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                type="button"
                className={`icon-btn ${isNotificationsOpen ? 'subtle text-primary' : ''}`}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {isNotificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-800">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                        {t('notifications.title')}
                      </h4>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
                            onClick={() => markAllAsRead()}
                          >
                            <Check size={10} /> {t('notifications.readAll')}
                          </button>
                        )}
                        {visibleNotifications.length > 0 && (
                          <button
                            type="button"
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
                            onClick={() => clearNotifications()}
                          >
                            <Trash2 size={10} /> {t('notifications.clear')}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                      {visibleNotifications.length > 0 ? (
                        visibleNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-3 text-xs cursor-pointer hover:bg-slate-50 flex gap-2.5 transition-colors ${!readIds.includes(n.id) ? 'bg-sky-50/40 font-medium' : ''}`}
                          >
                            {renderNotificationIcon(n.status)}
                            <div className="flex-1 space-y-1">
                              <p className="text-slate-700 leading-normal">{n.action}</p>
                              <span className="text-[9px] text-slate-400 font-medium block">
                                {new Intl.DateTimeFormat(locale, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                }).format(new Date(n.createdAt))}
                              </span>
                            </div>
                            {!readIds.includes(n.id) && (
                              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
                          <Bell size={24} className="text-slate-300" />
                          <p className="text-xs">{t('notifications.empty')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button type="button" className="icon-btn">
              <HelpCircle size={18} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => void logout()}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            <div className="divider" />
            <div className="admin-location">
              <div>
                <strong>{restaurantName || t('topbar.location')}</strong>
                <span className="text-xs font-bold text-emerald-600">{t('topbar.status')}</span>
              </div>
              <div className="location-avatar">{restaurantInitials}</div>
            </div>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </section>
    </main>
  );
}
