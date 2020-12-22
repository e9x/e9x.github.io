@echo off
cd src
IF EXIST "*.jsc" DEL "*.jsc" /s
IF EXIST "app\*.jsc" DEL "app\*.jsc" /s
npm run start --dev
exit