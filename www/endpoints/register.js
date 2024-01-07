var data, nj, content
exports.init = function (global) {
    ({data,nj,content} = global)
}


exports.main = function (req, res) {
    // if user already logged in
    if (req.context.user) {
        res.setHeader("Location", "/")
        res.writeHead(307)
        res.end()
        return
    }
    // try to create account
    data.addUser(req.headers.authorization, function (err) {
        // if invalid credentials
        if (err) {
            // if cancelled return to home
            if (req.headers.cookie > 0 && err.message == "Quit early") {
                res.writeHead(307, {Location: "/", 'Set-Cookie': 0})
                res.end()
                return
            }
            // display the error if there is one
            if (req.headers.cookie >= 1 && req.headers.cookie%2 == 1) {
                nj.render('snippets/error.html', {err:err,location:"/register",return:"/"}, function(err, data) {
                    if (err) {
                        res.writeHead(500)
                        res.end()
                        return
                    }
                    res.writeHead(200, {...{'Set-Cookie': parseInt(req.headers.cookie)+1},...content['html']})
                    res.end(data)
                    return
                })
                return
            }
            res.writeHead(401, {"WWW-Authenticate": `Basic`, 'Set-Cookie': parseInt(req.headers.cookie)+1})
            res.end()
            return
        }
        // return to home
        res.writeHead(307, {Location: "/", 'Set-Cookie': 0})
        res.end()
    })
}