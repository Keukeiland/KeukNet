import { ExtensionBase } from "../../classes/extension.ts"
import NJ from "../nj/lib.ts"

type Libraries = {
    nj: NJ,
}

export default class extends ExtensionBase<Libraries> {
    override name = 'nothing'
    override title = 'Nothing'

    override handle: Extension['handle'] = (ctx) => {
        this.libs.nj.return_html(ctx, 'index')
    }
}
