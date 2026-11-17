@echo off
setlocal
rem Abre o jogo direto, sem passar pelo launcher do Ren'Py.
rem
rem Precisa do SDK do Ren'Py 8.5 ou mais novo. Se ele nao estiver em
rem %LOCALAPPDATA%\Programs, defina a variavel RENPY_SDK com a pasta do SDK.

set "PROJETO=%~dp0."

if not defined RENPY_SDK (
    for /d %%D in ("%LOCALAPPDATA%\Programs\renpy-*-sdk") do set "RENPY_SDK=%%D"
)
if not exist "%RENPY_SDK%\renpy.exe" (
    echo Nao achei o SDK do Ren'Py.
    echo Baixe em https://www.renpy.org/latest.html e defina RENPY_SDK com a pasta dele.
    pause
    exit /b 1
)

start "" "%RENPY_SDK%\renpy.exe" "%PROJETO%"
