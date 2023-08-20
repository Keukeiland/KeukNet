# [Navigation](/header.md) {#comment}



# Install guide for Android.



## Disclaimers

Compatible with Android versions >= 5.0.

Please open this page on the device itself for easier installation.



## Installation

First off, install [WireGuard][1] on the device.

After installation you will need to download the config file below directly to the device,  
or to a PC. **This file can only be opened once, so avoid opening it on the wrong device!**

[keuknet.conf](/getconf?${req.args.uuid})

### Directly on device

If you have downloaded it directly to the device,  
open the WireGuard app, click on the **`+`** icon and select `Import from file or archive`.  
Then select the config file you downloaded.

### Using a PC

If you instead have it on a PC, open the file with NotePad,  
then open the WireGuard app, click on the **`+`** icon and select `Create from scratch`.  
Under `Interface` enter as name KeukNet,  
then proceed to enter the rest of the information specified under `[Interface]`.  
After that click on `Add peer` below the `Interface` box,  
then proceed to enter the information under `[Peer]` at the `Peer` box.

Empty containers don't matter, they will auto-fill after first connection.  
Now click the `Save` icon in the top right corner,  
this should return you to the main screen.

### Usage

Now you are all set to connect to KeukNet on your Android device.  
Anytime you want to connect just open the WireGuard app,  
tap the slider on the right side once to connect,  
and again after you are done to disconnect.


This concludes the installation.

Click [here][2] to return to your account page.

[1]: https://play.google.com/store/apps/details?id=com.wireguard.android
[2]: /