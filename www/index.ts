import { Http2ServerResponse } from "http2"

var extensions_list = [
    'profile','servers','nothing','admin','chat'
]

const {data, nj} = Global
var root
var wg_config, extensions, admin_extensions
exports.init = function (global: any) {
    let texts, config
    ({wg_config,texts,config} = global)
    nj.addGlobal('dicebear_host', config.dicebear_host)
    nj.addGlobal('client_location', config.client_location)

    root = new ((require(`./extensions/root/index.js`))(global.Extension))(global, `${__dirname}/extensions/root/`, `${__dirname}/../data/root/`)

    var extension_indices = {}
    for (const path of extensions_list) {
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
// import type { Http2ServerRequest } from "./../global.d"

exports.main = function (ctx) {
    var {req, res}: {req: Http2ServerRequest, res: Http2ServerResponse} = ctx

    var location = ctx.path.shift()

    // set request context
    ctx.context = {...ctx.args}
    ctx.context.extensions = extensions
    ctx.context.location = location
    
    // Authenticate using user&pass, else using ip
    data.authenticate(req.headers.authorization, ctx.ip, wg_config.subnet, function (user, err) {
        ctx.context.user = user
        if (err) ctx.context.auth_err = err
        if (user && user.is_admin) ctx.context.extensions = {...ctx.context.extensions, ...admin_extensions}
    
        // Extension
        if (location in ctx.context.extensions) {
            let ext = ctx.context.extensions[location]
            // If login required
            if (!user && ext.requires_login(ctx.path)) {
                res.writeHead(307, {Location: "/login"})
                res.end()
                return
            }
            if (user && !user.is_admin && ext.requires_admin(ctx.path)) {
                res.writeHead(307, {Location: "/"})
                res.end()
                return
            }
            ext.handle_req(ctx)
        }
        // Root extension
        else {
            ctx.path.unshift(location)
            root.handle_req(ctx)
        }
    })
}
