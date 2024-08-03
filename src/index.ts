import sqlite3 from 'sqlite3'

// enable use of dotenv
require('dotenv').config()

// set up global context
import {cookie, config, Log} from './modules'
import * as modules from './modules'

const db = new (sqlite3.verbose()).Database(`${__dirname}/../data/db.sqlite`)

// get request handler
import Handle from './handle'
let handle = new Handle(modules, db)
// set up modules
const log: Log = new Log(config.logging)

// handle all requests for both HTTPS and HTTP/2 or HTTP/nginx
const requestListener = async function (req: Http2ServerRequest, res: Http2ServerResponse) {
    let ip: Context['ip']
    let cookies: Context['cookies']
    let args: Context['args']
    let path: Context['path']
    let data: Context['data']


    if (process.env.DEV) {
        req.headers.host = config.domain
        ip = process.env.IP || '0.0.0.0'
    }

    cookies = cookie.parse(req.headers.cookie || '')
    // get authorization info
    req.headers.authorization ??= cookies.auth
    // get requested host, HTTP/<=1.1 uses host, HTTP/>=2 uses :authority
    req.headers.host ??= req.headers[':authority']

    // If standalone
    if (!config.nginx) {
        // get requesting IP
        ip ??= req.socket?.remoteAddress || req.connection?.remoteAddress || '0.0.0.0'

        // if request is not for any domain served here, act like server isn't here
        if (req.headers.host != config.domain) {
            log.con_err(req)
            return
        }
    // If behind NGINX
    } else {
        // get requesting IP
        ip = req.headers['x-real-ip'] as string || '0.0.0.0'
    }

    {
        let raw_path: string
        let raw_args: string
        // separate url arguments from the url itself
        [raw_path, raw_args] = req.url.split('?')
    
        // split arguments into key:value pairs
        args = new Map<string, string>()
        if (raw_args) {
            for (let arg of raw_args.split('&')) {
                let [key, value] = arg.split('=')
                args.set(key, value)
            }
        }

        // split url into path items
        path = raw_path.split('/').slice(1)
    }
    
    // wait for all data if posting/putting
    if (req.method == 'POST' || req.method == 'PUT') {
        data = await new Promise((resolve) => {
            let buffer: Buffer[] = []
            req.on('data', function(data: Buffer) {
                buffer.push(data)
            })
            req.on('end', function() {
                let bytes = Buffer.concat(buffer)
                data = {
                    bytes,
                    raw: bytes.toString(),
                    form: {}
                }
                data.raw.split('&').forEach((i: string) => {    
                    let [k,v] = i.split('=')
                    if (!!k && !!v) {
                        // @ts-ignore
                        data.form[k] = decodeURIComponent(v).replace(/\+/g,' ')
                    }
                })
                resolve(data)
            })
        })
    }
    
    let ctx: Context = {
        req,
        res,
        path,
        args,
        cookies,
        ip,
        data
    }
    // log the request
    log.con(req, ctx)
    // forward the request to the handler
    handle.main(ctx)
}

// Redirect requests to HTTPS
const httpsRedirect = function (req: Http2ServerRequest, res: Http2ServerResponse) {
    res.writeHead(307, {"Location": `https://${req.headers.host}${req.url}`})
    res.end()
}


function startServer(http: boolean, https: boolean) {
    if (https) {
        let key = function (location: string, callback: (data?: any) => void) {
            require('fs').promises.readFile(location, "utf8")
            .then(callback)
            .catch((err: Error) => {
                log.err(`Failed fetching key at: '${location}'`)
                callback(undefined)
            })
        }

        log.status("Fetching encryption keys")
        // Private key
        key(config.private_key_path, function(private_key) {
            // Certificate
            key(config.server_cert_path, function(certificate) {
                // Certificate chain
                key(config.ca_cert_path, function(certificate_authority) {
                    log.status("Encryption keys fetched")
                    // Start server
                    require('http2')
                        .createSecureServer({
                            key: private_key,
                            cert: certificate,
                            ca: certificate_authority,
                            allowHTTP1: true,
                        }, requestListener)
                        .listen(
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
    