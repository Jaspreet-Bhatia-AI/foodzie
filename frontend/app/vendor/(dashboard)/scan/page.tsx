'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Camera, CheckCircle2, AlertCircle, Loader2, ArrowRight, Keyboard } from 'lucide-react';
import { api } from '@/lib/api';

interface OrderDetail {
  id: string;
  totalAmount: number;
  deliveryAddress: string;
  customer: {
    name: string;
  };
}

function playSuccessBeep() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio Context failed:", e);
  }
}

function playErrorBeep() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio Context failed:", e);
  }
}

function triggerVibration(pattern: number[]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export default function VendorQRScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderInfo, setOrderInfo] = useState<OrderDetail | null>(null);
  const [manualCode, setManualCode] = useState('');
  
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically load html5-qrcode on the client side to avoid SSR build errors
    let scanner: any = null;

    import('html5-qrcode').then((module) => {
      const Html5QrcodeScanner = module.Html5QrcodeScanner;
      
      scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      scannerRef.current = scanner;

      const onScanSuccess = (decodedText: string) => {
        console.log("Decoded text:", decodedText);
        // Turn off scanner once scanned successfully to prevent concurrent triggers
        try {
          scanner.clear();
        } catch (e) {
          console.warn("Failed to clear scanner:", e);
        }
        setScanResult(decodedText);
        handleVerification(decodedText);
      };

      const onScanFailure = (error: any) => {
        // Quietly fail during search frames
      };

      scanner.render(onScanSuccess, onScanFailure);
    }).catch(err => console.error("Failed to load html5-qrcode:", err));

    return () => {
      if (scanner) {
        try {
          scanner.clear();
        } catch (e) {
          console.warn("Clean up failed:", e);
        }
      }
    };
  }, []);

  const handleVerification = async (qrPayload: string) => {
    setIsVerifying(true);
    setStatus('idle');
    setErrorMsg('');
    setOrderInfo(null);

    try {
      // 1. A URL from our system
      // E.g., http://localhost:3000/vendor/verify-delivery/12345
      let orderId = qrPayload;
      if (qrPayload.includes('/verify-delivery/')) {
        const parts = qrPayload.split('/verify-delivery/');
        orderId = parts[parts.length - 1];
      }

      // Cleanup any trailing slashes or queries
      orderId = orderId.split('?')[0].split('/')[0].trim();

      if (!orderId) {
        throw new Error("Invalid QR Code payload format.");
      }

      const response = await api.patch<{ success: boolean; order: any }>(`/api/orders/${orderId}/deliver-by-qr`, {});
      setOrderInfo(response.order);
      setStatus('success');
      triggerVibration([100]); // Success: short haptic pulse
      playSuccessBeep();      // Success sound
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || "Failed to confirm delivery. Please verify the QR Code is correct.");
      triggerVibration([200, 100, 200]); // Error: double warning pulse
      playErrorBeep();                  // Error buzz sound
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerification(manualCode.trim());
  };

  const restartScanner = () => {
    setScanResult(null);
    setStatus('idle');
    setOrderInfo(null);
    setErrorMsg('');
    setManualCode('');

    // Re-render scanner
    if (scannerRef.current) {
      try {
        scannerRef.current.render(
          (decodedText: string) => {
            try {
              scannerRef.current.clear();
            } catch (e) {}
            setScanResult(decodedText);
            handleVerification(decodedText);
          },
          () => {}
        );
      } catch (e) {
        console.warn("Failed to restart scanner render:", e);
        // Force reload page as a absolute backup to re-init navigator video
        window.location.reload();
      }
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <QrCode className="w-8 h-8 text-orange-500" /> Delivery QR Scanner
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Scan student's verification QR code directly using your camera to confirm delivery.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Verification Status Banner */}
        {isVerifying && (
          <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirming delivery status...</p>
          </div>
        )}

        {status === 'success' && orderInfo && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center space-y-4 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md shadow-green-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400">Order Delivery Confirmed!</h3>
              <p className="text-xs text-gray-500">Order #{orderInfo.id.slice(-6).toUpperCase()} has been completed successfully.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-left space-y-2 max-w-sm mx-auto text-xs">
              <p className="text-gray-600 dark:text-gray-400"><strong>Customer:</strong> {orderInfo.customer.name}</p>
              <p className="text-gray-600 dark:text-gray-400"><strong>Total Amount:</strong> ${orderInfo.totalAmount.toFixed(2)}</p>
              <p className="text-gray-600 dark:text-gray-400"><strong>Address:</strong> {orderInfo.deliveryAddress}</p>
            </div>

            <button 
              onClick={restartScanner}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-green-600/10"
            >
              Scan Next Order
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-4 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Verification Failed</h3>
              <p className="text-xs text-gray-500">{errorMsg}</p>
            </div>
            <button 
              onClick={restartScanner}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Video stream container */}
        <div className={`overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 ${
          status !== 'idle' ? 'hidden' : 'block'
        }`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 text-xs font-bold text-gray-500">
            <Camera className="w-4 h-4 text-orange-500" /> CAMERA VIEWPORT
          </div>
          <div id="reader" className="w-full"></div>
        </div>

        {/* Manual code entry option */}
        {status === 'idle' && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-orange-500" /> Manual Code / URL Entry
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste order ID or scan link..."
                  className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/10 flex items-center gap-1"
                >
                  Verify <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
