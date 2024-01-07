var data, content, nj
exports.init = function (global) {
    ({data, content, nj} = global)
}

exports.main = function (req, res) {
    req.context.extension = {
        name: "Admin"
    }
    nj.render('admin/index.html', req.context, function(err, data) {
        if (err) {
            res.writeHead(500)
            res.end()
            return
        }
        res.writeHead(200, content['html'])
        res.end(data)
    })
    // if (Date.now() - remaining >= timeout) {
    //     remaining = Date.now()
    //     exec("systemctl restart dnsmasq.service", (err, stdout, stderr) => {
    //         if (err || stderr) {
    //             console.log(err ?? stderr)
    //             res.writeHead(500)
    //             res.end()
    //             return
    //         }
    //         res.writeHead(307, {Location: "/"})
    //         res.end("200 SUCCESS, redirecting...")
    //     })
    // }
    // else {
    //     res.writeHead(429)
    //     res.end(`429 TOO MANY REQUESTS, please wait [${(timeout-(Date.now()-remaining))/1000} Sec]`)
    // }
}