import { Tables } from '../../classes/tables'

export default class extends Tables {
    versions(versions) {
        versions.set('device', 0)

        return versions
    }

    migrations(db, migrations) {
        migrations.set('device', {
            0: ()=>{
                db.createTable('device', [
                    'id INTEGER PRIMARY KEY AUTOINCREMENT',
                    'user_id INTEGER NOT NULL',
                    'name VARCHAR',
                    'uuid CHAR(36) NOT NULL',
                    'ip VARCHAR NOT NULL',
                    'installed BOOLEAN NOT NULL DEFAULT FALSE CHECK (installed IN (0,1))',
                    'CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user(id)'
                ])
            }
        })

        return migrations
    }
}
