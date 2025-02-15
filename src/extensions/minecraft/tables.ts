import { MigrationMap, Tables, VersionMap } from '../../classes/tables.ts'
import { Knex } from '../../modules.ts'

export default class extends Tables {
    override versions(versions: VersionMap) {
        versions.set('minecraft', 0)

        return versions
    }

    override migrations(knex: Knex, migrations: MigrationMap) {
        migrations.set('minecraft', {
            0: async ()=>{
                await knex.schema()
                    .createTable('_minecraft', (table) => {
                        table.increments('id').primary()
                        table.string('minecraft_name').notNullable()
                        table.integer('user_id')
                        table.foreign('user_id', 'fk_user_id').references('_root_user.id')
                    })
            },
        })

        return migrations
    }
}
