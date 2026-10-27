import React, { useState, useEffect } from 'react';
import { X, Smartphone, QrCode, Download, Wifi, CheckCircle2, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';

export default function DownloadApkModal({ isOpen, onClose }) {
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/apk-download-qr');
        const data = await res.json();
        if (data.success) {
          setDownloadInfo(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch APK download QR:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (downloadInfo?.downloadPageUrl) {
      navigator.clipboard.writeText(downloadInfo.downloadPageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#ca1535] flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">بوابة هاتف فودافون كاش (QR Portal)</h3>
              <p className="text-xs text-slate-400 font-medium">امسح الكود لاختيار: تفعيل الاتصال أو تحميل التطبيق</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network Badge */}
        <div className="my-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-900 font-bold">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>الشبكة المحلية المشتركة (Wi-Fi):</span>
          </div>
          <span className="font-mono text-emerald-800 dir-ltr bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
            {downloadInfo?.localIp || '192.168.1.x'}
          </span>
        </div>

        {/* QR Code Block */}
        <div className="flex flex-col items-center justify-center p-5 bg-slate-50 border-2 border-dashed border-red-200 rounded-3xl my-3 text-center">
          {loading ? (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
              جاري تجهيز كود البوابة...
            </div>
          ) : downloadInfo?.qrCode ? (
            <>
              <img 
                src={downloadInfo.qrCode} 
                alt="Scan to Connect or Download" 
                className="w-52 h-52 rounded-2xl shadow-sm border border-slate-200 bg-white p-2"
              />
              <p className="text-xs font-bold text-slate-700 mt-3 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#ca1535]" />
                <span>امسح الكود بكاميرا الموبايل لفتح خيارات الربط أو التحميل</span>
              </p>
            </>
          ) : (
            <div className="text-xs text-red-600 font-bold">تعذر تحميل كود QR، يرجى التأكد من تشغيل السيرفر.</div>
          )}
        </div>

        {/* Choice Explanation Pills */}
        <div className="grid grid-cols-2 gap-2 my-2 text-center text-[11px] font-bold">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <span className="block font-black mb-0.5">🔗 تفعيل الاتصال</span>
            <span className="text-[10px] text-emerald-600 font-medium">إذا كان التطبيق مثبتاً بالفعل</span>
          </div>
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800">
            <span className="block font-black mb-0.5">📥 تحميل التطبيق</span>
            <span className="text-[10px] text-red-600 font-medium">للهواتف الجديدة فقط</span>
          </div>
        </div>

        {/* Direct Link Box */}
        {downloadInfo?.downloadPageUrl && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>أو افتح الرابط مباشرة من متصفح الهاتف:</span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 text-[#ca1535] hover:text-[#a70d29] font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 text-left truncate dir-ltr select-all">
              {downloadInfo.downloadPageUrl}
            </div>
          </div>
        )}

        {/* Quick Instructions */}
        <div className="bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-600 space-y-2 border border-slate-100">
          <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>خطوات التثبيت على الهاتف:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-500">
            <li>تأكد من اتصال الهاتف بنفس شبكة الـ Wi-Fi المتصل بها الكمبيوتر.</li>
            <li>امسح الكود أعلاه واضغط على <strong>«تنزيل على أي حال»</strong>.</li>
            <li>افتح الملف واضغط <strong>«تثبيت (Install)»</strong> ثم افتح التطبيق لتوصيل الهاتف.</li>
          </ol>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 pt-4">
          <a
            href="/api/download/apk"
            download="AMN-Cash-Collector.apk"
            className="flex-1 py-3 bg-[#ca1535] hover:bg-[#a70d29] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 text-xs"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل نسخة للكمبيوتر ({downloadInfo?.apkSizeMB || '8.2'} MB)</span>
          </a>

          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
