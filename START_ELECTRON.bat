@echo off
chcp 65001 > nul
title AMN Cash - نافذة سطح المكتب المستقلة
cls
cd /d "%~dp0"
echo بدء تشغيل AMN Cash Desktop...
npx electron .
pause
