/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

exports.main = function (req, res, global) {
    res.writeHead(401)
    res.end(`<html><head><script>
    window.onload = function() {
    window.location.replace("https://${req.headers.host}/");}
    </script></head></html>`)
}