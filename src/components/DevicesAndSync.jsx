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
  ExternalLink,
  Download,
  Copy,
  Check,
  Trash2
} from 'lucide-react';

export default function DevicesAndSync({ onOpenSimulator }) {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [activeQrTab, setActiveQrTab] = useState('DOWNLOAD'); // 'DOWNLOAD' or 'PAIR'
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

      const dlRes = await fetch('/api/apk-download-qr');
      const dlJson = await dlRes.json();
      if (dlJson.success) {
        setDownloadInfo(dlJson.data);
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

  const handleCopyLink = () => {
    if (downloadInfo?.downloadPageUrl) {
      navigator.clipboard.writeText(downloadInfo.downloadPageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDeleteDevice = async (devId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الجهاز؟')) return;
    try {
      const res = await fetch(`/api/devices/${devId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDevices();
      }
    } catch (err) {
      console.error('Failed to delete device:', err);
    }
  };

  const handleCleanOffline = async () => {
    try {
      const res = await fetch('/api/devices/clean-offline', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchDevices();
      }
    } catch (err) {
      console.error('Failed to clean offline devices:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. QR Code Card: Tabbed between Download APK and Device Pairing */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
        
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl w-full text-xs font-bold">
          <button
            onClick={() => setActiveQrTab('DOWNLOAD')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeQrTab === 'DOWNLOAD'
                ? 'bg-white text-[#ca1535] shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1. تحميل التطبيق (APK)</span>
          </button>

          <button
            onClick={() => setActiveQrTab('PAIR')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeQrTab === 'PAIR'
                ? 'bg-white text-emerald-700 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>2. ربط الهاتف</span>
          </button>
        </div>

        {activeQrTab === 'DOWNLOAD' ? (
          /* Tab 1: Scan QR to Download APK on Phone */
          <div className="space-y-3 w-full flex flex-col items-center animate-in fade-in duration-150">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-[#ca1535] text-[10px] font-extrabold border border-red-200 mb-1">
                <Wifi className="w-3 h-3 animate-pulse" />
                <span>عبر شبكة Wi-Fi المحلية</span>
              </span>
              <h3 className="font-extrabold text-sm text-slate-800">امسح الكود بكاميرا الموبايل</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs font-medium">
                وجّه كاميرا الهاتف أو تطبيق مسح QR لتحميل التطبيق مباشرة على جهازك
              </p>
            </div>

            {/* QR Preview for APK Download */}
            <div className="p-3 bg-slate-50 border-2 border-dashed border-red-200 rounded-3xl shadow-inner my-1">
              {downloadInfo?.qrCode ? (
                <img 
                  src={downloadInfo.qrCode} 
                  alt="Scan to Download APK" 
                  className="w-48 h-48 rounded-2xl shadow-sm border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  جاري توليد كود التحميل...
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full text-xs space-y-1 font-mono text-slate-600">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold">رابط التحميل:</span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-[#ca1535] hover:text-[#a70d29] font-bold text-[10px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-700 bg-white p-1 rounded border border-slate-200 truncate dir-ltr text-center">
                {downloadInfo?.downloadPageUrl || `http://${deviceInfo?.serverHost || '192.168.1.x:5500'}/download-app`}
              </div>
            </div>

            <button
              onClick={() => setActiveQrTab('PAIR')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>تم التثبيت؟ انتقل لكود الربط</span>
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Tab 2: Pairing QR Code */
          <div className="space-y-3 w-full flex flex-col items-center animate-in fade-in duration-150">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 mb-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>الخطوة 2: مزامنة الرسائل</span>
              </span>
              <h3 className="font-extrabold text-sm text-slate-800">امسح الكود من داخل تطبيق الهاتف</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs font-medium">
                افتح تطبيق AMN Cash على الهاتف واضغط "مسح كود الربط" لتوصيله فوراً
              </p>
            </div>

            {/* QR Preview for Pairing */}
            <div className="p-3 bg-slate-50 border-2 border-dashed border-emerald-200 rounded-3xl shadow-inner my-1">
              {qrData?.qrCode ? (
                <img 
                  src={qrData.qrCode} 
                  alt="Pairing QR" 
                  className="w-48 h-48 rounded-2xl shadow-sm border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  جاري تجهيز كود الربط...
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full text-xs space-y-1 font-mono text-slate-600">
              <div className="flex justify-between text-[11px]">
                <span className="font-bold">عنوان السيرفر:</span>
                <span className="text-[#ca1535] font-black">{qrData?.serverAddress || '192.168.1.x:5500'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="font-bold">بروتوكول الأمان:</span>
                <span className="text-emerald-700 font-bold">HMAC-SHA256</span>
              </div>
            </div>

            <button
              onClick={() => setActiveQrTab('DOWNLOAD')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>العودة لكود تحميل التطبيق (APK)</span>
            </button>
          </div>
        )}

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

            <div className="flex items-center gap-2">
              <button
                onClick={handleCleanOffline}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#ca1535] border border-red-200 font-bold text-xs transition-colors"
                title="حذف كافة الأجهزة غير المتصلة"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تنظيف غير المتصل</span>
              </button>

              <button
                onClick={fetchDevices}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>إعادة فحص الاتصال</span>
              </button>
            </div>
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

                <div className="flex items-center gap-4 text-xs text-slate-600 font-medium w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                  <div className="text-center md:text-right">
                    <span className="text-slate-400 block text-[10px]">آخر مزامنة</span>
                    <strong className="text-slate-800 font-mono text-[11px]">{dev.last_sync || 'منذ ثوانٍ'}</strong>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="text-slate-400 block text-[10px]">إجمالي الرسائل</span>
                    <strong className="text-slate-800 font-mono text-sm">{dev.total_messages || 0}</strong>
                  </div>
                  <button
                    onClick={() => handleDeleteDevice(dev.id || dev.device_id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="حذف هذا الجهاز"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

        {/* Production Operations Guide */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h4 className="font-extrabold text-sm text-white">إرشادات التشغيل الفعلي في المحل</h4>
          </div>
          <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed font-medium">
            <p>1. تأكد من اتصال هاتف فودافون كاش وحاسوب الويندوز بنفس شبكة الـ Wi-Fi المحلية للمحل.</p>
            <p>2. امسح كود الـ QR من شاشة الهاتف لتحميل وتثبيت التطبيق وتفعيل أذونات الرسائل (SMS).</p>
            <p>3. فور وصول أي رسالة تحويل أو سحب كاش على الشريحة، سيتم رصدها وتسجيلها في جدول المعاملات لحظياً دون أي تدخل يدوي.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
