/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const {readFile} = require('fs').promises
class Fetch {
    constructor (root) {
        this.bin_exts = ['png','jpg','mp3']
        this.cache = {}
        this.root = root+'/static/'
    }

    file (file, callback) {
        // load from cache if available
        if (this.cache[file]) {
            return callback(this.cache[file])
        }
        // get file-type and if it's binary or text
        var filetype = file.slice(file.lastIndexOf('.')+1)
        var encoding = this.bin_exts.includes(filetype) ? undefined : 'utf8'
        // read the file
        readFile(this.root+file, encoding)
            // cache and return the data
            .then(data => {
                this.cache[file] = data
                return callback(data, filetype)
            })
            // error if file can't be read
            .catch(err => {
                return callback(undefined, undefined, err)
            })
    }
}
exports.Fetch = Fetch
