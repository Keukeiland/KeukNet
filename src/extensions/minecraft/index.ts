import { ExtensionBase } from "../../modules.js"
import Knex from "../../modules/knex.ts"
import { unpack } from "../../util.ts"
import * as rcon from "./lib.ts"

export default class extends ExtensionBase {
    override name = 'minecraft'
    override title = 'Minecraft'
    override tables = true

    override init: Extension['init'] = async (context) => {
        // Init super here as rest of init happens async
        const result = ExtensionBase.init(this, context)

        // On a separate "thread" in case we can't connect to the RCON server immediately
        setTimeout(this.update_whitelist, 0)

        return result
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
                    let new_MCName = ctx.data.form.minecraft_name ?? ''
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

                    // Intentionally not awaited as it can take a while
                    this.update_whitelist()
                }

                return this.return(ctx, undefined, location='/minecraft')
            }default: {
                return this.return_file(ctx, location)
            }
        }
    }

    update_whitelist = async () => {
        const [knex]: [Knex] = this.get_dependencies('Knex')
        const [raw_names, err] = await knex
            .query('_minecraft')
            .select('minecraft_name')
            .then(unpack<{minecraft_name: string}[]>, unpack<undefined>)
        if (err)
            return
        const names: string[] = (raw_names ?? [])
            // Unpack objects
            .flatMap((name) => name.minecraft_name)
            // Remove empty rows
            .filter((name) => name != '')

        const currently_whitelisted_raw = await rcon.send("whitelist list")
        const currently_whitelisted = currently_whitelisted_raw
            .split(' ')
            // Remove trash
            .slice(5)
            .flatMap((name) => {
                if (name.endsWith(','))
                    return name.substring(0, name.length -1)
                return name
            })

        const to_remove = currently_whitelisted.filter((name) => !names.includes(name))
        const to_add = names.filter((name) => !currently_whitelisted.includes(name))

        for (const name of to_remove) {
            const response = await rcon.send(`whitelist remove ${name}`)
            console.log(response)
        }
        for (const name of to_add) {
            const response = await rcon.send(`whitelist add ${name}`)
            console.log(response)
        }
    }
}
