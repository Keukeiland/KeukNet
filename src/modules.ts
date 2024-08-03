import * as Nunjucks from 'nunjucks'
export const nj: Environment = Nunjucks.configure([
    __dirname+'/templates',
    __dirname+'/extensions'
])

export {default as cookie} from 'cookie'
export {ExtensionBase} from './classes/extension'
export {Tables} from './classes/tables'
export {DB} from './classes/db'
export {default as Log} from './modules/log'
export * as content from './modules/content_type'
export {default as Fetch} from './modules/fetch'
export {default as config} from '../config/config'
export {default as wg_config} from '../config/wireguard'
export {default as texts} from '../config/texts'
