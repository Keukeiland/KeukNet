/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const fspromises = require('fs').promises
const crypto = require('crypto')

var datapath
var userdata
var salt

exports.setPath = function(path) {
    datapath = path
}

exports.load = function (callback) {
    console.log(`\x1b[34m>> Fetching user data\x1b[0m`)
    fspromises.readFile(datapath, 'utf8')
    .then(data => {
        userdata = JSON.parse(data)
        callback(undefined)
    })
    .catch(err => {
        console.error(`\x1b[31m>> Could not read user data: ${err}\x1b[0m`)
        callback(err)
    })
}

exports.setSalt = function (saltq) {
    salt = saltq
}

exports.addUser = function (name, hash, ip, uuid, callback) {
    userdata[name] = {
        name: name,
        hash: hash,
        ips: [ip],
        uuids: [uuid],
        regDate: Date.now()
    }

    fspromises.writeFile(datapath, JSON.stringify(userdata), 'utf8')
    .then(err => {
        callback(undefined)
    })
    .catch(err => {
        console.error(`\x1b[31m>> Could not write user data: ${err}\x1b[0m`)
        callback(err)
    })
}

exports.addProfile = function (name, ip, uuid, callback) {
    userdata[name].ips.push(ip)
    userdata[name].uuids.push(uuid)

    fspromises.writeFile(datapath, JSON.stringify(userdata), 'utf8')
    .then(err => {
        callback(undefined)
    })
    .catch(err => {
        console.error(`\x1b[31m>> Could not write user data: ${err}\x1b[0m`)
        callback(err)
    })
}

exports.deleteProfile = function (name, uuid, callback) {
    index = userdata[name].uuids.indexOf(uuid)

    userdata[name].uuids[index] = undefined
    userdata[name].ips[index] = undefined

    fspromises.writeFile(datapath, JSON.stringify(userdata), 'utf8')
    .then(err => {
        callback(undefined)
    })
    .catch(err => {
        console.error(`\x1b[31m>> Could not write user data: ${err}\x1b[0m`)
        callback(err)
    })
}

exports.exists = function (id) {
    if (userdata[id]) {
        return true
    }
    return false
}

exports.getConf = function (uuid, callback) {
    fspromises.readFile(`/home/user/configs/${uuid}.conf`)
        .then(data => {
            fspromises.unlink(`/home/user/configs/${uuid}.conf`)
            .then(function () {
                callback(data, undefined)
            })
            .catch(err => {
                console.error(`\x1b[31m>> Could not delete ${uuid}.conf ${err}\x1b[0m`)
                callback(data, err)
            })
        })
        .catch(err => {
            console.error(`\x1b[31m>> Could not read ${uuid}.conf ${err}\x1b[0m`)
            callback(undefined, err)
        })
}

exports.owns = function (id, uuid) {
    return userdata[id].uuids.includes(uuid)
}

exports.authenticate = function (authstring) {
    if (!authstring) {
        return false
    }
    passwd = new Buffer.from(authstring.slice(6), 'base64').toString('utf-8')
    if (passwd == "log:out") { return false}
    username = passwd.split(":")[0].replaceAll(/[!@#$%^&*]/g, '')
    hash = crypto.pbkdf2Sync(passwd, salt, 10000, 512, 'sha512').toString('base64')
    passwd = " "*1024
    if (userdata[username] && hash == userdata[username].hash) {
        return username
    }
    else {
        return false
    }
}

exports.getProfiles = function (id) {
    var result = "<div id='profiles'>\n"
    userdata[id].ips.forEach(function (ip, index) {
        if (!ip) return
        result += `\t<div><p>Profile ${index+1}.    <a href="https://\${req.headers.host}/install?uuid=${userdata[id].uuids[index]}">Install</a>    <a href="/deleteprofile?uuid=${userdata[id].uuids[index]}">Delete</a></p><p>IP: ${ip}</p><p>UUID: ${userdata[id].uuids[index]}</p></div>\n`
    })
    result += "</div>\n"
    return result
}

exports.whoOwnsIp = function (ip, callback) {
    if (ip == "fdbe:126:f8f7:1::1") return callback("keuknetcore")
    Object.keys(userdata).forEach(function (key) {
        if (userdata[key].ips.includes(ip)) return callback(userdata[key].name)
    })
}