import { MigrationMap, Tables, VersionMap } from '../../classes/tables'

export default class extends Tables {
    override versions(versions: VersionMap) {
        versions.set('user', 1)
        versions.set('db_table_versions', 0)

        return versions
    }

    override migrations(db: DB, migrations: MigrationMap) {
        migrations.set('user', {
            0: ()=>{
                db.createTable('user', [
                    'id INTEGER PRIMARY KEY AUTOINCREMENT',
                    'name VARCHAR NOT NULL',
                    'password VARCHAR NOT NULL',
                    'regdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL',
                    'is_admin BOOLEAN NOT NULL DEFAULT FALSE CHECK (is_admin IN (0,1))',
                ])
            },
            1: ()=>{
                db.select('user', ['id','name'], null, null, [], (err, data) => {
                    if(err) console.log(err)
                    db.addColumn('user', 'pfp_code TEXT', (err) => {
                        if(err) console.log(err)
                        for (const user of data) {
                            db.update('user', ['pfp_code=$name'], 'id=$id', [`seed=${user.name}`, user.id], (err)=>{if(err)console.log(err)})
                        }
                    })
                })
            },
        })

        migrations.set('db_table_versions', {
            0: ()=>{
                db.createTable('db_table_versions', [
                    'id INTEGER PRIMARY KEY AUTOINCREMENT',
                    'table_id VARCHAR NOT NULL',
                    'version INTEGER NOT NULL DEFAULT 1'
                ])
            }
        })

        return migrations
    }
}
