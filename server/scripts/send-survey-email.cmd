@echo off
REM Uses full path to Node so it works when node is not on PATH.
set "NODE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE%" set "NODE=node"
cd /d "%~dp0.."
"%NODE%" scripts/verify-stage7.js %*
