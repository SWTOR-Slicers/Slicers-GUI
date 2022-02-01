@echo OFF
if "%~1"=="" goto MISSING_PARAM

git commit -m %1
EXIT

:MISSING_PARAM

echo Missing commit message
EXIT