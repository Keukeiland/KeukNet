module.exports = (Extension) => {return class extends Extension {
    name = 'root'
    title = 'Home'
    tables = true
    dependencies = ['content','nj','fetch','data','texts','cookie']

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
                // If user not logged in
                if (!req.context.user) {
                    // Attempt
                    if (req.data) {
                        // Login
                        if (req.data.login) {
                            let auth = '';
                            if (req.data.username && req.data.password) {
                                auth = Buffer.from(req.data.username+":"+req.data.password).toString('base64')
                            }
                            return this.return_html(req, res, 'login', null, 500, 303, {
                                "Location": "/login",
                                "Set-Cookie": this.set_cookie('auth', 'Basic '+auth, true)
                            })
                        }
                        // Register
                        else if (req.data.register) {
                            return this.data.addUser(req.data.username, req.data.password, (err) => {
                                // if invalid credentials
                                if (err) {
                                    req.context.auth_err = err
                                    return this.return_html(req, res, 'login', null)
                                }
                                // success
                                else {
                                    let auth = Buffer.from(req.data.username+":"+req.data.password).toString('base64')
                                    return this.return_html(req, res, 'login', null, 500, 303, {
                                        "Location": "/",
                                        "Set-Cookie": this.set_cookie('auth', 'Basic '+auth, true)
                                    })
                                }
                            })
                        }
                    }
                    // First load
                    return this.return_html(req, res, 'login', null, 500, 200, {
                        "Set-Cookie": this.del_cookie('auth')
                    })
                }
                // if logged in
                res.writeHead(307, {"Location": "/"})
                return res.end()
            }
            case 'logout': {
                if (req.context.user) {
                    // log user out and redirect
                    res.writeHead(307, {
                        "Location": "/",
                        "Set-Cookie": this.del_cookie('auth')
                    })
                    return res.end()
                }
                // if user is logged out
                res.writeHead(307, {"Location": "/"})
                return res.end()
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
