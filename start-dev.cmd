@echo off
set NODE_DIR=C:\Users\lucas.mochnack.MANHATTAN\AppData\Local\Temp\nodejs_extracted\node-v22.14.0-win-x64
set PATH=%NODE_DIR%;%PATH%
cd /d "%~dp0"
"%NODE_DIR%\npm.cmd" run dev
