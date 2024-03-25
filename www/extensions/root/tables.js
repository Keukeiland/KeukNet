module.exports = (Tables) => {return class extends Tables {
    tables = {
        'user': 0,
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
