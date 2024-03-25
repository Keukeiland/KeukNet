/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const crypto = require('crypto')
const sqlite3 = require('sqlite3').verbose()

var db
var salt
exports.init = function(path, saltq, callback) {
    db = new sqlite3.Database(path+'db.sqlite')
    salt = saltq
    return callback(undefined)
}
exports.db = () => {return db}

function __decrypt_auth(auth, callback) {
    if (!auth) {
        return callback(undefined, undefined, new Error("Quit early"))
    }
    // decode authentication string
    data = new Buffer.from(auth.slice(6), 'base64').toString('utf-8')
    // check if both name and password
    if (data.startsWith(':') || data.endsWith(':')) {
        return callback(undefined, undefined, new Error("Missing name or password"))
    }
    [name, password] = data.split(":")
    // hash password
    hash = crypto.pbkdf2Sync(password, salt, 10000, 128, 'sha512').toString('base64')
    return callback(name, hash)
}

function __exists(name, callback) {
    // check if name already exists
    db.get("SELECT EXISTS(SELECT 1 FROM user WHERE name=$name)", name, function (err, result) {
        return callback(!!Object.values(result)[0], err)
    })
}


exports.addUser = function (auth, callback) {
    __decrypt_auth(auth, function (name, password, err) {
        if (err) return callback(err)
        // Check if username is already taken
        __exists(name, function (exists, err) {
            if (err) return callback(err)
            if (exists) return callback(new Error("Username already taken"))
            // add user to db
            db.run("INSERT INTO user(name,password) VALUES($name,$password)", [name, password], function (err) {
                return callback(err)
            })
        })
    })
}

exports.authenticate = function (auth, ip, ip_scope, callback) {
    // Try to get name and password
    __decrypt_auth(auth, function (name, password, err) {
        if (err) {
            if (ip.startsWith(ip_scope)) {
                // Try using IP-address if no name and password
                db.get("SELECT u.* FROM user u JOIN profile p ON p.user_id = u.id WHERE p.ip=$ip", ip, function (err, user) {
                    return callback(user, err)
                })
                return
            }
            return callback(undefined, err)
        }
        // Auth using name and password
        db.get("SELECT * FROM user WHERE name=$name", name, function (err, user) {
            if (user) {
                if (password == user.password) {
                    return callback(user, err)
                }
            }
            return callback(undefined, err)
        })
    })
}
