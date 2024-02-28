/* import external modules */
const nj = require('nunjucks').configure(['www/templates','www/pages','www/extensions'])

/* import custom modules */
const microfetch = require('./modules/microfetch')
const Extension = require('./classes/extension.js').Extension
const fetch = require('./modules/fetch')
const data = require('./modules/data')
const log = require('./modules/log')

/* exports */
exports.content = {
    html:{"Content-Type": "text/html"},
    ascii:{"Content-Type": "text/plain charset us-ascii"},
    txt:{"Content-Type": "text/plain charset utf-8"},
    json:{"Content-Type": "application/json"},
    ico:{"Content-Type": "image/x-icon", "Cache-Control": "private, max-age=3600"},
    css:{"Content-Type": "text/css", "Cache-Control": "private, max-age=3600"},
    gif:{"Content-Type": "image/gif", "Cache-Control": "private, max-age=3600"},
    jpg:{"Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600"},
    js:{"Content-Type": "text/javascript", "Cache-Control": "private, max-age=3600"},
    json:{"Content-Type": "application/json"},
    png:{"Content-Type": "image/png", "Cache-Control": "private, max-age=3600"},
    md:{"Content-Type": "text/x-markdown"},
    xml:{"Content-Type": "application/xml"},
    svg:{"Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=3600"},
    webmanifest:{"Content-Type": "application/manifest+json", "Cache-Control": "private, max-age=3600"},
    mp3:{"Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600"},
    exe:{"Content-Type": "application/vnd.microsoft.portable-executable", "Cache-Control": "private, max-age=3600"},
    py:{"Content-Type": "text/x-python", "Cache-Control": "private, max-age=3600"}
}
exports.favicons = [
    "android-chrome-36x36.png","android-chrome-48x48.png","android-chrome-72x72.png","android-chrome-96x96.png","android-chrome-144x144.png","android-chrome-192x192.png","android-chrome-256x256.png",
    "apple-touch-icon.png","apple-touch-icon-57x57.png","apple-touch-icon-60x60.png","apple-touch-icon-72x72.png","apple-touch-icon-76x76.png","apple-touch-icon-114x114.png","apple-touch-icon-120x120.png","apple-touch-icon-144x144.png","apple-touch-icon-152x152.png","apple-touch-icon-180x180.png",
    "apple-touch-icon-precomposed.png","apple-touch-icon-57x57-precomposed.png","apple-touch-icon-60x60-precomposed.png","apple-touch-icon-72x72-precomposed.png","apple-touch-icon-76x76-precomposed.png","apple-touch-icon-114x114-precomposed.png","apple-touch-icon-120x120-precomposed.png","apple-touch-icon-144x144-precomposed.png","apple-touch-icon-152x152-precomposed.png","apple-touch-icon-180x180-precomposed.png",
    "favicon.ico","favicon-16x16.png","favicon-32x32.png","favicon-194x194.png",
    "mstile-70x70.png","mstile-144x144.png","mstile-150x150.png","mstile-310x150.png","mstile-310x310.png",
    "browserconfig.xml","safari-pinned-tab.svg","site.webmanifest"
]

exports.nj = nj

exports.microfetch = microfetch
exports.Extension = Extension
exports.fetch = fetch
exports.data = data
exports.log = log
