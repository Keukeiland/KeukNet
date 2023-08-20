// import libraries
const http2 = require('http2')
const http = require('http')

// import local scripts
const fetch = require('./modules/fetch')

// import index of request processor
const processor_index = require('./web/index')

// import config values
const {domain, http_port, https_port, host} = require('./config')

// fetch HTTPS encryption keys from filesystem
// then set keysFetched true so HTTPS server can start
var keysFetched
fetch.keys(function(key, crt, ca_crt) {
    serverkey = key
    servercrt = crt
    cacrt = ca_crt
    keysFetched = true
})


// handle all requests for both HTTPS and HTTP/2
const requestListener = function (req, res) {
    // if no authorization headers set it to false, to prevent errors
    req.headers.authorization ??= false
    // get requested host, HTTP/<=1.1 uses host, HTTP/>=2 uses :authority
    req.headers.host ??= req.headers[':authority']
    // set user agent to "NULL", to prevent errors
    req.headers['user-agent'] ??= "NULL"
    // get requesting IP
    req.ip = req.socket?.remoteAddress || req.connection?.remoteAddress || req.connection.socket?.remoteAddress
    // if IPv4 strip 4to6 part of IP
    if (req.ip.startsWith("::ffff:")) req.ip = req.ip.substring(req.ip.lastIndexOf(':')+1,req.ip.length)

    // if request is not for any domain served here, deny the request
    if (req.headers.host != domain) {
        console.log(` DEN[${req.ip}]: '${req.headers.host}'`)
        res.writeHead(400)
        res.end()
    }

    // separate url arguments from the url itself
    req.args = {0: req.url.split('?')[1]}
    req.url = req.url.split('?')[0]

    // split arguments into key:value pairs 
    if (req.args[0]) {
        req.args[0] = req.args[0].split('&')
        req.args[0].forEach(function (arg, i) {
            index = arg.indexOf("=")
            split = [arg.slice(0, index), arg.slice(index+1)]
            req.args[split[0]] = split[1]
        })
        delete req.args[0]
        // allow authentication using argument auth=<WWW-authenticate Basic>
        if (req.args.auth) req.headers.authorization ??= "Basic " + req.args.auth
    }

    // Shorten non local IPv6 to relevant part
    // This is both for privacy and for readability of the logs
    if (req.ip.includes(':') && !req.ip.startsWith('fdbe:126:f8f7:')) {
        let tmp = ""
        req.ip.split(':').forEach(function (quad, index) {
            quad = quad.padStart(4,"0")

            if (index < 3) {
                tmp += quad + ":"
                return
            }
            if (index == 3) {
                tmp += quad + ":*"
                return
            }
            else return
        })
        req.ip = tmp
    }


    // log the request and some of the header information
    console.log(`\x1b[32m${
        "    [" + req.ip + "]=>'" +
        req.method + " " +
        req.headers.host + req.url +
        "\n\x1b\[4m        HTTP/" +   req.httpVersion +
        "; " + req.headers['user-agent'].split(" ",1)[0] +
        "; "}${req.headers.authorization? "auth" : "noauth"
    }\x1b[0m`)

    
    // forward the request to the processor
    processor_index.main(req, res)
}



// Handle insecure HTTP requests
// Logs connection attempt and redirects to HTTPS
const insecureRequestListener = function (req, res) {
    // get request IP-address
    req.ip = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress
    // if IPv4 strip 4to6 part of IP
    if (req.ip.startsWith("::ffff:")) req.ip = req.ip.substring(req.ip.lastIndexOf(':')+1,req.ip.length)
    // redirect request to HTTPS
    console.log(`\x1b[33m RED[${req.ip}]: 'https://${req.headers.host}${req.url}'\x1b[0m`)
    res.writeHead(307, {"Location": `https://${req.headers.host}${req.url}`})
    res.end()
    return
}

// Prevent starting of HTTPS server if encryption keys aren't ready yet
function startHttp2() {
    // while keys are not ready check again every 100ms
    // else continue with starting HTTPS server
    if(!keysFetched) {
    setTimeout(startHttp2, 100)
    }
    else {
        http2.createSecureServer({
            key: serverkey, 
            cert: servercrt,
            ca: cacrt,
            allowHTTP1: true,
            }, requestListener)
            .listen(https_port, host, () => {
                console.log(`\x1b[1mHTTP/2 & HTTPS server running on https://${domain}:${https_port}, interface '${host}'\n\x1b[0m`)
            })
    }
}
startHttp2()

// Start HTTP server
http.createServer(insecureRequestListener)
    .listen(http_port, host, () => {
        console.log(`\x1b[1mHTTP/1.1 server running on http://${domain}:${http_port}, interface '${host}'\n\x1b[0m`)
    })