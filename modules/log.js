var we_logging
exports.init = function(we_log) {
    we_logging = we_log
}

function __mask_ip(ip) {
    let tmp = ""
    // if IPv4
    if (ip.startsWith("::ffff:")) {
        // strip 4to6 prefix
        ip = ip.substring(ip.lastIndexOf(':')+1,ip.length)
        // mask ip
        ip.split('.').forEach(function (quad, index) {
            quad = quad.padStart(3,"0")
            if (index <= 2) tmp += quad + "."
            if (index == 2) tmp += "*"
        })
    }
    else {
        // mask ip
        ip.split(':').forEach(function (quad, index) {
            quad = quad.padStart(4,"0")
            if (index <= 3) tmp += quad + ":"
            if (index == 3) tmp += "*"
        })
    }
    return tmp
}

function __mask_url(url) {
    return url.split('?')[0]
}

exports.con = function(req) {
    if (we_logging) {
        ip = __mask_ip(req.ip)
        url = __mask_url(req.url)
        console.log(
            `\x1b[32m    [${ip}]=>'${req.method} ${url}
            HTTP/${req.httpVersion} ${(req.headers['user-agent'] ?? "NULL").split(" ",1)[0]} ${req.headers.authorization? "auth" : "noauth"}\x1b[0m`
        )
    }
}

exports.con_err = function(req) {
    if (we_logging) {
        ip = __mask_ip(req.ip)
        console.log(
            `\x1b[35m  DEN[${ip}]: '${req.headers.host}'\x1b[0m`
        )
    }
}

exports.status = function(msg) {
    console.log(`\x1b[34m>> ${msg}\x1b[0m`)
}

exports.err = function(err) {
    console.log(`\x1b[31m>> ${err}\x1b[0m`)
}

exports.serverStart = function(type, domain, host, port) {
    console.log(`\x1b[1m${type.toUpperCase()} server running on ${type}://${domain}:${port}, interface '${host}'\n\x1b[0m`)
}
