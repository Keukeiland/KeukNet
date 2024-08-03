module.exports = (Tables) => {return class extends Tables {
    tables = {
        'device': 0
    }

    device = {
        0:()=>{
            this.db.createTable('device', [
                'id INTEGER PRIMARY KEY AUTOINCREMENT',
                'user_id INTEGER NOT NULL',
                'name VARCHAR',
                'uuid CHAR(36) NOT NULL',
                'ip VARCHAR NOT NULL',
                'installed BOOLEAN NOT NULL DEFAULT FALSE CHECK (installed IN (0,1))',
                'CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user(id)'
            ])
        }
    }
}}
