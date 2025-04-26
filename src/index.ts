import http2 from 'http2'
import http1, { IncomingMessage, RequestListener, ServerResponse } from 'http'
import Knex from 'knex'
import dotenv from 'dotenv'
import {cookie, config, Log } from './modules.ts'
import * as modules from './modules.ts'
import Handle from './handle.ts'

// enable use of dotenv
dotenv.config()

// init database
const knex = Knex({
    client: 'sqlite3',
    connection: {
        filename: `${import.meta.dirname}/../data/db.sqlite`
    },

    pool: {
        afterCreate: (con: any, cb: any) => {
           con.run('PRAGMA foreign_keys = ON', cb)
        },
    },

    /**
     * `_<name>_<table>` => selects `_<name>_<table>`
     * `_<table>`        => selects `_<prefix>_<table>`
     * `<table>`         => selects `<table>`
     */
    wrapIdentifier(value, origImpl, queryContext) {
        if (queryContext !== undefined && 'prefix' in queryContext) {
            if (value.startsWith('_')) {
                if (!value.substring(1).includes('_')) {
                    value = `_${queryContext.prefix}${value}`
                }
            }
        }
        return origImpl(value)
    },
})

// prepare database
if (!await knex.schema.hasTable('db_table_versions')) {
    await knex.schema
        .createTable('db_table_versions', (table) => {
            table.string('table_id').notNullable().unique()
            table.integer('version').notNullable().defaultTo(1)
        })
}
// get request handler
const handle = new Handle(modules)
handle.init(modules, knex)

// set up logging
const log = new Log(config.logging)

// handle all requests for both HTTPS and HTTP/2 or HTTP/nginx
async function requestListener(req: Http2ServerRequest, res: Http2ServerResponse) {
    let ip: Context['ip']
    let cookies: Context['cookies']
    let args: Context['args'] = new Map<string, string>()
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
        // separate url arguments from the url itself
        let [raw_path = req.url, raw_args = ''] = req.url.split('?', 2)
    
        // split arguments into key:value pairs
        if (raw_args != '') {
            for (let arg of raw_args.split('&')) {
                let [key, value] = arg.split('=', 2)
                if (!(key === undefined || value === undefined))
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
                let bytes = Buffer.concat(buffer as readonly Uint8Array[])
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
    
    let ctx: PartialContext = {
        req,
        res,
        path,
        args,
        cookies,
        ip,
        data,
    }
    // log the request
    log.con(req, ctx)
    // forward the request to the handler
    handle.main(ctx)
}

function requestListenerCompat(req: IncomingMessage, res: ServerResponse) {
    const new_req = {
        authority: req.headers.host ?? '',
        scheme: new URL(req.url ?? '').protocol,
        ...req,
    } as unknown as Http2ServerRequest

    const new_res = {
        ...res,
    } as unknown as Http2ServerResponse

    return requestListener(new_req, new_res)
}

// Redirect requests to HTTPS
function httpsRedirect(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(307, {"Location": `https://${req.headers.host}${req.url}`})
    res.end()
}


async function startServer(http_enabled: boolean, https_enabled: boolean) {
    if (https_enabled) {
        let key = async (location: string) => {
            return new Promise<string | undefined>(async (resolve, reject) => {
                (await import('fs')).promises.readFile(location, "utf8")
                .then(resolve)
                .catch((err: Error) => {
                    log.err(`Failed fetching key at: '${location}'`)
                    resolve(undefined)
                })
            })
        }

        log.status("Fetching encryption keys")

        const private_key = await key(config.private_key_path)
        const certificate = await key(config.server_cert_path)
        const certificate_authority = await key(config.ca_cert_path)

        log.status("Encryption keys fetched")

        // Start server
        http2.createSecureServer({
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
    }
    if (http_enabled) {
        // Start server
        http1.createServer(
            https_enabled ? httpsRedirect : requestListener as unknown as RequestListener
        ).listen(
            config.http_port,
            config.host,
            () => log.serverStart("http", config.domain, config.host, config.http_port)
        )
    }
}

startServer(true, !config.nginx)
