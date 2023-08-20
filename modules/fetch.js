/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// import external libraries
const fs = require('fs').promises
const md = new (require('showdown')).Converter({customizedHeaderId: true})
const parse5 = require('parse5')
const {createHash} = require('crypto')

// set configurable constants
const certFiles = ["privkey.pem","cert.pem","fullchain.pem"]

// define global variables
var fileCache = {}
var localRoot = ""
var domain = ""

// const md = new showdown.Converter({customizedHeaderId: true})

const __getMarkdown = function (files, callback) {
    files.forEach(function (m) {
        exports.file("/home/user/web/connect.keukeiland.nl/www/" + m.substring(2, m.length-1), function (mddata, err) {
            if (err) {
                return callback(files, err)
            }
            files[m] = md.makeHtml(mddata)
            i++
            if (i == files.length) {
                return callback(files)
            }
        })
    })
}

const _patchMarkdown = function (data, callback) {
    files = []
    i = 0
    data.replaceAll(/%{.+}/g, function (m) {
        files.push(m)
    })
    if (files.length == 0) return callback(data)
    __getMarkdown(files, function (files, err) {
        if (err) {
            console.error(err)
        }
        data = data.replaceAll(/%{.+}/g, function (m) {
            return files[m]
        })
        return callback(data)
    })
}

exports.initiate = function (dom, path) {
    fileCache[dom] ??= {}
    localRoot = path
    domain = dom
}

exports.file = function (file, callback) {
    if (fileCache[domain][file]) {
        return callback(fileCache[domain][file])
    }
    console.log(`\x1b[34m>> Caching [${domain}][${file}]\x1b[0m`)
    fs.readFile(file, "utf8")
        .then(data => {
            if (file.endsWith("html")) {
                _patchMarkdown(data, function (patchedData) {
                    fileCache[domain][file] = patchedData
                    return callback(patchedData)
                })
            }
            else {
            fileCache[domain][file] = data
            return callback(data)
            }
        })
        .catch(err => {
            console.error(`\x1b[31m>> Could not read [${domain}][${file}] ${err}\x1b[0m`)
            return callback(undefined, err)
        })
}

exports.fileRaw = function (file, callback) {
    if (fileCache[domain][file]) {
        return callback(fileCache[domain][file])
    }
    console.log(`\x1b[34m>> Caching  raw[${domain}][${file}]\x1b[0m`)
    fs.readFile(file)
        .then(data => {
            fileCache[domain][file] = data
            return callback(data)
        })
        .catch(err => {
            console.error(`\x1b[31m>> Could not read [${domain}][${file}] ${err}\x1b[0m`)
            return callback(undefined, err)
        })
}

exports.merge = function (base, template, callback) {
    filename = createHash('md5').update(base).digest('hex') + template
    if (fileCache[domain][filename]) {
        return callback(fileCache[domain][filename])
    }
    console.log(`\x1b[34m>> Merging [${domain}][${filename}]\x1b[0m`)
    base = parse5.parse(base)

    exports.template(template, function (templateContent, err) {
        if (err) {
            console.error(err)
            return callback(base, err)
        }
        templateContent = parse5.parse(templateContent)
        baseHtmlIndex = base.childNodes.findIndex(function (node) {return node['nodeName'] == 'html'})
        baseHeadIndex = base.childNodes[baseHtmlIndex].childNodes.findIndex(function (node) {return node['nodeName'] == 'head'})
        baseBodyIndex = base.childNodes[baseHtmlIndex].childNodes.findIndex(function (node) {return node['nodeName'] == 'body'})
        templateHtmlIndex = templateContent.childNodes.findIndex(function (node) {return node['nodeName'] == 'html'})
        templateHeadIndex = templateContent.childNodes[templateHtmlIndex].childNodes.findIndex(function (node) {return node['nodeName'] == 'head'})
        templateBodyIndex = templateContent.childNodes[templateHtmlIndex].childNodes.findIndex(function (node) {return node['nodeName'] == 'body'})
        base.childNodes[baseHtmlIndex].childNodes[baseHeadIndex].childNodes = base.childNodes[baseHtmlIndex].childNodes[baseHeadIndex].childNodes.concat(templateContent.childNodes[templateHtmlIndex].childNodes[templateHeadIndex].childNodes)
        base.childNodes[baseHtmlIndex].childNodes[baseBodyIndex].childNodes = base.childNodes[baseHtmlIndex].childNodes[baseBodyIndex].childNodes.concat(templateContent.childNodes[templateHtmlIndex].childNodes[templateBodyIndex].childNodes)
        base = parse5.serialize(base)
        fileCache[domain][filename] = base
        callback(base)
    })
}

