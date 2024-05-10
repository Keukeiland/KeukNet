/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

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
    if (err) log.err(err)
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
    // make sure cookie is defined
    if (isNaN(req.headers.cookie)) req.headers.cookie = 0
    // get requested host, HTTP/<=1.1 uses host, HTTP/>=2 uses :authority
    req.headers.host ??= req.headers[':authority']

    // If standalone
    if (!config.nginx) {
        // get requesting IP
        req.ip ??= req.socket?.remoteAddress || req.connection?.remoteAddress || req.connection.socket?.remoteAddress

        // if request is not for any domain served here, act like server isn't here
        if (req.headers.host != config.domain) {
            log.con_err(req)
            return
        }
    // If behind NGINX
    } else {
        // get requesting IP
        req.ip = req.headers['x-real-ip']
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

// Redirect requests to HTTPS
const httpsRedirect = function (req, res) {
    res.writeHead(307, {"Location": `https://${req.headers.host}${req.url}`})
    res.end()
}


function startServer(http, https) {
    if (https) {
        log.status("Fetching encryption keys")
        // Private key
        fetch.key(config.private_key_path, function(key, err) {
            if (err) log.err("Failed fetching private key")
            // Certificate
            fetch.key(config.server_cert_path, function(cert, err) {
                if (err) log.err("Failed fetching server certificate")
                // Certificate chain
                fetch.key(config.ca_cert_path, function(ca, err) {
                    if (err) log.err("Failed fetching CA certificate")
                    log.status("Encryption keys fetched")
                    // Start server
                    require('http2').createSecureServer({
                        key,
                        cert,
                        ca,
                        allowHTTP1: true,
                    }, requestListener).listen(
                        config.https_port,
                        config.host,
                        () => log.serverStart("https", config.domain, config.host, config.https_port)
                    )
                })
            })
        })
    }
    if (http) {
        // Start server
        require('http').createServer(
            https ? httpsRedirect : requestListener
        ).listen(
            config.http_port,
            config.host,
            () => log.serverStart("http", config.domain, config.host, config.http_port)
        )
    }
}

startServer(true, !config.nginx)
    