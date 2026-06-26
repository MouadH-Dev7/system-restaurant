import {
  Activity,
  BarChart3,
  ChefHat,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  MenuSquare,
  Package,
  Printer,
  Wallet,
  ReceiptText,
  BadgePercent,
  Settings,
  Network,
  Table2,
  UserCheck,
} from 'lucide-react';

export type Screen =
  | 'dashboard'
  | 'menu'
  | 'orders'
  | 'tables'
  | 'kitchen'
  | 'inventory'
  | 'staff'
  | 'printers'
  | 'analytics'
  | 'reports'
  | 'monitoring'
  | 'logs'
  | 'employee-risk'
  | 'payments'
  | 'discounts'
  | 'networks'
  | 'settings';

export type NavItem = {
  id: Screen;
  labelKey: string;
  href?: string;
  icon: typeof LayoutDashboard;
};

export const navItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { id: 'orders', labelKey: 'nav.orders', href: '/orders', icon: ReceiptText },
  { id: 'menu', labelKey: 'nav.menu', href: '/menu', icon: MenuSquare },
  { id: 'tables', labelKey: 'nav.tables', href: '/tables', icon: Table2 },
  { id: 'kitchen', labelKey: 'nav.kitchen', href: '/kitchen', icon: ChefHat },
  { id: 'inventory', labelKey: 'nav.inventory', href: '/inventory', icon: Package },
  { id: 'staff', labelKey: 'nav.staff', href: '/staff', icon: UserCheck },
  { id: 'printers', labelKey: 'nav.printers', href: '/printers', icon: Printer },
  { id: 'analytics', labelKey: 'nav.analytics', href: '/analytics', icon: BarChart3 },
  { id: 'reports', labelKey: 'nav.reports', href: '/reports', icon: FileSpreadsheet },
  { id: 'monitoring', labelKey: 'nav.monitoring', href: '/monitoring', icon: Activity },
  { id: 'logs', labelKey: 'nav.logs', href: '/logs', icon: History },
  { id: 'employee-risk', labelKey: 'nav.employeeRisk', href: '/employee-risk', icon: UserCheck },
  { id: 'payments', labelKey: 'nav.payments', href: '/payments', icon: Wallet },
  { id: 'discounts', labelKey: 'nav.discounts', href: '/discounts', icon: BadgePercent },
  { id: 'networks', labelKey: 'nav.networks', href: '/networks', icon: Network },
  { id: 'settings', labelKey: 'nav.settings', href: '/settings', icon: Settings },
];

export function statusBadge(status: string) {
  switch (status) {
    case 'DELIVERED':
    case 'PAID':
    case 'In Stock':
    case 'AVAILABLE':
    case 'Available':
      return 'bg-emerald-50 text-emerald-700';
    case 'PREPARING':
    case 'Low Stock':
    case 'RESERVED':
    case 'Reserved':
      return 'bg-amber-50 text-amber-700';
    case 'READY':
    case 'OCCUPIED':
    case 'Occupied':
      return 'bg-sky-50 text-sky-700';
    case 'CANCELLED':
    case 'Out of Stock':
      return 'bg-rose-50 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
