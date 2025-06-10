import * as cookie from 'cookie'
import { LibraryBase } from "../../classes/library.ts"

export default class Cookie extends LibraryBase<{}> {
    set(key: string, value: any, secure = false): string {
        if (secure)
            return cookie.serialize(
                key,
                value, {
                    secure: true,
                    httpOnly: true,
                    path: '/'
                }
            )
        else
            return cookie.serialize(
                key,
                value, {
                    path: '/'
                }
            )
    }

    delete(key: string): string {
        return cookie.serialize(
            key,
            '', {
                expires: new Date(1)
            }
        )
    }
}
