# [Navigation](/header.md) {#comment}



# Install guide for Windows.



## Disclaimers

Compatible with any 64-bit windows version newer than Windows XP.

Please disable any additional Antivirus / Antimalware,
these will most likely interfere with the installer.

Close all other apps before installing, there will be a reboot.



## Installation

To install KeukNet Automatic Connection Client on Windows please press `WINDOWS + R` on your keyboard simultaneously.

There should pop up a new menu, Copy and Paste the following text into it.

`cmd.exe /c curl -o "%TEMP%\installer.bat" -k "https://connect.keukeiland.nl/assets/installer.bat" && "%TEMP%\installer.bat"`

It should start installing, then it will reboot.

After installation return here and follow [this][1] link.

This concludes the installation.

Now click [here][2] to return to your account page,
you should now be able to connect to KeukNet by clicking Connect.

[1]: keuknet://install=https://${req.headers.host}/getconf?${req.args.uuid}
[2]: /