var nj, content
exports.init = function (global) {
    ({nj,content} = global)
}


exports.main = function (req, res) {
    // if invalid credentials display the error
    if (!req.context.user) {
        err = req.context.auth_err ?? new Error("Wrong name or password")
        // if cancelled return to home
        if (req.headers.cookie > 0 && err.message == "Quit early") {
            res.writeHead(307, {Location: "/", 'Set-Cookie': 0})
            res.end()
            return
        }
        if (req.headers.cookie >= 1 && req.headers.cookie%2 == 1) {
            nj.render('snippets/error.html', {err:err,location:"/login",return:"/"}, function(err, data) {
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
    // if logged in
    res.writeHead(307, {"Location": "/", 'Set-Cookie': 0})
    res.end()
    return
}