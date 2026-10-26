@echo off
chcp 65001 > nul
title AMN Cash - تشغيل النظام
cls
echo ======================================================================
echo             AMN Cash - إدارة معاملات فودافون كاش
echo ======================================================================
echo.
echo [1/3] فحص بيئة التشغيل ومجلد المشروع...
cd /d "%~dp0"

echo [2/3] بدء تشغيل الخادم الداخلي ونظام الاستقبال (Port 5500)...
start /b cmd /c "node server/server.js"

echo [3/3] بدء تشغيل واجهة المستخدم وتطبيق سطح المكتب...
timeout /t 2 /nobreak > nul

start http://localhost:5174
npm run dev

pause
