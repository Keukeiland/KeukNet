module.exports = (Tables) => {return class extends Tables {
    tables = {
        'user': 1,
        'db_table_versions': 0
    }

    user = {
        0:()=>{
            this.db.createTable('user', [
                'id INTEGER PRIMARY KEY AUTOINCREMENT',
                'name VARCHAR NOT NULL',
                'password VARCHAR NOT NULL',
                'regdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL',
                'is_admin BOOLEAN NOT NULL DEFAULT FALSE CHECK (is_admin IN (0,1))',
            ])
        },
        1:()=>{
            this.db.select('user', ['id','name'], null, null, [], (err, data) => {
                if(err)console.log(err)
                this.db.addColumn('user', 'pfp_code TEXT', (err) => {
                    if(err)console.log(err)
                    for (const user of data) {
                        this.db.update('user', ['pfp_code=$name'], 'id=$id', [`seed=${user.name}`, user.id], (err)=>{if(err)console.log(err)})
                    }
                })
            })
        }
    }
    db_table_versions = {
        0:()=>{
            this.db.createTable('db_table_versions', [
                'id INTEGER PRIMARY KEY AUTOINCREMENT',
                'table_id VARCHAR NOT NULL',
                'version INTEGER NOT NULL DEFAULT 1'
            ])
        }
    }
}}
