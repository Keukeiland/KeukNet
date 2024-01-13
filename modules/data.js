/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const crypto = require('crypto')
const sqlite3 = require('sqlite3').verbose()
const wg = require('./data/wireguard')

var db
var salt
exports.init = function(path, saltq, wg_config, callback) {
    db = new sqlite3.Database(path+'db.sqlite')
    salt = saltq
    // intentionally NOT catching errors
    db.run(`
    CREATE TABLE IF NOT EXISTS
    user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR NOT NULL,
        password VARCHAR NOT NULL,
        regdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE CHECK (is_admin IN (0,1))
        )
        `)
    db.run(`
    CREATE TABLE IF NOT EXISTS
    profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR,
        uuid CHAR(36) NOT NULL,
        ip VARCHAR NOT NULL,
        installed BOOLEAN NOT NULL DEFAULT FALSE CHECK (installed IN (0,1)),
        special BOOLEAN NOT NULL DEFAULT FALSE CHECK (special IN (0,1)),
        CONSTRAINT fk_user_id
            FOREIGN KEY (user_id)
                REFERENCES user(id)
        )
        `)
    db.run(`
    CREATE TABLE IF NOT EXISTS
    server (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        name VARCHAR NOT NULL,
        description TEXT NOT NULL,
        ip VARCHAR NOT NULL,
        url VARCHAR,
        CONSTRAINT fk_admin_id
            FOREIGN KEY (admin_id)
                REFERENCES user(id)
        )
        `)
    wg.init(path+"wireguard/", wg_config, function () {
        return callback()
    })
}

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

function __owns(user, uuid, callback) {
    db.get("SELECT EXISTS(SELECT 1 FROM profile WHERE user_id=$id AND uuid=$uuid)", [user.id,uuid], function (err, result) {
        return callback(!!Object.values(result)[0], err)
    })
}
exports.owns = __owns

function __getHighestUserID(callback) {
    db.get("SELECT MAX(id) FROM profile WHERE special = FALSE", function (err, data) {
        return callback(data['MAX(id)'], err)
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

exports.addProfile = function (user, callback) {
    uuid = crypto.randomUUID()

    __getHighestUserID(function (id, err) {
        if (err) return callback(err)
        wg.create(uuid, id+2, function (ip, err) {
            if (err) return callback(err)
            db.run("INSERT INTO profile(user_id,uuid,ip) VALUES($id,$uuid,$ip)", [user.id, uuid, ip], function (err) {
                if (err) return callback(err)
                return callback()
            })
        })
    })
}

exports.deleteProfile = function (user, uuid, callback) {
    __owns(user, uuid, function (user_owns, err) {
        if (!user_owns) return callback(err)
        db.run("DELETE FROM profile WHERE uuid=$uuid", [uuid], function (err) {
            if (err) return callback(err)
            wg.delete(uuid, function () {
                return callback()
            })
        })
    })
}

exports.renameProfile = function (user, uuid, name, callback) {
    __owns(user, uuid, function (user_owns, err) {
        if (!user_owns) return callback(err)
        db.run("UPDATE profile SET name=$name WHERE uuid=$uuid", [name,uuid], function (err) {
            return callback(err)
        })
    })
}

exports.getConf = function (uuid, callback) {
    wg.getConfig(uuid, function (data, err) {
        if (err) return callback(undefined, err)
        db.run("UPDATE profile SET installed=TRUE WHERE uuid=$uuid", [uuid], function (err) {
            return callback(data, err)
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

exports.getProfiles = function (id, callback) {
    db.all("SELECT * FROM profile WHERE user_id=$id", id, function (err, profiles) {
        return callback(profiles, err)
    })
}

exports.getServers = function (callback) {
    db.all("SELECT * FROM server", function (err, servers) {
        return callback(servers, err)
    })
}
exports.getServer = function (id, callback) {
    db.get("SELECT * FROM server WHERE id=$id", id, function (err, server) {
        return callback(server, err)
    })
}

exports.addServer = function (name, admin_id, description, ip, url, callback) {
    db.run("INSERT INTO server(name,admin_id,description,ip,url) VALUES($name,$admin_id,$description,$ip,$url)", [name,admin_id,description,ip,url], function (err) {
        if (err) return callback(err)
        return callback()
    })
}
