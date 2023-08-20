/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Should probably be moved to API

exports.main = function (req, res, global) {
    const {data} = global
    uuid = Object.values(req.args)[0]
    console.log(uuid)
    data.getConf(uuid, function (data, err) {
        if (err) {
            res.writeHead(404)
            res.end()
            return
        }
        res.writeHead(200, {"Content-Type": "text/plain charset utf-8", "Content-Disposition": `attachment; filename="keuknet.conf"`})
        res.end(data)
        return
    })
}