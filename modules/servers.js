/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const md = new (require('showdown')).Converter({customizedHeaderId: true, headerLevelStart: 3})
const fspromises = require('fs').promises
import('node-fetch')

var datapath
var serverdata
var oldserverdata
var serverhtml


exports.init = function (path) {
    datapath = path

    console.log(`\x1b[34m>> Fetching server data\x1b[0m`)
    fspromises.readFile(datapath, 'utf8')
    .then(data => {
        serverdata = JSON.parse(data)
    })
    .catch(err => {
        console.error(`\x1b[31m>> Could not read server data: ${err}\x1b[0m`)
    })
}

const _save = function (callback) {
    fspromises.writeFile(datapath, JSON.stringify(serverdata), 'utf8')
    .then(() => {
        callback()
    })
    .catch(err => {
        console.error(`\x1b[31m>> Could not write server data: ${err}\x1b[0m`)
        callback(err)
    })
}

exports.getHtml = function (callback) {
    if (oldserverdata == serverdata) return callback(serverhtml)

    serverhtml = "<div id='servers'>\n"
    Object.keys(serverdata).forEach(function (key) {
        serverhtml += `<div>${md.makeHtml(serverdata[key])}</div>\n`
    })
    serverhtml += "</div>\n"
    return callback(serverhtml)
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