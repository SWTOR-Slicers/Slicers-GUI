import { ww2ogg } from "../Util.js";

export class WEM {
    constructor (buffer) {
        this.oggBuffer = ww2ogg(new DataView(buffer));
    }
}