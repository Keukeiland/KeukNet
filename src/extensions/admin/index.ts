import { ExtensionBase, Knex } from '../../modules.ts'
import { unpack } from '../../util.ts'

export default class extends ExtensionBase {
    override name = 'admin'
    override title = 'Admin'
    override admin_only = true

    user_info: {id: any, username: any, reg_date: any, admin: any}[] = []
    sortingType = "id"
 
    override handle: Extension['handle'] = async (ctx) => {
        let [knex]: [Knex] = this.get_dependencies('Knex')
        var location = ctx.path.shift()

        switch (location) {
            case '':
            case undefined:{
                var [user_list, err] = await knex
                .query('user')
                .select<User[]>('*')
                .then(unpack<User[]>)

                ctx.context.user_info = user_list
                return this.return_html(ctx, 'index', err)
            }
            case 'toggle_admin':{
                var id = ctx.args.get("id")

                var [user, err] = await knex
                .query('user')
                .select<User>('*')
                .where('id', id)
                .first()
                .then(unpack<User>)

                await knex
                    .query('user')
                    .update('is_admin', !user?.is_admin)
                    .where('id', id)
            
                return this.return(ctx, undefined, location='/admin')
                }
                case 'remove_account':{
                    var id = ctx.args.get("id")

                    await knex
                    .query('user')
                    .where('id', id)
                    .delete('*')

                    return this.return(ctx, undefined, location='/admin')
                }
                default: {
                    return this.return_file(ctx, location)
                }
        }
        
    }
}
