const { exec } = require('child_process')

exports.main = function (req, res, global) {
    const {data} = global
    id = data.authenticate(req.headers.authorization)
    
    if (!id) {
        res.writeHead(401)
        res.end()
        return
    }
    if (!req.args.uuid) {
        res.writeHead(404)
        res.end()
    }

    data.deleteProfile(id, req.args.uuid, function (err) {
        if (err) {
            console.error(err)
            res.writeHead(500)
            res.end()
            return
        }
        // Register UUID to the VPN service, then get the assigned IP
        exec(`pivpn -r -y ${req.args.uuid}`, (err, stdout, stderr) => {
            if (err) {
                console.error(err)
                res.writeHead(500)
                res.end()
                return
            }
            res.writeHead(307, {Location: "/"})
            res.end()
            return
        })
    })
}