/* import external modules */
const nj = require('nunjucks').configure(['www/templates','www/extensions'])

/* import custom modules */
const microfetch = require('./modules/microfetch')
const Extension = require('./classes/extension')
const Tables = require('./classes/tables')
const fetch = require('./modules/fetch')
const data = require('./modules/data')
const log = require('./modules/log')
const db = require('./classes/db')

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

exports.nj = nj
exports.microfetch = microfetch
exports.Extension = Extension
exports.Tables = Tables
exports.fetch = fetch
exports.data = data
exports.log = log
exports.DB = db

exports.db = () => {return data.db()}
