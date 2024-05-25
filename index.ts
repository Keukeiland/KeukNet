/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

interface Handler {
    init(global: any): null,
    main(ctx: any): null
}


// enable use of dotenv
require('dotenv').config()

// set up global context
import {cookie, config} from './global'
import * as global from './global'
const {fetch, data} = Global
// import {Log} from './modules/log'


// get request handler
const handle: Handler = require('./www/index')
// set up modules
Global.Log
const log: Global.Log = new Global.Log(config.logging)
fetch.init(`${__dirname}/www/static/`)
log.status("Initializing database")
data.init(`${__dirname}/data/`, config.salt, function (err) {
    if (err) log.err(err)
    log.status("Database initialized")
    // set up request handler
    handle.init(global)
})

// handle all requests for both HTTPS and HTTP/2 or HTTP/nginx
const requestListener = function (req: Http2ServerRequest, res: Http2ServerResponse) {
    let ctx: any = {
        req,
        res
    }
    if (process.env.DEV) {
        req.headers.host = config.domain
        ctx.ip = process.env.IP
    }

    ctx.cookies = cookie.parse(req.headers.cookie || '')
    // get authorization info
    req.headers.authorization ??= ctx.cookies.auth
    // get requested host, HTTP/<=1.1 uses host, HTTP/>=2 uses :authority
    req.headers.host ??= req.headers[':authority']

    // If standalone
    if (!config.nginx) {
        // get requesting IP
        ctx.ip ??= req.socket?.remoteAddress || req.connection?.remoteAddress

        // if request is not for any domain served here, act like server isn't here
        if (req.headers.host != config.domain) {
            log.con_err(req)
            return
        }
    // If behind NGINX
    } else {
        // get requesting IP
        ctx.ip = req.headers['x-real-ip'] || '0.0.0.0'
    }

    let args: string
    // separate url arguments from the url itself
    [ctx.path, args] = req.url.split('?')

    // split arguments into key:value pairs
    ctx.args = {}
    if (args) {
        for (let arg of args.split('&')) {
            let [key, value] = arg.split('=')
            ctx.args[key] = value
            // allow authentication using argument auth=<WWW-authenticate Basic>
            if (ctx.args.auth) req.headers.authorization ??= "Basic " + ctx.args.auth
        }
    }

    // split url into path items
    ctx.path = ctx.path.split('/').slice(1)

    // log the request
    log.con(req, ctx)

    // wait for all data if posting
    if (req.method == 'POST') {
        let buffer: Buffer[] = []
        req.on('data', function(data: Buffer) {
            buffer.push(data)
        })
        req.on('end', function() {
            ctx.data = {raw:Buffer.concat(buffer).toString()}
            ctx.data.raw.split('&').forEach(function (i: string) {
                let [k,v] = i.split('=')
                if (k && v) {
                    ctx.data[k] = decodeURIComponent(v).replace(/\+/g,' ')
                }
            })
            ctx.post_data = ctx.data.post_data
            // forward the request to the handler
            handle.main(ctx)
        })
    }
    // other methods continue
    else {
        // forward the request to the handler
        handle.main(ctx)
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
    