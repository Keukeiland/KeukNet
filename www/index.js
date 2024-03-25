/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
var extensions = [
    'profile','servers','nothing','admin','chat'
]

var root
var data, wg_config
exports.init = function (global) {
    ({data,wg_config,texts,nj,config} = global)
    nj.addGlobal('dicebear_host', config.dicebear_host)

    root = new ((require(`./extensions/root/index.js`))(global.Extension))(global, `${__dirname}/extensions/root/`, `${__dirname}/../data/root/`)

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
    
        // Extension
        if (location in req.context.extensions) {
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
        // Root extension
        else {
            req.path.unshift(location)
            root.handle_req(req, res)
        }
    })
}
