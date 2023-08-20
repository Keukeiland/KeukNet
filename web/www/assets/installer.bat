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

mshta "javascript:alert('Before continuing please safe all open documents.');close()"
@REM Create working dir
mkdir "%TEMP%\keuknetinstaller"
@REM Download latest WireGuard installer and do a passive install
curl -o "%TEMP%\keuknetinstaller\wireguard.exe" https://download.wireguard.com/windows-client/wireguard-installer.exe
"%TEMP%\keuknetinstaller\wireguard.exe" && taskkill /IM "wireguard.exe" /F
@REM Create a dir to store KeukNet scripts and download the protocolhandler to it
mkdir "%PROGRAMFILES%\KeukNet"
curl -o "%PROGRAMFILES%\KeukNet\protocolHandler.bat" -k https://connect.keukeiland.nl/assets/protocolHandler.bat
@REM Register the keuknet:// protocol in the Windows registery
reg add HKCR\keuknet /ve /d "URL:KeukNet"  /f
reg add HKCR\keuknet /v "URL Protocol" /d "" /f
reg add HKCR\keuknet\shell /f
reg add HKCR\keuknet\shell\open /f
reg add HKCR\keuknet\shell\open\command /d "\"C:\Program Files\keuknet\protocolHandler.bat\" "%%1"" /f
@REM Restart the PC to let WireGuard finish the install
shutdown /g /f /t 3 /d p:4:2 /c "Rebooting in 3 sec to finish KeukNet installation"