var data, content, nj
exports.init = function (global) {
    ({data,content,nj} = global)
}


exports.main = function (req, res) {
    if (!req.context.user) {
        res.writeHead(401)
        res.end()
        return
    }
    if (!req.args.uuid) {
        res.writeHead(404)
        res.end()
        return
    }
    if (req.data) {
        data.renameProfile(req.context.user, req.args.uuid, req.post_data, function (err) {
            if (err) {
                res.writeHead(500)
                res.end()
                return
            }
            res.writeHead(307, {Location: "/"})
            res.end()
            return
        })
    }
    else {
        req.context.form_item = "new name"
        nj.render('snippets/post.html', {item:"new name",action:req.url,destination:"/profile"}, function(err, data) {
            if (err) {
                res.writeHead(500)
                res.end()
                return
            }
            res.writeHead(200, content['html'])
            res.end(data)
        })
    }
}