exports.mergeRaw = function (base, template) {
    base = parse5.parse(base)
    template = parse5.parse(template)

    baseHtmlIndex = base.childNodes.findIndex(function (node) {return node['nodeName'] == 'html'})
    baseHtmlIndex = base.childNodes.findIndex(function (node) {return node['nodeName'] == 'html'})
    baseHeadIndex = base.childNodes[baseHtmlIndex].childNodes.findIndex(function (node) {return node['nodeName'] == 'head'})
    baseBodyIndex = base.childNodes[baseHtmlIndex].childNodes.findIndex(function (node) {return node['nodeName'] == 'body'})
    templateHtmlIndex = template.childNodes.findIndex(function (node) {return node['nodeName'] == 'html'})
    templateHeadIndex = template.childNodes[templateHtmlIndex].childNodes.findIndex(function (node) {return node['nodeName'] == 'head'})
    templateBodyIndex = template.childNodes[templateHtmlIndex].childNodes.findIndex(function (node) {return node['nodeName'] == 'body'})

    base.childNodes[baseHtmlIndex].childNodes[baseHeadIndex].childNodes = base.childNodes[baseHtmlIndex].childNodes[baseHeadIndex].childNodes.concat(template.childNodes[templateHtmlIndex].childNodes[templateHeadIndex].childNodes)
    base.childNodes[baseHtmlIndex].childNodes[baseBodyIndex].childNodes = base.childNodes[baseHtmlIndex].childNodes[baseBodyIndex].childNodes.concat(template.childNodes[templateHtmlIndex].childNodes[templateBodyIndex].childNodes)
    
    return parse5.serialize(base)
}


/* fetches file foo.bar from <localRoot/assets/bar/foo.bar>
   can't fetch files outside of assets/
   caches file in fileCache, !don't use for binary data!
   is ASYNC/promise based, with callback */
exports.template = function (file, callback) {
    if (fileCache[domain][file]) {
        return callback(fileCache[domain][file])
    }
    console.log(`\x1b[34m>> Caching [${domain}][${file}]\x1b[0m`)
    fs.readFile(localRoot + "/templates/" + file, "utf8")
        .then(data => {
            if (file.endsWith("html")) {
                _patchMarkdown(data, function (patchedData) {
                    fileCache[domain][file] = patchedData
                    return callback(patchedData)
                })
            }
            else {
            fileCache[domain][file] = data
            return callback(data)
            }
        })
        .catch(err => {
            console.error(`\x1b[31m>> Could not read template [${domain}][${file}] ${err}\x1b[0m`)
            return callback(undefined, err)
        })
}

exports.keys = function (callback) {
    console.log(`\x1b[34m>> Fetching HTTPS certificates\x1b[0m`)
    var certs = []
    for (let key in certFiles) {
        fs.readFile("/etc/letsencrypt/live/connect.keukeiland.nl/" + certFiles[key])
        .then(data => {
            certs[key] = data
            if (certs.length = certFiles.length) {
                callback(...certs)
            }
        })
        .catch(err => {
            console.error(`\x1b[31m>> Could not read ${certFiles[key]} ${err}\x1b[0m`)
            certs[key] = null
        })
    }
}