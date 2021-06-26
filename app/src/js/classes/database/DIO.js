/**
 * Database Interface Object for SWTOR programming.
 */
export class DIO  {
    /**
     * @param {Number} id The GUUID of the object.
     * @param {String} name The text name of the object.
     * @param {Object} attributes Object representing the key->value pairs of the object's data.
     */
    constructor (id, name, attributes) {
        this.id = id;
        this.name = name;
        this.attributes = attributes;
    }

    writeDB() {}

    readDB() {}
}