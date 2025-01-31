import { ExtensionBase } from "../../modules.ts"

type message = {user: {name: any, pfp_code: any}, time: any, content: any}

export default class extends ExtensionBase {
    override name = 'chat'
    override title = 'Chat'

    private MessageStore = class {
        messages: message[] = [{
            user: {name:'SYSTEM',pfp_code:'seed=SYSTEM'},
            time:(new Date()).toLocaleTimeString('en-US', {hour12: false}),
            content: 'Welcome to the chatroom!'
        }]
        onPushListeners: Set<(msg: message) => void> = new Set()
    
        push(ctx: Context, content: string) {
            const message: message = {
                user: {
                    name: ctx.context.user?.name,
                    pfp_code: `${ctx.context.dicebear_host}?${ctx.context.user?.pfp_code}`,
                },
                time: (new Date()).toLocaleTimeString('en-US', {hour12: false}),
                content,
            }
            this.messages.push(message)
            this.onPushListeners.forEach((listener) => listener(message))
        }
    }
    message_store = new this.MessageStore()

    override handle: Extension['handle'] = (ctx) => {
        const location = ctx.path.shift()

        switch (location) {
            case '':
            case undefined: {
                if (ctx.data && ctx.data.form.message) {
                    const message = ctx.data.form.message.substring(0,255)
                    this.message_store.push(ctx, message)
                }
                ctx.context.chat = this.message_store.messages
                return this.return_html(ctx, 'index')
            }
            case 'history': {
                // Should at some point return history by request
                return this.return_data(ctx, JSON.stringify({messages: this.message_store.messages}))
            }
            case 'new_message_event': {
                const {req, res} = ctx

                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                });
                
                let counter = 0;
                
                // Send a message on connection
                res.write('event: connected\n');
                res.write(`data: null\n`);
                res.write(`id: ${counter}\n\n`);
                counter += 1;
                
                const listener = (msg: message) => {
                    res.write('event: message\n');
                    res.write(`data: ${JSON.stringify(msg)}\n`);
                    res.write(`id: ${counter}\n\n`);
                    counter += 1;
                }
                this.message_store.onPushListeners.add(listener)
                
                // Close the connection when the client disconnects
                req.on('close', () => {
                    this.message_store.onPushListeners.delete(listener)
                    res.end('OK')
                })
                return
            }
            default: {
                return this.return_file(ctx, location)
            }
        }
    }
}
