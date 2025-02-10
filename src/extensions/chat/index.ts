import { ExtensionBase, Knex } from "../../modules.ts"
import { unpack } from "../../util.ts"

type message = {name: any, pfp_code: any, created_at: any, content: any}

export default class extends ExtensionBase {
    override name = 'chat'
    override title = 'Chat'
    override tables = true

    private MessageStore = class {
        onPushListeners: Set<(msg: message) => void> = new Set()
    
        async push(ctx: Context, content: string, knex : Knex){
            const message: message = {
                name: ctx.context.user?.name,
                pfp_code: ctx.context.user?.pfp_code,
                created_at: (new Date()).toLocaleTimeString('en-US', {hour12: false}),
                content,
            }
            let userID = Number(ctx.context.user?.id)
            await knex.query('_message')
            // @ts-expect-error
            .insert({user_id: userID, created_at: message.created_at, content: message.content})

            this.onPushListeners.forEach((listener) => listener(message))
        }
    }
    message_store = new this.MessageStore()

    override handle: Extension['handle'] = async (ctx) => {
        const location = ctx.path.shift()
        let [knex]: [Knex] = this.get_dependencies('Knex')

        switch (location) {
            case '':
            case undefined: {
                if (ctx.data && ctx.data.form.message) {
                    const message = ctx.data.form.message.substring(0,255)
                    this.message_store.push(ctx, message, knex)
                }
                return this.return_html(ctx, 'index')
            }
            case 'history': {
                // Should at some point return history by request

                let [message_list, err] = await knex
                    .query('_message')
                    .select<message[]>('_message.created_at', '_message.content', 'user.name', 'user.pfp_code')
                    .join('user', '_message.user_id', '=', 'user.id')
                    .then(unpack<message[]>)
                
                return this.return_data(ctx, JSON.stringify({messages: message_list}))
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
