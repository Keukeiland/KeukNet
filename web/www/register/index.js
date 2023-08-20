/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { exec } = require('child_process')
const crypto = require('crypto')


exports.main = function (req, res, global) {
    const {content, data, fetch, salt} = global
    if (!req.headers.authorization) {
        res.writeHead(401, {"WWW-Authenticate": "Basic"})
        res.end()
        return
    }
    if (data.authenticate(req.headers.authorization)) {
        res.setHeader("Location", "/")
        res.writeHead(307)
        res.end()
        return
    }
    passwd = new Buffer.from(req.headers.authorization.slice(6), 'base64').toString('utf-8')
    username = passwd.split(":")[0].replaceAll(/[!@#$%^&*]/g, '')
    hash = crypto.pbkdf2Sync(passwd, salt, 10000, 512, 'sha512').toString('base64')
    passwd = " "*1024
    // Return Unauthorized 401 when attempted username is already registered
    if (data.exists(username)) {
        res.writeHead(401, {"WWW-Authenticate": "Basic"})
        res.end()
        return
    }
    // Generate a UUID for the VPN registration and log it
    uuid = crypto.randomUUID()
    console.log(`\x1b[33mRegistering user '${username}' for ${req.ip} and UUID "${uuid}"\x1b[0m`)
    // Register UUID to the VPN service, then get the assigned IP
    exec(`null=$(pivpn -a -n ${uuid}) && pivpn -c | grep -wsE '^${uuid}[^-]' - | grep -osE '\\bfdbe:126:f8f7:1:(:[0-9,a-f]{0,4}){1,4}\\b'`, (err, ip, stderr) => {
        if (err) {
            console.log(err)
            res.writeHead(500)
            res.end()
            return
        }
        // Add user to database
        data.addUser(username, hash, ip.replace('\n',""), uuid, function (err) {
            if (err) {
                res.writeHead(500)
                res.end()
                return
            }
            res.writeHead(307, {Location: `/install?uuid=${uuid}`})
            res.end()
        })
    })
}