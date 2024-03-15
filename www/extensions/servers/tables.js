module.exports = (Tables) => {return class extends Tables {
    tables = {
        'server': 0
    }

    server = {
        0:()=>{
            this.db.createTable('server', [
                'id INTEGER PRIMARY KEY AUTOINCREMENT',
                'admin_id INTEGER NOT NULL',
                'name VARCHAR NOT NULL',
                'description TEXT NOT NULL',
                'ip VARCHAR NOT NULL',
                'url VARCHAR',
                'CONSTRAINT fk_admin_id FOREIGN KEY (admin_id) REFERENCES user(id)'
            ])
        }
    }
}}
