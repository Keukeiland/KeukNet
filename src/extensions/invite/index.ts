import { ExtensionBase, Knex } from '../../modules.ts'
import { unpack } from '../../util.ts'

export default class extends ExtensionBase {
    override name = 'invite'
    override title = 'Invite'
    override tables = true
    override admin_only = true

    invite_URL = 'http://127.0.0.1:8000/invite/register/'

    override handle: Extension['handle'] = async (ctx) => {
        let [knex]: [Knex] = this.get_dependencies('Knex')
        var location = ctx.path.shift()

        switch (location) {
            case '':
            case undefined:{

                var [invite_links, err] = await knex
                .query('_invite')
                .select<string[]>('*')
                .then(unpack<string[]>)

                ctx.context.invite_links = invite_links
                return this.return_html(ctx, 'index')
            }
            case 'create':

                const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
                let random_chars = 'r'
                for (let i = 0; i < 8; i++) {
                    random_chars += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                
                let invite_link = this.invite_URL + random_chars + Date.now();
                const time = new Date().toLocaleTimeString('en-US', {hour12: false});

                await knex.query('_invite')
                // @ts-expect-error
                .insert({link: invite_link, created_at: new Date().toLocaleTimeString('en-US', {hour12: false})})

                ctx.context.invite_links = invite_links

                return this.return(ctx, undefined, location='/invite')
            default: {
                    return this.return_file(ctx, location)
                }
        }
        
    }
}
