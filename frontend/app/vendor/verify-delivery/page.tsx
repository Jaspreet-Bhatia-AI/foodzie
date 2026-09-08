'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, AlertTriangle, Store, User, ArrowRight } from 'lucide-react';
import { api, getToken, decodeToken } from '@/lib/api';

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

interface OrderDetail {
  id: string;
  totalAmount: number;
  deliveryAddress: string;
  customer: {
    name: string;
  };
}

export default function VerifyDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderInfo, setOrderInfo] = useState<OrderDetail | null>(null);

  useEffect(() => {
    // 1. Verify Vendor Authentication
    const token = getToken();
    if (!token) {
      router.replace(`/login?redirect=/vendor/verify-delivery/${orderId}`);
      return;
    }

    const payload = decodeToken<TokenPayload>(token);
    const isValid = payload !== null && payload.role === 'Vendor' && payload.exp > Date.now() / 1000;

    if (!isValid) {
      router.replace(`/login?redirect=/vendor/verify-delivery/${orderId}`);
      return;
    }

    // 2. Perform QR Delivery confirmation
    async function verifyAndCompleteDelivery() {
      try {
        const response = await api.patch<{ success: boolean; order: any }>(`/api/orders/${orderId}/deliver-by-qr`, {});
        setOrderInfo(response.order);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Verification failed. Please ensure you are logged in with the correct vendor account.');
      }
    }

    if (orderId) {
      verifyAndCompleteDelivery();
    }
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-gray-50">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
        {/* Glow decorative circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

        {status === 'verifying' && (
          <div className="space-y-6 py-6 animate-pulse">
            <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-bold">Verifying Order Delivery...</h1>
              <p className="text-sm text-gray-500">Contacting backend servers to process QR payload</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white">Delivery Confirmed!</h1>
              <p className="text-sm text-gray-400">Order has been marked as Delivered successfully.</p>
            </div>

            {orderInfo && (
              <div className="bg-gray-950 border border-gray-800/80 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-black">Customer</span>
                    <p className="text-xs font-bold text-white leading-none mt-0.5">{orderInfo.customer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-500" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-black">Order ID</span>
                    <p className="text-xs font-bold font-mono text-white leading-none mt-0.5">#F-{orderInfo.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-800 text-xs">
                  <span className="text-gray-500">Delivery Address:</span>
                  <p className="font-semibold text-gray-300 mt-1">{orderInfo.deliveryAddress}</p>
                </div>
              </div>
            )}

            <button 
              onClick={() => router.push('/vendor/orders')}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-600/20"
            >
              Go to Kitchen Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-4 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Verification Failed</h1>
              <p className="text-sm text-gray-400 leading-relaxed px-2">{errorMsg}</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => router.push('/vendor/orders')}
                className="w-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 rounded-xl transition-all"
              >
                Go to Kitchen Dashboard
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center text-gray-400 hover:text-white text-xs font-bold transition-colors py-2"
              >
                Retry Scan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
