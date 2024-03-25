module.exports = (Extension) => {return class extends Extension {
    name = 'root'
    title = 'Home'
    tables = true
    dependencies = ['content','nj','fetch','data','texts']

    constructor (global, path, config_path) {
        super(global, path)
        this.favicons = global.favicons
    }


    requires_login(path) {
        return false
    }

    handle(req, res) {
        var location = req.path.shift()
        switch (location) {
            case '':
            case undefined: {
                if (!req.context.user) {
                    return this.return_text(req, res, 'index')
                }
                return this.return_html(req, res, 'user')
            }
            case 'login': {
                // if invalid credentials display the error
                if (!req.context.user) {
                    let err = req.context.auth_err ?? new Error("Wrong name or password")
                    // if cancelled return to home
                    if (req.headers.cookie > 0 && err.message == "Quit early") {
                        res.writeHead(307, {Location: "/", 'Set-Cookie': 0})
                        return res.end()
                    }
                    if (req.headers.cookie >= 1 && req.headers.cookie%2 == 1) {
                        req.context.err = err
                        req.context.location = "/login"
                        req.context.return = "/"
                        return this.return_html(req, res, 'error', null, 500, 200, {'Set-Cookie': parseInt(req.headers.cookie)+1})
                    }
                    res.writeHead(401, {"WWW-Authenticate": `Basic`, 'Set-Cookie': parseInt(req.headers.cookie)+1})
                    return res.end()
                }
                // if logged in
                res.writeHead(307, {"Location": "/", 'Set-Cookie': 0})
                return res.end()
            }
            case 'logout': {
                // if user is logged out
                if (!req.context.user) {
                    res.writeHead(307, {"Location": "/"})
                    return res.end()
                }
                // log user out and redirect
                req.context.destination = '/'
                return this.return_html(req, res, 'logout', null, 500, 401)
            }
            case 'register': {
                // if user already logged in
                if (req.context.user) {
                    res.writeHead(307, {"Location": "/"})
                    return res.end()
                }
                // try to create account
                this.data.addUser(req.headers.authorization, (err) => {
                    // if invalid credentials
                    if (err) {
                        // if cancelled return to home
                        if (req.headers.cookie > 0 && err.message == "Quit early") {
                            res.writeHead(307, {Location: "/", 'Set-Cookie': 0})
                            return res.end()
                        }
                        // display the error if there is one
                        if (req.headers.cookie >= 1 && req.headers.cookie%2 == 1) {
                            req.context.err = err
                            req.context.location = "/register"
                            req.context.return = "/"
                            return this.return_html(req, res, 'error', null, 500, 200, {'Set-Cookie': parseInt(req.headers.cookie)+1})
                        }
                        res.writeHead(401, {"WWW-Authenticate": `Basic`, 'Set-Cookie': parseInt(req.headers.cookie)+1})
                        return res.end()
                    }
                    // return to home
                    res.writeHead(307, {Location: "/", 'Set-Cookie': 0})
                    return res.end()
                })
                break
            }
            default: {
                // Templated html
                if (location.startsWith('~')) {
                    return this.return_html(req, res, 'content/'+location.split('~')[1], null, 404)
                }
                // Favicon
                else if (this.favicons.includes(location)) {
                    return this.return_file(res, `favicons${req.url}`)
                }
                // File
                else {
                    return this.return_file(res, req.url)
                }
            }
        }
    }
}}
