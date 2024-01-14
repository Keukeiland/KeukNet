# KeukNet
A webserver and client program for easily managing a WireGuard-network in a client-server setting.

## How to set-up
Below is a simple tutorial on how to get the server up and running.

### Collect source code
`git clone https://github.com/keukeiland/keuknet`  
`cd keuknet`

### Configure
`cp config/config.js.example config/config.js`  
`cp config/wireguard.js.example config/wireguard.js`  
Now edit both `config/config.js` and `config/wireguard.js` to your taste.

### Install
`npm install`

### Run
Set-up is done now, run the server using:
`npm start` (or `sudo npm start`)

## Development
First follow *How to set-up*.

Install development dependencies: `npm install --include dev`

Run in dev mode with `npm run dev`.

You can disable domain-checking, spoof your IP etc using a `.env` (dotenv)-file in the root dir.

```text
.env-file options:
DEV="true" <- Disables domain checking and enables use of other options
IP="abcd:987:0::1234" <- Allows to override the client-IP
```

## License
The license found in `LICENSE` is only applicable to the source-code in this repo and does NOT include assets like favicons, logo's etc.
