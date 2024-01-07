/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import('node-fetch')

exports.get = function () {
    var serverlist = []
    for (let [server, description] of Object.entries(serverdata)) {
        serverlist.push([server,description])
    }
    return serverlist
}

exports.addServer = function (url, callback) {
    httpRequest(`http://${url}/description.md`, function (description, err) {
        if (err) {
            delete serverdata[url]
            return callback(err)
        }
        
        serverdata[url] = description

        _save(function (err) {
            if (err) return callback(err)
            return callback()
        })
    })
}

const httpRequest = async function (url, callback) {
    try {
        var data = await (await fetch(url)).text()
        return callback(data)
    }
    catch (err){
        return callback(undefined, err)
    }
}