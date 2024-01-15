#!/usr/bin/env python
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# compile on linux with `sudo wine pyinstaller --onefile keuknet.py`
# cant run properly in wine!!
import os
import sys
import subprocess
from sys import argv as args
from sys import exit

DEBUG = True
HOST = "keuk.net"
DOWNLOAD_ARGS = "--no-progress-meter --fail"

# Constants
WINDOWS = os.name == 'nt'
OTHER = not WINDOWS

if OTHER and not os.geteuid() == 0:
    import notify2
    notify2.init("KeukNet client")
    def notify(content):
        notify2.Notification('KeukNet',content).show()
else:
    import builtins as __builtin__
    def notify(content):
        __builtin__.print(content)


def print(*args):
    if DEBUG:
        for arg in args:
            notify(str(arg))
    else:
        pass

def run(command):
    try:
        subprocess.run(command, shell=True, check=True, capture_output=True)
    except subprocess.CalledProcessError as err:
        print(f"error when running command'{command}'!")
        if WINDOWS:
            os.system(f"echo \"{err} {err.stderr.decode('utf8')}\" >> \"%TEMP%\\keuknet.log\"")
        if OTHER:
            os.system(f"echo \"{err}: {err.stderr.decode('utf8')}\" >>/tmp/keuknet.log")
        exit(1)
    

def admin():
    """Obtain admin privileges
    """
    if WINDOWS:
        import ctypes
        if not ctypes.windll.shell32.IsUserAnAdmin() == 1:
            ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv), None, 1)
            exit(0)
    if OTHER:
        if not os.geteuid() == 0:
            print("Script not started as root. Running sudo..")
            run(f"sudo {sys.executable} {' '.join(sys.argv)}")
            exit(0)

if WINDOWS:
    os.system(f"echo \">{args}\" >> \"%TEMP%\\keuknet.log\"")

# Check if valid uri
if not args[-1].startswith("keuknet://"):
    print("Called with incorrect or missing protocol")
    exit(1)

args = args[-1]
command = args.split("keuknet://",1)[1]
instruction, args = command.split("=") if "=" in command else [command,""]
instruction = instruction.split("&")[0] if "&" in instruction else instruction
instruction = instruction.split(";")[0] if ";" in instruction else instruction
args = args.split("&")[0] if "&" in args else args
args = args.split(";")[0] if ";" in args else args
args = args.split("/")[0] if "/" in args else args
print(command, instruction, args)

if WINDOWS:
    os.system(f"echo \">{instruction}!!{args}\" >> \"%TEMP%\\keuknet.log\"")

match instruction:
    case "install":
        notify("Installing new profile...")
        admin()
        if WINDOWS:
            os.system("del /F \"%PROGRAMFILES%\\WireGuard\\Data\\Configurations\\keuknet.conf.dpapi\"")
            run(f"curl -o \"%PROGRAMFILES%\\WireGuard\\Data\\Configurations\\keuknet.conf\" \"https://{HOST}/profile/getconf?{args}\" {DOWNLOAD_ARGS}")
        if OTHER:
            run(f"curl -o \"/etc/wireguard/keuknet.conf\" https://{HOST}/profile/getconf?{args} {DOWNLOAD_ARGS}")
    case "load":
        notify("Enabling keuknet...")
        admin()
        if WINDOWS:
            run("\"%PROGRAMFILES%\\WireGuard\\wireguard.exe\" /installtunnelservice \"%PROGRAMFILES%\\WireGuard\\Data\\Configurations\\keuknet.conf.dpapi\"")
        if OTHER:
            run("wg-quick up keuknet")
    case "unload":
        notify("Disabling keuknet...")
        admin()
        if WINDOWS:
            run("\"%PROGRAMFILES%\\WireGuard\\wireguard.exe\" /uninstalltunnelservice keuknet >nul")
        if OTHER:
            run("wg-quick down keuknet")
    case _:
        print("Invalid instruction")
