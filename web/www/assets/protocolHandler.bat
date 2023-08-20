@REM Add system32 to path for fucked up windows installations
set PATH=%PATH%;c:\windows\system32

@REM https://stackoverflow.com/a/10052222/15181929
:: BatchGotAdmin
:-------------------------------------
REM  --> Check for permissions
    IF "%PROCESSOR_ARCHITECTURE%" EQU "amd64" (
>nul 2>&1 "%SYSTEMROOT%\SysWOW64\cacls.exe" "%SYSTEMROOT%\SysWOW64\config\system"
) ELSE (
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
)

REM --> If error flag set, we do not have admin.
if '%errorlevel%' NEQ '0' (
    echo Requesting administrative privileges...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params= %*
    echo UAC.ShellExecute "cmd.exe", "/c ""%~s0"" %params:"=""%", "", "runas", 1 >> "%temp%\getadmin.vbs"

    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    pushd "%CD%"
    CD /D "%~dp0"
:--------------------------------------
@REM https://stackoverflow.com/a/10052222/15181929


if "%1" == "keuknet://install" (
    if exist "%PROGRAMFILES%\WireGuard\Data\Configurations\keuknet.conf.dpapi" (
        del /F "%PROGRAMFILES%\WireGuard\Data\Configurations\keuknet.conf.dpapi"
    )
    curl -o "%PROGRAMFILES%\WireGuard\Data\Configurations\keuknet.conf" -k "%2?%3"
) else if "%1" == "keuknet://unload" (
    "%PROGRAMFILES%\WireGuard\wireguard.exe" /uninstalltunnelservice keuknet >nul
) else if "%1" == "keuknet://load" (
    "%PROGRAMFILES%\WireGuard\wireguard.exe" /installtunnelservice "%PROGRAMFILES%\WireGuard\Data\Configurations\keuknet.conf.dpapi"
)
