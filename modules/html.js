/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// const md = new require('showdown').Converter({customizedHeaderId: true})

const _patches = {
    default: /\${req.headers.host}|\${req.user}|\${req.status}|\${req.url}/g,
    uuid: /\${req.args.uuid}/g
}



exports.patch = function (data, req, patch) {
    patch.forEach(function (currentPatch) {
        data = data.replaceAll(_patches[currentPatch], (m) => eval(m.substring(2, m.length-1)))
    })
    return data
}