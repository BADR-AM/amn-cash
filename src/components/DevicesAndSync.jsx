import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  Wifi, 
  ShieldCheck, 
  Key,
  ExternalLink
} from 'lucide-react';

export default function DevicesAndSync({ onOpenSimulator }) {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/devices');
      const data = await res.json();
      if (data.success) {
        setDeviceInfo(data.data);
      }

      const qrRes = await fetch('/api/pairing-qr');
      const qrJson = await qrRes.json();
      if (qrJson.success) {
        setQrData(qrJson.data);
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. QR Code Pairing Card */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#ca1535] flex items-center justify-center font-bold">
          <QrCode className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-extrabold text-base text-slate-800">ربط هاتف الأندرويد (QR Code)</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs font-medium">
            امسح الكود من تطبيق Android Collector للربط التلقائي وتلقي رسائل Vodafone Cash
          </p>
        </div>

        {/* QR Preview */}
        <div className="p-3 bg-slate-50 border-2 border-dashed border-red-200 rounded-3xl shadow-inner my-2">
          {qrData?.qrCode ? (
            <img 
              src={qrData.qrCode} 
              alt="Pairing QR" 
              className="w-56 h-56 rounded-2xl shadow-sm"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
              جاري تجهيز كود الربط...
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 w-full text-xs space-y-1 font-mono text-slate-600">
          <div className="flex justify-between">
            <span className="font-bold">عنوان السيرفر:</span>
            <span className="text-[#ca1535] font-black">{qrData?.serverAddress || '192.168.1.x:5500'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">المنفذ:</span>
            <span>5500</span>
          </div>
        </div>
      </div>

      {/* 2. Paired Devices List & Status */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800">الأجهزة المتصلة والمعتمدة</h3>
                <p className="text-xs text-slate-400 font-medium">إدارة الهواتف التي تلتقط رسائل المحفظة</p>
              </div>
            </div>

            <button
              onClick={fetchDevices}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>إعادة فحص الاتصال</span>
            </button>
          </div>

          {/* Device Card (Matching Mockup 1: الأجهزة والاتصال) */}
          <div className="space-y-3">
            {deviceInfo?.devices?.map((dev) => (
              <div 
                key={dev.id}
                className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                    <Smartphone className="w-6 h-6 text-[#ca1535]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">{dev.device_name}</h4>
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-green"></span>
                        {dev.status === 'CONNECTED' ? 'متصل ونشط' : 'غير متصل'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 mt-1">IP: {dev.device_ip}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-600 font-medium w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                  <div className="text-center md:text-right">
                    <span className="text-slate-400 block text-[10px]">آخر مزامنة</span>
                    <strong className="text-slate-800 font-mono text-[11px]">{dev.last_sync || 'منذ ثوانٍ'}</strong>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="text-slate-400 block text-[10px]">إجمالي الرسائل</span>
                    <strong className="text-slate-800 font-mono text-sm">{dev.total_messages || 0}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Security & Isolation Notice */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">أمان الخصوصية والشبكة المحلية:</strong>
              <p className="text-emerald-800 leading-relaxed">
                يتم الاتصال محلياً عبر شبكة الـ Wi-Fi بين الهاتف والكمبيوتر دون الحاجة إلى أي خادم سحابي خارجي. يتم تصفية الرسائل وحجب أي كود OTP أو PIN سري قبل الإرسال تماماً.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Simulator Launcher */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-white">هل ترغب في اختبار الاستقبال دون هاتف؟</h4>
            <p className="text-xs text-slate-300 mt-1">استخدم محاكي الرسائل المدمج لإرسال رسائل فودافون كاش تجريبية فوراً</p>
          </div>
          <button
            onClick={onOpenSimulator}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            فتح محاكي الرسائل
          </button>
        </div>
      </div>
    </div>
  );
}
