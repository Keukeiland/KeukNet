module.exports = (Extension) => {return class extends Extension {
    name = 'chat'
    title = 'Chat'
    dependencies = ['content','nj','fetch']
    messages = [{
        user: {name:'SYSTEM',pfp_code:'seed=SYSTEM'},
        time:(new Date()).toLocaleTimeString('en-US', {hour12: false}),
        content: 'Welcome to the chatroom!'
    }]
    last_got_id = {}

    requires_login(path) {
        return true
    }

    handle(req, res) {
        var location = req.path.shift()
        if (!location) {
            if (req.data && req.data.message) {
                var message = req.data.message.substring(0,255)
                var now = (new Date()).toLocaleTimeString('en-US', {hour12: false})
                this.messages.push({
                    user: {name:req.context.user.name, pfp_code:req.context.user.pfp_code},
                    time: now,
                    content: message
                })
            }
            req.context.chat = this.messages
            this.last_got_id[req.context.user.id] = this.messages.length
            return this.return_html(req, res, 'index')
        }
        else if (location == 'getnew') {
            var part = this.last_got_id.hasOwnProperty(req.context.user.id) ? this.last_got_id[req.context.user.id] : 0
            this.last_got_id[req.context.user.id] = this.messages.length
            return this.return_data(res, `{"messages":${JSON.stringify(this.messages.slice(part))}}`)
        }
        else if (location == 'postmessage') {
            if (req.data && req.data.message) {
                var message = req.data.message.substring(0,255)
                var now = (new Date()).toLocaleTimeString('en-US', {hour12: false})
                this.messages.push({
                    user: {name:req.context.user.name, pfp_code:req.context.user.pfp_code},
                    time: now,
                    content: message
                })
            }
            return this.return(res)
        }
        else {
            return this.return_file(res, location)
        }
    }
}}
