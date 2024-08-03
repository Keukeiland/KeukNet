import { ExtensionBase } from "../../modules"

export default class extends ExtensionBase {
    name = 'admin'
    title = 'Admin'
    admin_only = true
    dependencies = ['content','nj']

    init(context) {
        return ExtensionBase.init(this, context)
    }

    handle(req, res) {
        this.return_html(req, res, 'index')
    }
}
