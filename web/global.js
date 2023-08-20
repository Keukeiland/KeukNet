/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/* import custom modules */
const fetch = require('../modules/fetch')
const data = require('../modules/data')
const html = require('../modules/html')
const servers = require('../modules/servers')
const {salt} = require('./config')


/* set consts */
const domain = __dirname.substr(__dirname.lastIndexOf('/') +1, __dirname.length -1)

/* exports */
exports.content = {
    html:{"Content-Type": "text/html"},
    ascii:{"Content-Type": "text/plain charset us-ascii"},
    txt:{"Content-Type": "text/plain charset utf-8"},
    json:{"Content-Type": "application/json"},
    ico:{"Content-Type": "image/x-icon", "Cache-Control": "private, max-age=3600"},
    css:{"Content-Type": "text/css"},
    gif:{"Content-Type": "image/gif"},
    jpg:{"Content-Type": "image/jpeg"},
    js:{"Content-Type": "text/javascript"},
    json:{"Content-Type": "application/json"},
    png:{"Content-Type": "image/png", "Cache-Control": "private, max-age=3600"},
    md:{"Content-Type": "text/x-markdown"},
    xml:{"Content-Type": "application/xml"},
    svg:{"Content-Type": "image/svg+xml"},
    webmanifest:{"Content-Type": "application/manifest+json", "Cache-Control": "private, max-age=3600"},
    mp3:{"Content-Type": "audio/mpeg"}
}
exports.favicons = [
    "android-chrome-36x36.png","android-chrome-48x48.png","android-chrome-72x72.png","android-chrome-96x96.png","android-chrome-144x144.png","android-chrome-192x192.png","android-chrome-256x256.png",
    "apple-touch-icon.png","apple-touch-icon-57x57.png","apple-touch-icon-60x60.png","apple-touch-icon-72x72.png","apple-touch-icon-76x76.png","apple-touch-icon-114x114.png","apple-touch-icon-120x120.png","apple-touch-icon-144x144.png","apple-touch-icon-152x152.png","apple-touch-icon-180x180.png",
    "apple-touch-icon-precomposed.png","apple-touch-icon-57x57-precomposed.png","apple-touch-icon-60x60-precomposed.png","apple-touch-icon-72x72-precomposed.png","apple-touch-icon-76x76-precomposed.png","apple-touch-icon-114x114-precomposed.png","apple-touch-icon-120x120-precomposed.png","apple-touch-icon-144x144-precomposed.png","apple-touch-icon-152x152-precomposed.png","apple-touch-icon-180x180-precomposed.png",
    "favicon.ico","favicon-16x16.png","favicon-32x32.png","favicon-194x194.png",
    "mstile-70x70.png","mstile-144x144.png","mstile-150x150.png","mstile-310x150.png","mstile-310x310.png",
    "browserconfig.xml","safari-pinned-tab.svg","site.webmanifest"
]
exports.domain = domain
exports.fetch = fetch
exports.data = data
exports.html = html
exports.servers = servers


/* initiation and setup */
fetch.initiate(domain, __dirname)
data.setPath(__dirname + "/userdata.json")
data.setSalt(salt)
data.load(function (err) {})
servers.init(__dirname + "/servers.json")