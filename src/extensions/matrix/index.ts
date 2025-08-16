import { ExtensionBase } from "../../modules.ts"
import webpack from 'webpack'
import webpack_config from './webpack.config.js'

export default class extends ExtensionBase {
    override name = 'matrix'
    override title = 'Matrix'

    override init: Extension['init'] = async (context) => {
        const compiler = webpack(webpack_config(context.path))

        await new Promise<void>((resolve) => {
            compiler.run((err, stats) => {
                if (err) console.log(err)
    
                if (stats?.hasErrors() || stats?.hasWarnings()) {
                    console.log(stats.toString())
                }
    
                compiler.close((err) => {
                    if (err) console.log(err)
                    
                    resolve()
                })
            })
        })

        return ExtensionBase.init(this, context)
    }

    override handle: Extension['handle'] = (ctx) => {
        var location = ctx.path.shift()

        switch (location) {
            case '':
            case undefined: {
                return this.return_html(ctx, 'client')
            }
            default: {
                this.return_file(ctx, [location, ...ctx.path].join("/"))
            }
        }
    }
}
