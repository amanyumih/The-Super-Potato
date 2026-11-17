@echo off
setlocal
rem Roda o lint e os testes automatizados do jogo.
rem
rem   testar.bat            lint + todos os testes
rem   testar.bat capturas   gera capturas de tela em tests\screenshots para conferir o visual
rem
rem Precisa do SDK do Ren'Py 8.5 ou mais novo. Se ele nao estiver em
rem %LOCALAPPDATA%\Programs, defina a variavel RENPY_SDK com a pasta do SDK.

set "PROJETO=%~dp0."

if not defined RENPY_SDK (
    for /d %%D in ("%LOCALAPPDATA%\Programs\renpy-*-sdk") do set "RENPY_SDK=%%D"
)
if not exist "%RENPY_SDK%\renpy.py" (
    echo Nao achei o SDK do Ren'Py.
    echo Baixe em https://www.renpy.org/latest.html e defina RENPY_SDK com a pasta dele.
    exit /b 1
)
set "PY=%RENPY_SDK%\lib\py3-windows-x86_64\python.exe"

if /i "%~1"=="capturas" (
    "%PY%" "%RENPY_SDK%\renpy.py" "%PROJETO%" test global.capturas --overwrite-screenshots
    exit /b %errorlevel%
)

echo === Lint ===
"%PY%" "%RENPY_SDK%\renpy.py" "%PROJETO%" lint
if errorlevel 1 exit /b 1

echo.
echo === Testes ===
"%PY%" "%RENPY_SDK%\renpy.py" "%PROJETO%" test --report-detailed --hide-execution all
exit /b %errorlevel%
