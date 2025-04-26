import { MigrationMap, Tables, VersionMap } from '../../classes/tables.ts'
import { Knex } from '../../modules.ts'

export default class extends Tables {
    override versions(versions: VersionMap) {
        versions.set('invite', 0)

        return versions
    }

    override migrations(knex: Knex, migrations: MigrationMap) {
        migrations.set('invite', {
            0: async ()=>{
                await knex.schema()
                    .createTable('_invite', (table) => {
                        table.increments('id').primary()
                        table.string('code').notNullable()
                        table.datetime('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'))
                        table.boolean('used').notNullable().defaultTo(false)
                        table.integer('user_id')
                        table.foreign('user_id', 'fk_user_id').references('user.id')
                        table.integer('created_by')
                        table.foreign('created_by', 'fk_user_id').references('user.id')
                    })
                await knex.query('_invite')
                    // @ts-expect-error
                    .insert({code: 'admin'})
            },
        })
        return migrations
    }
}
