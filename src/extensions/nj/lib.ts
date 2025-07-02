import nunjucks from 'nunjucks'
import { Environment } from "nunjucks"
import { LibraryBase } from "../../classes/library.ts"
import Texts from '../texts/lib.ts'
import Content from '../content/lib.ts'
import config from '../../../config/config.ts'

type Libraries = {
    texts: Texts,
    content: Content,
}

export default class NJ extends LibraryBase<Libraries> {
    self: Environment

    name: string

    override init: Library['init'] = (context, host, libproxy) => {
        LibraryBase.init(this, context, host, libproxy)

        this.self = nunjucks.configure([
            `${import.meta.dirname}/../../templates/`,
            `${import.meta.dirname}/../`,
        ])
        this.name = context.name

        this.self.addGlobal('dicebear_host', config.dicebear_host)
        this.self.addGlobal('client_location', config.client_location)
    }

    return_text(ctx: Context, item: string): void {
        const {req, res} = ctx
        const {texts, content} = this.libs

        ctx.context.__render_item = texts.get(item)
        this.self.renderString(
            '{% extends "layout.html" %}{% block body %}{{__render_item |safe}}{% endblock %}',
            ctx.context, (err, data) => {
                if (err) {
                    res.writeHead(500)
                    return res.end()
                }
                res.writeHead(200, Content.types.html)

                if (data !== null)
                    return res.end(data)
                else
                    return res.end()
        })
    }

    return_html(ctx: Context, item: string, err?: Error, err_code=500, success_code=200, headers:{}|undefined=undefined): void {
        const {req, res} = ctx
        const {content} = this.libs

        
        if (err) {
            res.writeHead(err_code)
            res.end()
            return
        }
        
        headers = {...Content.types.html, ...headers}

        this.self.render(this.name+'/'+item+'.html', ctx.context, (err, data) => {
            if (err) {
                res.writeHead(err_code)
                res.end()
                return
            }
            res.writeHead(success_code, headers)

            if (data !== null)
                res.end(data)
            else
                res.end()
        })
    }
}
