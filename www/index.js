/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
var endpoints = [
    'index','logout','login',
    'register'
]
var extensions = [
    'profile','servers','nothing','admin'
]

var indices = {}
var fetch, content, favicons, data, wg_config
exports.init = function (global) {
    ({fetch,content,favicons,data,wg_config,nj,config,db} = global)
    nj.addGlobal('dicebear_host', config.dicebear_host)

    for (path of endpoints) {
        indices[path] = require('./endpoints/'+path)
        indices[path].init(global)
    }

    var extension_indices = {}
    for (path of extensions) {
        let ext = new ((require(`./extensions/${path}/index.js`))(global.Extension))(global, `${__dirname}/extensions/${path}/`, `${__dirname}/../data/${path}/`)
        extension_indices[path] = ext
    }
    extensions = extension_indices
    admin_extensions = {}
    for (const ext of Object.keys(extensions)) {
        if (extensions[ext].admin_only) {
            admin_extensions[ext] = extensions[ext]
            delete extensions[ext]
        }
    }
}

exports.main = function (req, res) {
    var location = req.path.shift()
    location = location == '' ? 'index' : location

    if (location.includes('.') || location.startsWith('~') || location == 'keuknet-client') {
        handleStatic(req, res, location)
    }
    else {
        handleEndpoint(req, res, location)
    }
}

function handleEndpoint(req, res, location) {
    // set request context
    req.context = {...req.args}
    req.context.extensions = extensions
    req.context.location = location
    req.context.connected = req.ip.startsWith(wg_config.ip_scope)

    // Authenticate using user&pass, else using ip
    data.authenticate(req.headers.authorization, req.ip, wg_config.ip_scope, function (user, err) {
        req.context.user = user
        if (err) req.context.auth_err = err
        if (user && user.is_admin) req.context.extensions = {...req.context.extensions, ...admin_extensions}
    
        // Default endpoint
        if (endpoints.includes(location)) {
            indices[location].main(req, res)
        }
        // Extension
        else if (location in req.context.extensions) {
            ext = req.context.extensions[location]
            // If login required
            if (!user && ext.requires_login(req.path)) {
                    res.writeHead(307, {Location: "/login"})
                    res.end()
                    return
            }
            if (user && !user.is_admin && ext.requires_admin(req.path)) {
                res.writeHead(307, {Location: "/"})
                res.end()
                return
            }
            ext.handle_req(req, res)
        }
        else {
            handleStatic(req, res, location)
        }
    })
}

function handleStatic(req, res, location) {
    var filetype = location.split('.')[1]
    // Templated html
    if (location.startsWith('~')) {
        nj.render('content/'+location.split('~')[1]+'.html', req.context, function (err, data) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.writeHead(200, content['html'])
            res.end(data)
            return
        })
    }
    // Favicon
    else if (favicons.includes(location)) {
        fetch.file(`favicons${req.url}`, function (data, err) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.writeHead(200, content[filetype])
            res.end(data)
        })
    }
    // if location is a file
    else {
        fetch.file(req.url, function (data, err) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.writeHead(200, content[filetype])
            res.end(data)
        })
    }
}
