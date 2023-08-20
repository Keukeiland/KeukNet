/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { exec } = require('child_process')

const timeout = 60000
var remaining = 0

exports.main = function (req, res, global) {
    if (Date.now() - remaining >= timeout) {
        remaining = Date.now()
        exec("systemctl restart dnsmasq.service", (err, stdout, stderr) => {
            if (err) {
                console.log(err)
                res.writeHead(500)
                res.end()
                return
            }
            res.writeHead(307, {Location: "/"})
            res.end("200 SUCCESS, redirecting...")
        })
    }
    else {
        res.writeHead(429)
        res.end(`429 TOO MANY REQUESTS, please wait [${(timeout-(Date.now()-remaining))/1000} Sec]`)
    }
}