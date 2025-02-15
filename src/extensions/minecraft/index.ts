import { ExtensionBase } from "../../modules.js"
import Knex from "../../modules/knex.ts"
import { unpack } from "../../util.ts"

export default class extends ExtensionBase {
    override name = 'minecraft'
    override title = 'Minecraft'
    override tables = true

    override init: Extension['init'] = async (context) => {
        return ExtensionBase.init(this, context)
    }

    override handle: Extension['handle'] = async (ctx) => {
        var location = ctx.path.shift()
        let [knex]: [Knex] = this.get_dependencies('Knex')

        switch (location) {
            case '':
            case undefined: {
                let [name, err] = await knex
                .query('_minecraft')
                .select('minecraft_name')
                .where('user_id', ctx.context.user?.id)
                .first()
                .then(unpack<any>)

                if (name)
                    ctx.context.minecraft_username = name.minecraft_name
                else
                    ctx.context.minecraft_username = ""
                return this.return_html(ctx, 'index')
            }
            case 'change':{
                if (ctx.data)
                {
                    let new_MCName = ctx.data.form.minecraft_name
                    let [name, err] = await knex
                    .query('_minecraft')
                    .select('minecraft_name')
                    .where('user_id', ctx.context.user?.id)

                    if (name){
                        await knex
                        .query('_minecraft')
                        .update('minecraft_name', new_MCName)
                        .where('user_id', ctx.context.user?.id)
                    }else{
                        await knex
                        .query('_minecraft')
                        // @ts-expect-error
                        .insert({minecraft_name: new_MCName, user_id: ctx.context.user?.id})
                    }
                }

                return this.return(ctx, undefined, location='/minecraft')
            }
        }
    }
}
