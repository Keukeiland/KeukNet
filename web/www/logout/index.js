exports.main = function (req, res, global) {
    res.writeHead(401)
    res.end(`<html><head><script>
    window.onload = function() {
    window.location.replace("https://${req.headers.host}/");}
    </script></head></html>`)
}