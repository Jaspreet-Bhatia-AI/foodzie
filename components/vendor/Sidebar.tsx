'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  LayoutGrid,
  ClipboardList,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { removeToken } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/vendor/inventory', label: 'Inventory',  icon: LayoutGrid,     active: true  },
  { href: '/vendor/orders',    label: 'Orders',     icon: ClipboardList,  active: true  },
  { href: '/vendor/analytics', label: 'Analytics',  icon: BarChart2,      active: true  },
  { href: '/vendor/settings',  label: 'Settings',   icon: Settings,       active: true  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  function handleLogout() {
    removeToken();
    router.replace('/');
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-gray-950 border-r border-gray-800/60 flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-800/60">
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/30 shrink-0">
          <UtensilsCrossed className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Foodzie</p>
          <p className="text-gray-500 text-xs">Vendor Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest px-3 pb-2">
          Menu
        </p>

        {NAV_ITEMS.map(({ href, label, icon: Icon, active }) => {
          const isActive = pathname.startsWith(href);

          if (!active) {
            // Coming-soon items — visually dimmed, not clickable
            return (
              <div
                key={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 cursor-not-allowed select-none"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm flex-1">{label}</span>
                <span className="text-[9px] bg-gray-800 text-gray-600 rounded-full px-2 py-0.5 uppercase tracking-wide">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-400' : ''}`} />
              <span className="text-sm flex-1 font-medium">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-orange-400/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — Logout */}
      <div className="px-3 py-4 border-t border-gray-800/60">
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
