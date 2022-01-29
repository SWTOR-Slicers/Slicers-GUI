class DelayableLoop {
    constructor ({ delay, min, max, logic}) {
        this.delay = delay ? delay : 100;
        this.min = min ? min : 0;
        this.max = max;
        this.logic = logic;

        return this;
    }

    loop() {
        let i = this.min;

        const itterate = () => {
            setTimeout(() => {
                this.logic(i);
                i++;
                if (i < this.max) {
                    itterate();
                }
            }, this.delay);
        }

        itterate();
    }
}

export { DelayableLoop };