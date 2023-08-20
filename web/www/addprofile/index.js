/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { exec } = require('child_process')
const crypto = require('crypto')

exports.main = function (req, res, global) {
    const {data} = global
    id = data.authenticate(req.headers.authorization)
    
    if (!id) {
        res.writeHead(401)
        res.end()
        return
    }

    uuid = crypto.randomUUID()
    // Register UUID to the VPN service, then get the assigned IP
    exec(`null=$(pivpn -a -n ${uuid}) && pivpn -c | grep -wsE '^${uuid}[^-]' - | grep -osE '\\bfdbe:126:f8f7:1:(:[0-9,a-f]{0,4}){1,4}\\b'`, (err, ip, stderr) => {
        if (err) {
            console.log(err)
            res.writeHead(500)
            res.end()
            return
        }
        // Add user to database
        data.addProfile(id, ip.replace('\n',""), uuid, function (err) {
            if (err) {
                res.writeHead(500)
                res.end()
                return
            }
            res.writeHead(307, {Location: "/"})
            res.end()
            return
        })
    })
}