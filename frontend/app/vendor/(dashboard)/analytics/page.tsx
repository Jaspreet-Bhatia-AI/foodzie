'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
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
  profit: number;
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
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
  const { formatCurrency } = useCurrency();
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

  const last7Days = data.last7Days || [];
  const maxRevenue = Math.max(...last7Days.map(d => Math.max(d.revenue || 0, d.profit || 0)), 1);
  const totalRevenue = last7Days.reduce((acc, d) => acc + (d.revenue || 0), 0);
  const totalProfit = last7Days.reduce((acc, d) => acc + (d.profit || 0), 0);
  const totalOrders = last7Days.reduce((acc, d) => acc + (d.orders || 0), 0);

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
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">7-Day Gross Sales</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</h3>
          {totalRevenue > 0 ? (
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-green-500">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Gross Canteen Revenue</span>
            </div>
          ) : (
            <div className="mt-4 text-xs font-medium text-gray-400">
              No transactions yet
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">7-Day Net Profit</p>
          <h3 className="text-3xl font-black text-emerald-500">{formatCurrency(totalProfit)}</h3>
          {totalProfit > 0 ? (
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-500">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Net Profit (Sell - Cost)</span>
            </div>
          ) : (
            <div className="mt-4 text-xs font-medium text-gray-400">
              No profit calculated
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">7-Day Orders</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalOrders}</h3>
          {totalOrders > 0 ? (
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-500">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Avg. {Math.round(totalOrders / 7)} orders/day</span>
            </div>
          ) : (
            <div className="mt-4 text-xs font-medium text-gray-400">
              No orders placed yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue & Profit Chart (Custom CSS) */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" /> Sales & Profit Trend
            </h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Revenue</span>
              <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Net Profit</span>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {(data.last7Days || []).map((day, i) => (
              <div key={day.date || i} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex flex-col items-center">
                  {/* Tooltip */}
                  <div className="absolute -top-14 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg text-left">
                    <p>Rev: {formatCurrency(day.revenue || 0)}</p>
                    <p className="text-emerald-400">Profit: {formatCurrency(day.profit || 0)}</p>
                  </div>
                  {/* Bars Side-by-Side */}
                  <div className="flex items-end gap-1.5 w-full justify-center">
                    <div 
                      className="w-3.5 bg-orange-500/25 group-hover:bg-orange-500 transition-all duration-500 rounded-t-sm"
                      style={{ height: `${((day.revenue || 0) / maxRevenue) * 180}px` }}
                    />
                    <div 
                      className="w-3.5 bg-emerald-500/25 group-hover:bg-emerald-500 transition-all duration-500 rounded-t-sm"
                      style={{ height: `${((day.profit || 0) / maxRevenue) * 180}px` }}
                    />
                  </div>
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
            {!(data.topItems && data.topItems.length) ? (
              <p className="text-center py-12 text-gray-500 text-sm italic">No sales data yet</p>
            ) : (
              data.topItems.map((item, index) => (
                <div key={item.name || index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl group hover:bg-orange-500/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                      index === 0 ? 'bg-amber-100 text-amber-600' : 
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      #{index + 1}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">{item.name || 'Unknown'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-gray-900 dark:text-white block">{item.quantity || 0} sold</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Rev: {formatCurrency(item.revenue || 0)} | Profit: <span className="text-emerald-500 font-bold">{formatCurrency(item.profit || 0)}</span></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      
        {/* Customer of the Month Leaderboard */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" /> Customer of the Month (Leaderboard)
            </h3>
            <button 
              
              onClick={async () => {
                if (confirm("Award top 3 customers bonus points for this month?")) {
                  try {
                    await api.post('/api/orders/vendor/analytics/award', {});
                    alert("Points awarded successfully!");
                  } catch (e) {
                    alert("Error awarding points");
                  }
                }
              }}

              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
            >
              <Award className="w-4 h-4" /> Award Top 3 Points
            </button>
          </div>

          <div className="space-y-4">
            {!(data.topCustomers && data.topCustomers.length) ? (
              <p className="text-center py-12 text-gray-500 text-sm italic">No customer data for this month yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.topCustomers.map((customer: any, index: number) => (
                  <div key={customer.id} className="relative bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 flex flex-col items-center text-center border border-gray-100 dark:border-gray-800">
                    <div className={`absolute -top-4 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-lg ${
                      index === 0 ? 'bg-amber-400 text-white border-2 border-white' : 
                      index === 1 ? 'bg-gray-300 text-white border-2 border-white' :
                      'bg-orange-400 text-white border-2 border-white'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mt-2 mb-3">
                      <User className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-black text-gray-900 dark:text-white text-lg">{customer.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{customer.email}</p>
                    
                    <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-4" />
                    
                    <div className="flex justify-between w-full text-sm">
                      <span className="text-gray-500 font-medium">Monthly Spend</span>
                      <span className="font-black text-emerald-500">{formatCurrency(customer.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between w-full text-xs mt-2">
                      <span className="text-gray-500 font-medium">Orders</span>
                      <span className="font-bold text-gray-900 dark:text-white">{customer.orderCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


      {/* Order Status Distribution */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-8">
          <PieChart className="w-5 h-5 text-blue-500" /> Order Fulfillment Status
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(data.statusBreakdown || []).map((s, i) => (
            <div key={s.status || i} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
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
