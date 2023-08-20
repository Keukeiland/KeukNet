var body

exports.main = function (req, res, global) {
    const {content, servers} = global

    if (req.method == 'POST') {
        body = ''
        req.on('data', function(data) {
          body += data
        })
        req.on('end', function() {
          console.log('Body: ' + body)
            servers.addServer(body, function (err) {
                if (err) {
                    console.error(`Can't get description.md from ${body}`)
                    res.writeHead(400)
                    res.end()
                    return
                }
                res.writeHead(200)
                res.end()
                return
            })
        })
    }
    else {
    res.writeHead(200, content['html'])
    res.end(`<!DOCTYPE html><html><head><script>
        let ip = prompt("Enter the domain/IP below without any http(s):// or /xxx");
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://${req.headers.host}/api/addserver", true);
        xhr.setRequestHeader('Content-Type', 'text/plain charset utf-8');
        xhr.send(ip);
        window.location.replace("https://${req.headers.host}/");
    </script></html><body><h1>REDIRECTING TO "https://${req.headers.host}/ AFTER POST</h1></body></html>`)
    }
}