import {default as texts} from '../../../config/texts.ts'
import { LibraryBase } from "../../classes/library.ts"

export default class Texts extends LibraryBase<{}> {
    get(name: string): string | undefined {
        return (texts as {[key: string]: string})[name]
    }
}
