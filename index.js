/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// import http servers
const http2 = require('http2')
const http = require('http')

// enable use of dotenv
require('dotenv').config()

// import config values
let config = require('./config/config')
let wg_config = require('./config/wireguard')
let texts = require('./config/texts')

// set up global context
const global = require('./global')
global.config = config
global.wg_config = wg_config
global.texts = texts
const {fetch, data, log} = global

// get request handler
const handle = require('./www/index')

// set up modules
log.init(config.logging)
fetch.init(`${__dirname}/www/static/`)
log.status("Initializing database")
data.init(`${__dirname}/data/`, config.salt, function (err) {
    if (err) {
        log.err(err)
    }
    log.status("Database initialized")
    // set up request handler
    handle.init(Object.freeze(global))
})

// handle all requests for both HTTPS and HTTP/2 or HTTP/nginx
const requestListener = function (req, res) {
    if (process.env.DEV) {
        req.headers.host = config.domain
        req.ip = process.env.IP
    }

    // if no authorization headers set it to false, to prevent errors
    req.headers.authorization ??= false
    // get requested host, HTTP/<=1.1 uses host, HTTP/>=2 uses :authority
    req.headers.host ??= req.headers[':authority']
    // set user agent to "NULL", to prevent errors
    req.headers['user-agent'] ??= "NULL"
    // make sure cookie is defined
    if (isNaN(req.headers.cookie)) req.headers.cookie = 0
    // get requesting IP
    req.ip ??= req.headers['x-real-ip'] || req.socket?.remoteAddress || req.connection?.remoteAddress || req.connection.socket?.remoteAddress

    // if request is not for any domain served here, act like server isn't here
    if (req.headers.host != config.domain) {
        log.con_err(req)
        return
    }

    // separate url arguments from the url itself
    [req.path, args] = req.url.split('?')

    // split arguments into key:value pairs
    req.args = {}
    if (args) {
        for (arg of args.split('&')) {
            arg = arg.split('=')
            req.args[arg[0]] = arg[1]
            // allow authentication using argument auth=<WWW-authenticate Basic>
            if (req.args.auth) req.headers.authorization ??= "Basic " + req.args.auth
        }
        delete args
    }

    // split url into path items
    req.path = req.path.split('/').slice(1)

    // log the request
    log.con(req)

    // wait for all data if posting
    if (req.method == 'POST') {
        buffer = []
        req.on('data', function(data) {
            buffer.push(data)
        })
        req.on('end', function() {
            req.data = {raw:Buffer.concat(buffer).toString()}
            req.data.raw.split('&').forEach(function (i) {
                [k,v] = i.split('=')
                if (k && v) {
                    req.data[k] = decodeURIComponent(v).replace(/\+/g,' ')
                }
            })
            req.post_data = req.data.post_data
            // forward the request to the handler
            handle.main(req, res)
        })
    }
    // other methods continue
    else {
        // forward the request to the handler
        handle.main(req, res)
    }
}


// Handle insecure HTTP requests
const insecureRequestListener = function (req, res) {
    // redirect request to HTTPS
    res.writeHead(307, {"Location": `https://${req.headers.host}${req.url}`})
    res.end()
}

if (!config.nginx) {
    // fetch https encryption keys
    log.status("Fetching encryption keys")
    fetch.key(config.private_key_path, function(private_key, err) {
        if (err) log.err("Failed fetching private key")
        fetch.key(config.server_cert_path, function(server_cert, err) {
            if (err) log.err("Failed fetching server certificate")
            fetch.key(config.ca_cert_path, function(ca_cert, err) {
                if (err) log.err("Failed fetching CA certificate")
                log.status("Encryption keys fetched")
                http2.createSecureServer({
                    key: private_key,
                    cert: server_cert,
                    ca: ca_cert,
                    allowHTTP1: true,
                    }, requestListener)
                    .listen(config.https_port, config.host, () => {
                        console.log(`\x1b[1mHTTP/2 & HTTPS server running on https://${config.domain}:${config.https_port}, interface '${config.host}'\n\x1b[0m`)
                    })
            })
        })
    })
}
// Start HTTP server
http.createServer(config.nginx ? requestListener : insecureRequestListener)
    .listen(config.http_port, config.host, () => {
        console.log(`\x1b[1mHTTP/1.1 server running on http://${config.domain}:${config.http_port}, interface '${config.host}'\n\x1b[0m`)
    })
