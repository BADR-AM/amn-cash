import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import TitleBar from './components/TitleBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Transactions from './components/Transactions.jsx';
import FeeCalculator from './components/FeeCalculator.jsx';
import Reports from './components/Reports.jsx';
import DevicesAndSync from './components/DevicesAndSync.jsx';
import SettingsView from './components/SettingsView.jsx';
import SmsSimulatorModal from './components/SmsSimulatorModal.jsx';
import PhoneCompanionSidecar from './components/PhoneCompanionSidecar.jsx';
import DownloadApkModal from './components/DownloadApkModal.jsx';

import { 
  playCashInSound, 
  playCashOutSound, 
  playDeviceDisconnectedSound, 
  playDeviceConnectedSound 
} from './utils/audioAlerts.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [period, setPeriod] = useState('week');
  const [showPhone, setShowPhone] = useState(false); // Clean desktop dashboard by default
  
  const [stats, setStats] = useState({
    totalIncomingEGP: 0,
    totalWithdrawalsEGP: 0,
    totalFeesEGP: 0,
    totalCostEGP: 0,
    totalProfitEGP: 0,
    totalCount: 0,
    incomingCount: 0,
    withdrawalCount: 0,
    otherCount: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({});
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState('منذ ثوانٍ');
  const [toastNotification, setToastNotification] = useState(null);
  
  // Real-time Phone Connection Status (Connected / Disconnected / Offline)
  const [phoneStatus, setPhoneStatus] = useState({
    isConnected: false,
    deviceName: 'لا يوجد هاتف متصل',
    lastSync: 'غير متصل'
  });

  const fetchPhoneStatus = async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      if (data.success && data.data.devices) {
        const connectedDevice = data.data.devices.find(d => d.status === 'CONNECTED');
        if (connectedDevice) {
          setPhoneStatus({
            isConnected: true,
            deviceName: connectedDevice.device_name || 'هاتف Android',
            lastSync: connectedDevice.last_sync || 'الآن'
          });
        } else {
          setPhoneStatus({
            isConnected: false,
            deviceName: data.data.devices[0]?.device_name || 'لا يوجد هاتف',
            lastSync: 'غير متصل (الموبايل مغلق)'
          });
        }
      }
    } catch (e) {
      setPhoneStatus(prev => ({ ...prev, isConnected: false }));
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const statsRes = await fetch(`/api/stats?period=${period}`);
      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setStats(prev => ({ ...prev, ...statsJson.data }));
      }

      const txRes = await fetch('/api/transactions?limit=100');
      const txJson = await txRes.json();
      if (txJson.success) {
        setTransactions(txJson.data || []);
      }

      const setRes = await fetch('/api/settings');
      const setJson = await setRes.json();
      if (setJson.success) {
        setSettings(setJson.data);
      }

      setIsOnline(true);
      setLastSync('منذ ثوانٍ');
    } catch (err) {
      console.warn('Backend server connecting...');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPhoneStatus();
    
    // Check phone live status periodically every 8s
    const statusTimer = setInterval(fetchPhoneStatus, 8000);
    return () => clearInterval(statusTimer);
  }, [period]);

  // Real-time SSE Connection
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource('/api/events');
      
      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'NEW_TRANSACTION') {
            fetchData();
            // Play financial audio alert according to transaction type!
            if (msg.data.type === 'INCOMING') {
              playCashInSound(); // Rich Ka-Ching / Cash register bell!
            } else if (msg.data.type === 'WITHDRAWAL') {
              playCashOutSound(); // 2-tone cash payout
            } else {
              playCashInSound(0.6);
            }

            setToastNotification({
              title: msg.data.type === 'INCOMING' ? '✓ تحويل وارد جديد' : '↑ عملية سحب جديدة',
              type: msg.data.type,
              amount: msg.data.amountEGP,
              phone: msg.data.senderOrRecipient,
              profit: msg.data.profitEGP
            });
            setTimeout(() => setToastNotification(null), 6000);
          } else if (msg.type === 'DEVICE_STATUS_CHANGED') {
            if (msg.data.status === 'CONNECTED') {
              playDeviceConnectedSound();
              setPhoneStatus({
                isConnected: true,
                deviceName: msg.data.deviceName || 'هاتف Android',
                lastSync: 'الآن'
              });
              setToastNotification({
                title: '✓ هاتف المحل متصل الآن',
                message: `تم ربط هاتف ${msg.data.deviceName || ''} بنجاح وجاهز لاستقبال التحويلات`,
                type: 'SUCCESS'
              });
            } else if (msg.data.status === 'DISCONNECTED') {
              playDeviceDisconnectedSound(); // Loud double warning beep!
              setPhoneStatus(prev => ({
                ...prev,
                isConnected: false,
                lastSync: 'غير متصل (مغلق)'
              }));
              setToastNotification({
                title: '⚠️ تحذير: انقطع اتصال الهاتف بالمحل!',
                message: msg.data.message || 'الهاتف غير متصل بالشبكة أو تم إغلاقه.',
                type: 'WARNING'
              });
            }
            setTimeout(() => setToastNotification(null), 6000);
          } else if (msg.type === 'TRANSACTION_UPDATED') {
            fetchData();
          } else if (msg.type === 'SETTINGS_UPDATED') {
            setSettings(prev => ({ ...prev, ...msg.data }));
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      eventSource.onerror = () => setIsOnline(false);
      eventSource.onopen = () => setIsOnline(true);
    } catch (e) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Save Settings handler
  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, ...newSettings }));
      }
    } catch (err) {
      alert('فشل حفظ الإعدادات: ' + err.message);
    }
  };

  // Test SMS from the phone sidecar
  const handlePhoneTestSms = async () => {
    const testAmount = Math.floor(Math.random() * 4 + 1) * 1000;
    const testSms = `تم استلام مبلغ ${testAmount}.00 جنيه من رقم 01012345678 رصيدك الحالي هو 25,000.00 جنيه رقم العملية ${Date.now().toString().slice(-8)}`;
    
    try {
      await fetch('/api/sms/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smsText: testSms,
          deviceId: 'phone_sidecar'
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f3f5f8] text-[#192336] overflow-hidden font-sans select-none">
      
      {/* 1. Windows Window Title Bar Matching Image 1 Header */}
      <TitleBar 
        showPhone={showPhone} 
        setShowPhone={setShowPhone} 
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* 2. Main Window Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Matching Image 1 */}
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          isOnline={isOnline}
          lastSync={lastSync}
          phoneStatus={phoneStatus}
        />

        {/* Desktop Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f3f5f8]">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            {currentTab === 'dashboard' && (
              <Dashboard 
                stats={stats}
                recentTransactions={transactions.slice(0, 6)}
                onNavigateToTransactions={() => setCurrentTab('transactions')}
                period={period}
                setPeriod={setPeriod}
                settings={settings}
                onRefresh={fetchData}
              />
            )}

            {currentTab === 'transactions' && (
              <Transactions 
                transactions={transactions}
                settings={settings}
                onRefresh={fetchData}
                onNavigateToFees={() => setCurrentTab('fees')}
              />
            )}

            {currentTab === 'fees' && (
              <FeeCalculator 
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            )}

            {currentTab === 'reports' && (
              <Reports 
                transactions={transactions}
              />
            )}

            {currentTab === 'devices' && (
              <DevicesAndSync 
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                phoneStatus={phoneStatus}
                onRefreshPhoneStatus={fetchPhoneStatus}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView 
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            )}
          </main>
        </div>

        {/* 3. Live Phone Companion Sidecar Matching Image 1 (Side-by-side view) */}
        {showPhone && (
          <PhoneCompanionSidecar 
            isConnected={isOnline}
            onSendTestSms={handlePhoneTestSms}
            totalSent={stats.incomingCount || 24}
          />
        )}

      </div>

      {/* 4. Global Interactive SMS Simulator Modal */}
      <SmsSimulatorModal 
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onTransactionCreated={fetchData}
      />

      {/* 5. Mobile Companion APK Download Modal via QR Code */}
      <DownloadApkModal 
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* 5. Live Incoming Transaction Toast Alert */}
      {toastNotification && (
        <div className="fixed top-14 left-6 z-50 bg-white border-2 border-emerald-500 rounded-2xl shadow-2xl p-4 flex items-center gap-3.5 max-w-sm animate-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            {toastNotification.type === 'INCOMING' ? (
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div className="flex-1 text-right text-xs">
            <span className="font-extrabold text-slate-900 block text-sm">
              تم رصد معاملة فودافون كاش جديدة!
            </span>
            <span className="text-slate-600 font-medium block">
              {toastNotification.phone} • بمبلغ <strong className="font-bold text-slate-900">{toastNotification.amount} ج</strong>
            </span>
            {toastNotification.profit > 0 && (
              <span className="text-emerald-600 font-bold block mt-0.5">
                الربح الصافي: +{toastNotification.profit} ج
              </span>
            )}
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
