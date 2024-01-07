/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// import external libraries
const fs = require('fs').promises

// define global variables
var fileCache = {}
var root = __dirname

// binary file-types
const bin_exts = ['png','jpg','mp3']


exports.init = function (path) {
    root = path
}

exports.file = function (file, callback) {
    // load from cache if available
    if (fileCache[file]) {
        return callback(fileCache[file])
    }
    console.log(`\x1b[34m>> Caching [${file}]\x1b[0m`)
    // get file-type and if it's binary or text
    filetype = file.slice(file.lastIndexOf('.')+1)
    encoding = bin_exts.includes(filetype) ? undefined : 'utf8'
    // read the file
    fs.readFile(root+file, encoding)
        // cache and return the data
        .then(data => {
            fileCache[file] = data
            return callback(data)
        })
        // error if file can't be read
        .catch(err => {
            console.error(`\x1b[31m>> Could not read [${file}] ${err}\x1b[0m`)
            return callback(undefined, err)
        })
}

exports.key = function (location, callback) {
    fs.readFile(location, "utf8")
    .then(data => {
        callback(data)
    })
    .catch(err => {
        callback(undefined, err)
    })
}