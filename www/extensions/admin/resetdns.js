const { exec } = require('child_process')

const timeout = 60000
var remaining = 0

var _
exports.init = function (global) {
    ({_} = global)
}

exports.main = function (req, res) {
    if (Date.now() - remaining >= timeout) {
        remaining = Date.now()
        exec("systemctl restart dnsmasq.service", (err, stdout, stderr) => {
            if (err) {
                console.log(err)
                res.writeHead(500)
                res.end()
                return
            }
            res.writeHead(307, {Location: "/"})
            res.end("200 SUCCESS, redirecting...")
        })
    }
    else {
        res.writeHead(429)
        res.end(`429 TOO MANY REQUESTS, please wait [${(timeout-(Date.now()-remaining))/1000} Sec]`)
    }
}