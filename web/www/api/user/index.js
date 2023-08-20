/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

exports.main = function (req, res, global) {
    const {data, content} = global
    if (req.args.ip) {
        data.whoOwnsIp(req.args.ip, function (id) {
            res.writeHead(200, content['json'])
            res.end(JSON.stringify({"name":id}))
        })
    }
}