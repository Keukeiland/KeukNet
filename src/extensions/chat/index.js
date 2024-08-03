import { ExtensionBase } from "../../modules"

export default class extends ExtensionBase {
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

    init(context) {
        return ExtensionBase.init(this, context)
    }

    handle(ctx, deps) {
        let [] = this.initialized_deps.massGet()
        var location = ctx.path.shift()

        if (!location) {
            if (ctx.data && ctx.data.form.message) {
                var message = ctx.data.form.message.substring(0,255)
                var now = (new Date()).toLocaleTimeString('en-US', {hour12: false})
                this.messages.push({
                    user: {name:ctx.context.user.name, pfp_code:ctx.context.user.pfp_code},
                    time: now,
                    content: message
                })
            }
            ctx.context.chat = this.messages
            this.last_got_id[ctx.context.user.id] = this.messages.length
            return this.return_html(ctx, 'index')
        }
        else if (location == 'getnew') {
            var part = this.last_got_id.hasOwnProperty(ctx.context.user.id) ? this.last_got_id[ctx.context.user.id] : 0
            this.last_got_id[ctx.context.user.id] = this.messages.length
            return this.return_data(ctx, `{"messages":${JSON.stringify(this.messages.slice(part))}}`)
        }
        else if (location == 'postmessage') {
            if (ctx.data && ctx.data.form.message) {
                var message = ctx.data.form.message.substring(0,255)
                var now = (new Date()).toLocaleTimeString('en-US', {hour12: false})
                this.messages.push({
                    user: {name:ctx.context.user.name, pfp_code:ctx.context.user.pfp_code},
                    time: now,
                    content: message
                })
            }
            return this.return(ctx)
        }
        else {
            return this.return_file(ctx, location)
        }
    }
}
