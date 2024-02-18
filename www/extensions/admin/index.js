module.exports = (Extension) => {return class extends Extension {
    name = 'admin'
    title = 'Admin'
    admin_only = true
    dependencies = ['data','content','nj']

    handle(req, res) {
        this.return_html(req, res, 'index')
    }
}}
