import { Logger } from "matrix-js-sdk/lib/logger.js"

export const logger = new (class Log implements Logger {
    getChild(namespace: string): Logger {
        throw new Error('Not implemented!')
    }
    trace(...msg: any[]): void {
        console.log('TRACE:', ...msg)
    }
    debug(...msg: any[]): void {
        return // Disable debug logging
    }
    info(...msg: any[]): void {
        // console.log('INFO:', ...msg)
    }
    warn(...msg: any[]): void {
        console.warn('WARN:', ...msg)
    }
    error(...msg: any[]): void {
        console.error('ERROR:', ...msg)
    }
})()
