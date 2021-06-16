import { ww2ogg } from "../Util.js";

export class WEM {
    constructor (buffer, offset, length) {
        this.oggBuffer = ww2ogg(new DataView(buffer, offset, length));
    }
}