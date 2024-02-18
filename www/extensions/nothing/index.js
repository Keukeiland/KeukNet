module.exports = (Extension) => {return class extends Extension {
    name = 'nothing'
    title = 'Nothing'
    dependencies = ['content','nj']

    handle(req, res) {
        this.return_html(req, res, 'index')
    }
}}
