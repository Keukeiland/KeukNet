#!/usr/bin/env python
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
import os
import sys
from sys import exit

# Config values
HOST = "connect.keukeiland.nl"
DOWNLOAD_ARGS = "--no-progress-meter --fail"
OTHER_DESKTOP_FILES_DIR = "/usr/share/applications"
OTHER_BINARIES_DIR = "/usr/bin"
OTHER_DEPENDENCIES = {
    'wg': "WireGuard",
    'xdg-mime': "XDG",
    'curl': "cURL",
    'chmod': "chmod"
}

# Constants
WINDOWS = os.name == 'nt'
OTHER = not WINDOWS


# Initialization
if WINDOWS:
    import ctypes
    # Privileges
    if not ctypes.windll.shell32.IsUserAnAdmin() == 1:
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv), None, 1)
        exit(1)
    # Confirmation
    os.system("mshta \"javascript:alert('Before continuing please save all open files.');close()\"")
if OTHER:
    # Privileges
    if not os.geteuid() == 0:
        print("Not running as root, cancelling install...")
        exit(1)
    # Confirmation
    input(f"This script will install:\n'keuknet.desktop' to '{OTHER_DESKTOP_FILES_DIR}'\n'keuknet.py' to '{OTHER_BINARIES_DIR}'\nPress 'CTRL+C' to cancel or 'Enter/Return' to continue.")


# Preparation
if WINDOWS:
    os.system("mkdir \"%TEMP%\\keuknetinstaller\"")
    os.system(f"curl -o \"%TEMP%\\keuknetinstaller\\wireguard.exe\" https://download.wireguard.com/windows-client/wireguard-installer.exe {DOWNLOAD_ARGS}")
    os.system(f"curl -o \"%TEMP%\\keuknetinstaller\\keuknet.exe\" https://{HOST}/assets/keuknet.exe {DOWNLOAD_ARGS}")
    os.system("mkdir \"%PROGRAMFILES%\\KeukNet\"")
if OTHER:
    if not os.path.isdir(OTHER_DESKTOP_FILES_DIR) or not os.path.isdir(OTHER_BINARIES_DIR):
        print("Unusual file-system lay-out detected. Is your OS UNIX-compliant?\nIf not please edit this script to use the correct paths.")
        exit(1)
    for cmd, name in OTHER_DEPENDENCIES.items():
        if os.system(f"{cmd} --version >/dev/null") != 0:
            print(f"{name} not available at '{cmd}'. Please install a package that provides {cmd}.")
            exit(1)


# Installation
if WINDOWS:
    os.system("%TEMP%\\keuknetinstaller\\wireguard.exe && taskkill /IM wireguard.exe /F")
    os.system("move \"%TEMP%\\keuknetinstaller\\keuknet.exe\" \"%PROGRAMFILES%\\KeukNet\\keuknet.exe\"")
    os.system("reg add HKCR\\keuknet /ve /d \"URL:KeukNet\"  /f")
    os.system("reg add HKCR\\keuknet /v \"URL Protocol\" /d "" /f")
    os.system("reg add HKCR\\keuknet\\shell /f")
    os.system("reg add HKCR\\keuknet\\shell\\open /f")
    os.system("reg add HKCR\\keuknet\\shell\\open\\command /d \"\\\"C:\\Program Files\\KeukNet\\keuknet.exe\\\" \"%1\"\" /f")
if OTHER:
    os.system(f"curl -o \"{OTHER_DESKTOP_FILES_DIR}/keuknet.desktop\" https:/{HOST}/assets/keuknet.desktop {DOWNLOAD_ARGS}")
    os.system(f"curl -o \"{OTHER_BINARIES_DIR}/keuknet.py\" https:/{HOST}/assets/keuknet.py {DOWNLOAD_ARGS}")
    os.system(f"chmod +x \"{OTHER_BINARIES_DIR}/keuknet.py\"")
    os.system("xdg-mime default keuknet.desktop x-scheme-handler/keuknet")


# Finalization
if WINDOWS:
    os.system("shutdown /g /f /t 3 /d p:4:2 /c \"Rebooting in 3 sec to finish KeukNet installation\"")
if OTHER:
    print("Successfully installed the KeukNet client.")
