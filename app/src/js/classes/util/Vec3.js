class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    crossProduct(v) {
        var tx = this.y * v.z - this.z * v.y;
        var ty = this.z * v.x - this.x * v.z;
        var tz = this.x * v.y - this.y * v.x;
        return new Vec3(tx, ty, tz);
    }
    magSqr() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    mag() {
        return Math.sqrt(this.magSqr());
    }
    scaled(val) {
        return new Vec3(this.x * val, this.y * val, this.z * val);
    }
    normalize() {
        return this.scaled(1 / this.mag());
    }
}

export default Vec3;