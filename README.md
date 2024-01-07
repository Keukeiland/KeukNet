# KeukNet
The source-code of the KeukNet connection web interface.

The license found in LICENSE is only applicable to the source-code in this repo and does NOT include assets like favicons, logo's etc.

# Known bugs

- Logging out on firefox is not possible without clearing cached website credentials, which is currently only possible to do by the user themselves.
^ should be possible to patch with JS+AJAX

- When authenticating there may appear an 401 HTTP STATUS error screen, this means your cookie is broken and needs to be reset. This is non-fatal but just makes some features less user-friendly.
