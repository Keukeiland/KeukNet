import { LibraryBase } from "../../classes/library.ts"
import Fetch from "../../modules/fetch.ts"
import { unpack } from "../../util.ts"
import Content from '../content/lib.ts'

type Libraries = {
    content: Content,
}

export default class HTTP extends LibraryBase<Libraries> {
    fetch: Fetch

    override init: Library['init'] = (context, host, libproxy) => {
        LibraryBase.init(this, context, host, libproxy)

        this.fetch = new Fetch()
        this.fetch.init(context)
    }

    async return_file(ctx: Context, file: string): Promise<void> {
        const {res} = ctx
        const {content} = this.libs

        const [result, err] = await this.fetch.file(file).then(unpack<[string, string]>)
        if (err) {
            res.writeHead(404)
            res.end()
            return
        }

        const [data, filetype] = result

        res.writeHead(200, content.get(filetype))
        res.end(data)
    }

    return_data(ctx: Context, data: any, err?: Error | null, headers={}, err_code=404): void {
        const {res} = ctx

        if (err) {
            res.writeHead(err_code)
            res.end()
            return
        }
        let args: any = {"Content-Type": "text/plain charset utf-8"}

        if (headers)
            args = headers
        
        res.writeHead(200, args)
        res.end(data)
        return
    }
}
