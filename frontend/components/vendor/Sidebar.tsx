'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import {
  UtensilsCrossed,
  LayoutGrid,
  ClipboardList,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
  QrCode,
  Users,
} from 'lucide-react';
import { removeToken } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV_ITEMS = [
  { href: '/vendor/inventory', label: 'Inventory',  icon: LayoutGrid,     active: true  },
  { href: '/vendor/orders',    label: 'Orders',     icon: ClipboardList,  active: true  },
  { href: '/vendor/scan',      label: 'Scan QR',    icon: QrCode,         active: true  },
  { href: '/vendor/employees', label: 'Employee Manager',  icon: Users,   active: true  },
  { href: '/vendor/analytics', label: 'Analytics',  icon: BarChart2,      active: true  },
  { href: '/vendor/settings',  label: 'Settings',   icon: Settings,       active: true  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }: SidebarProps) {
  const { brandName } = useBrand();
  const pathname = usePathname();
  const router   = useRouter();

  function handleLogout() {
    removeToken();
    router.replace('/');
  }

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-25 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 bg-gray-950 border-r border-gray-800/60 flex flex-col z-30 transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-60'
      } ${
        isMobileOpen ? 'translate-x-0 w-60' : 'max-lg:-translate-x-full lg:translate-x-0'
      } w-60`}>
        {/* Brand & Toggles */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800/60 shrink-0 h-[65px]">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:hidden' : 'flex'}`}>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/30 shrink-0">
              <UtensilsCrossed className="w-4 h-4 text-white" size={16} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">{brandName}</p>
              <p className="text-gray-500 text-[10px] mt-0.5 leading-none">Vendor Portal</p>
            </div>
          </div>

          {/* Collapse trigger (Desktop only) */}
          <button 
            onClick={onToggleCollapse} 
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors mx-auto"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close button (Mobile only) */}
          <button 
            onClick={onCloseMobile} 
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest px-3 pb-2 select-none">
              Menu
            </p>
          )}

          {NAV_ITEMS.map(({ href, label, icon: Icon, active }) => {
            const isActive = pathname.startsWith(href);

            if (!active) {
              return (
                <div
                  key={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 cursor-not-allowed select-none ${
                    isCollapsed ? 'lg:justify-center' : ''
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={`text-sm flex-1 ${isCollapsed ? 'lg:hidden' : 'block'}`}>{label}</span>
                </div>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group border ${
                  isCollapsed ? 'lg:justify-center border-transparent' : 'border-transparent'
                } ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border-transparent'
                }`}
                title={isCollapsed ? label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-400' : ''}`} />
                <span className={`text-sm font-medium ${isCollapsed ? 'lg:hidden' : 'block'}`}>{label}</span>
                {!isCollapsed && isActive && <ChevronRight className="w-3.5 h-3.5 text-orange-400/60 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — Appearance & Logout */}
        <div className="px-3 py-4 border-t border-gray-800/60 shrink-0 space-y-3">
          <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between px-3'}`}>
            {!isCollapsed && <span className="text-xs text-gray-500 font-semibold select-none">Appearance</span>}
            <ThemeToggle />
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 group ${
              isCollapsed ? 'lg:justify-center' : ''
            }`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            <span className={`text-sm font-medium ${isCollapsed ? 'lg:hidden' : 'block'}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
