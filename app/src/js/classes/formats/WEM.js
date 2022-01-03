import { ww2ogg } from "../../Util.js";

export class WEM {
    constructor (reader) {
        this.oggBuffer = ww2ogg(reader);
    }
}