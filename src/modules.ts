import nunjucks from 'nunjucks'
export const nj: Environment = nunjucks.configure([
    `${import.meta.dirname}/templates`,
    `${import.meta.dirname}/extensions`
])

export * as cookie from 'cookie'
export {ExtensionBase} from './classes/extension.ts'
export {Tables} from './classes/tables.ts'
export {default as Knex} from './modules/knex.ts'
export {default as Log} from './modules/log.ts'
export {default as content} from './modules/content_type.ts'
export {default as Fetch} from './modules/fetch.ts'
export {default as config} from '../config/config.ts'
export {default as wg_config} from '../config/wireguard.ts'
export {default as texts} from '../config/texts.ts'
