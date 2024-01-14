const endpoints = [
    'getconf','delete','add',
    'install','rename'
]

var indices = {}
var data, content, nj, fetch
exports.init = function (global) {
    ({data, content, nj,microfetch} = global)
    
    fetch = new microfetch.Fetch(__dirname)

    for (path of endpoints) {
        indices[path] = require('./'+path)
        indices[path].init(global)
    }
}

exports.main = function (req, res) {
    req.context.extension = {
        name: "Profile"
    }
    var location = req.path.shift()
    if (!location) {
        data.getProfiles(req.context.user.id, function (profiles, err) {
            req.context.profiles = profiles
            nj.render('profile/index.html', req.context, function(err, data) {
                if (err) {
                    res.writeHead(500)
                    res.end()
                    return
                }
                res.writeHead(200, content['html'])
                res.end(data)
            })
        })
    }
    else if (endpoints.includes(location)) {
        indices[location].main(req,res)
        return
    }
    else {
        fetch.file(location, function (data,filetype,err) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.writeHead(200, content[filetype])
            res.end(data)
        })
    }
}