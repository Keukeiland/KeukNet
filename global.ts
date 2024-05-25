import type * as NJ from 'nunjucks'

declare global {
    namespace Global {
        export const content: {}
        export const favicons: []
        
        /* import external modules */
        export const nj: NJ.Environment
        
        export const microfetch: any
        export const Extension: any
        export const Tables: any
        export const fetch: any
        export const data: any
        export const DB: any
        
        export function db(): void

        export namespace Log {

        }
    }

    // export * as cookie from 'cookie'

    // export const Log

    // export * as config from './config/config'
    // export * as wg_config from './config/wireguard'
    // export * as texts from './config/texts'
}

namespace Global {
    export const content = {
        html:{"Content-Type": "text/html"},
        ascii:{"Content-Type": "text/plain charset us-ascii"},
        txt:{"Content-Type": "text/plain charset utf-8"},
        json:{"Content-Type": "application/json"},
        ico:{"Content-Type": "image/x-icon", "Cache-Control": "private, max-age=3600"},
        css:{"Content-Type": "text/css", "Cache-Control": "private, max-age=3600"},
        gif:{"Content-Type": "image/gif", "Cache-Control": "private, max-age=3600"},
        jpg:{"Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600"},
        js:{"Content-Type": "text/javascript", "Cache-Control": "private, max-age=3600"},
        png:{"Content-Type": "image/png", "Cache-Control": "private, max-age=3600"},
        md:{"Content-Type": "text/x-markdown"},
        xml:{"Content-Type": "application/xml"},
        svg:{"Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=3600"},
        webmanifest:{"Content-Type": "application/manifest+json", "Cache-Control": "private, max-age=3600"},
        mp3:{"Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600"},
        exe:{"Content-Type": "application/vnd.microsoft.portable-executable", "Cache-Control": "private, max-age=3600"},
        py:{"Content-Type": "text/x-python", "Cache-Control": "private, max-age=3600"}
    }
    export const favicons = [
        "android-chrome-36x36.png","android-chrome-48x48.png","android-chrome-72x72.png","android-chrome-96x96.png","android-chrome-144x144.png","android-chrome-192x192.png","android-chrome-256x256.png",
        "apple-touch-icon.png","apple-touch-icon-57x57.png","apple-touch-icon-60x60.png","apple-touch-icon-72x72.png","apple-touch-icon-76x76.png","apple-touch-icon-114x114.png","apple-touch-icon-120x120.png","apple-touch-icon-144x144.png","apple-touch-icon-152x152.png","apple-touch-icon-180x180.png",
        "apple-touch-icon-precomposed.png","apple-touch-icon-57x57-precomposed.png","apple-touch-icon-60x60-precomposed.png","apple-touch-icon-72x72-precomposed.png","apple-touch-icon-76x76-precomposed.png","apple-touch-icon-114x114-precomposed.png","apple-touch-icon-120x120-precomposed.png","apple-touch-icon-144x144-precomposed.png","apple-touch-icon-152x152-precomposed.png","apple-touch-icon-180x180-precomposed.png",
        "favicon.ico","favicon-16x16.png","favicon-32x32.png","favicon-194x194.png",
        "mstile-70x70.png","mstile-144x144.png","mstile-150x150.png","mstile-310x150.png","mstile-310x310.png",
        "browserconfig.xml","safari-pinned-tab.svg","site.webmanifest"
    ]
    
    /* import external modules */
    export const nj: NJ.Environment = require('nunjucks').configure(['www/templates','www/pages','www/extensions'])
    
    export const microfetch: any = require('./modules/microfetch')
    export const Extension: any = require('./classes/extension')
    export const Tables: any = require('./classes/tables')
    export const fetch: any = require('./modules/fetch')
    export const data: any = require('./modules/data')
    export const DB: any = require('./classes/db')
    
    export function db(): void {return data.db()}

}

export * as cookie from 'cookie'

// export {Log} from './modules/log'

export * as config from './config/config'
export * as wg_config from './config/wireguard'
export * as texts from './config/texts'

export {Global}
