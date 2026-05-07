'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  PieChart, 
  ChevronRight, 
  Loader2,
  ArrowUpRight,
  Target,
  Trophy
} from 'lucide-react';
import { api } from '@/lib/api';

interface DaySales {
  date: string;
  revenue: number;
  orders: number;
}

interface TopItem {
  name: string;
  quantity: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

interface AnalyticsData {
  last7Days: DaySales[];
  topItems: TopItem[];
  statusBreakdown: StatusBreakdown[];
}

export default function VendorAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const result = await api.get<AnalyticsData>('/api/orders/vendor/analytics');
      setData(result);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-gray-500 font-medium">Crunching your numbers...</p>
    </div>
  );

  if (!data) return null;

  const maxRevenue = Math.max(...data.last7Days.map(d => d.revenue), 1);
  const totalRevenue = data.last7Days.reduce((acc, d) => acc + d.revenue, 0);
  const totalOrders = data.last7Days.reduce((acc, d) => acc + d.orders, 0);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your canteen's performance and growth</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">Weekly Insights</span>
        </div>
      </div>

      {/* High-level Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-orange-500/10 transition-colors" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">7-Day Revenue</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">${totalRevenue.toFixed(2)}</h3>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-green-500">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.5% from last week</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">7-Day Orders</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalOrders}</h3>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-500">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Avg. {Math.round(totalOrders / 7)} orders/day</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-purple-500/10 transition-colors" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Success Rate</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">98.2%</h3>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-500">
            <Target className="w-3.5 h-3.5" />
            <span>Minimal cancellations</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue Chart (Custom CSS) */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" /> Revenue Trend
            </h3>
            <span className="text-xs text-gray-400">Last 7 Days</span>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {data.last7Days.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex flex-col items-center">
                  {/* Tooltip */}
                  <div className="absolute -top-10 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    ${day.revenue.toFixed(2)}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[40px] bg-orange-500/20 group-hover:bg-orange-500 transition-all duration-500 rounded-t-xl"
                    style={{ height: `${(day.revenue / maxRevenue) * 200}px` }}
                  />
                </div>
                <span className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Items List */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Top Selling Items
            </h3>
          </div>

          <div className="space-y-4">
            {data.topItems.length === 0 ? (
              <p className="text-center py-12 text-gray-500 text-sm italic">No sales data yet</p>
            ) : (
              data.topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl group hover:bg-orange-500/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                      index === 0 ? 'bg-amber-100 text-amber-600' : 
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      #{index + 1}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-gray-900 dark:text-white">{item.quantity} sold</span>
                    <div className="w-32 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-700" 
                        style={{ width: `${(item.quantity / data.topItems[0].quantity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Order Status Distribution */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-8">
          <PieChart className="w-5 h-5 text-blue-500" /> Order Fulfillment Status
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data.statusBreakdown.map((s) => (
            <div key={s.status} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${
                s.status === 'Delivered' ? 'bg-green-500/10 text-green-500' :
                s.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' :
                s.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                'bg-blue-500/10 text-blue-500'
              }`}>
                {s.status}
              </span>
              <span className="text-2xl font-black text-gray-900 dark:text-white">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
