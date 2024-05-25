import { Http2ServerRequest } from "http2";

declare global {
    namespace Global {
        export interface Log {
            con(req: any, ctx: any): void,
            con_err(req: any): void,
            status(msg: string): void,
            err(err: string): void,
            serverStart(type: string, domain: string, host: string, port: number): void
        }
        
        export class Log {
            we_logging: boolean
    
            constructor(we_log: boolean)
    
            __mask_ip(ip: string): string
            __mask_url(url: string): string
    
            con(req: Http2ServerRequest, ctx: { ip: any }): void
            con_err(req: Http2ServerRequest): void
            status(msg: string): void
            err(err: string): void
            serverStart(type: string, domain: string, host: string, port: number): void
        }
    }
}

namespace Global {
    export interface Log {
        con(req: any, ctx: any): void,
        con_err(req: any): void,
        status(msg: string): void,
        err(err: string): void,
        serverStart(type: string, domain: string, host: string, port: number): void
    }
    
    export class Log {
        we_logging = false;
    
        constructor(we_log: boolean) {
            this.we_logging = we_log
        }
    
        __mask_ip(ip: string) {
            let tmp = ""
            // if IPv4
            if (ip.includes('.')) {
                // strip 4to6 prefix
                ip = ip.substring(ip.lastIndexOf(':') + 1, ip.length)
                // mask ip
                ip.split('.').forEach(function (quad: string, index: number) {
                    quad = quad.padStart(3, "0")
                    if (index <= 2) tmp += quad + "."
                    if (index == 2) tmp += "*"
                })
            }
            else {
                // mask ip
                ip.split(':').forEach(function (quad: string, index: number) {
                    quad = quad.padStart(4, "0")
                    if (index <= 3) tmp += quad + ":"
                    if (index == 3) tmp += "*"
                })
            }
            return tmp
        }
    
        __mask_url(url: string) {
            return url.split('?')[0]
        }
    
        con(req: { url: any; method: any; httpVersion: any; headers: { [x: string]: any; authorization: any } }, ctx: { ip: any }) {
            if (this.we_logging) {
                let ip = this.__mask_ip(ctx.ip)
                let url = this.__mask_url(req.url)
                console.log(
                    `\x1b[32m    [${ip}]=>'${req.method} ${url}
                    HTTP/${req.httpVersion} ${(req.headers['user-agent'] ?? "NULL").split(" ", 1)[0]} ${req.headers.authorization ? "auth" : "noauth"}\x1b[0m`
                )
            }
        }
    
        con_err(req: { ip: any; headers: { host: any } }) {
            if (this.we_logging) {
                let ip = this.__mask_ip(req.ip)
                console.log(
                    `\x1b[35m  DEN[${ip}]: '${req.headers.host}'\x1b[0m`
                )
            }
        }
    
        status(msg: any) {
            console.log(`\x1b[34m>> ${msg}\x1b[0m`)
        }
    
        err(err: any) {
            console.log(`\x1b[31m>> ${err}\x1b[0m`)
        }
    
        serverStart(type: string, domain: any, host: any, port: any) {
            console.log(`\x1b[1m${type.toUpperCase()} server running on ${type}://${domain}:${port}, interface '${host}'\n\x1b[0m`)
        }
    }
}
