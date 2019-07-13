var app = {
    initialize: function() {
        // Start loading images.
        this.imgPlus = new Image(256, 256);
        this.imgMinus = new Image(256, 256);
        this.imgEquals = new Image(256, 256);

        var imgPlusPromise = new Promise((resolve) => {
            this.imgPlus.addEventListener("load", resolve);
            this.imgPlus.src = "img/Plus.png";
        });
        var imgMinusPromise = new Promise((resolve) => {
            this.imgMinus.addEventListener("load", resolve);
            this.imgMinus.src = "img/Minus.png";
        });
        var imgEqualsPromise = new Promise((resolve) => {
            this.imgEquals.addEventListener("load", resolve);
            this.imgEquals.src = "img/Zero.png";
        });

        this.canvas = document.getElementById("canvas");
        this.context = canvas.getContext("2d", { alpha: false });
        this.initializeSize();
        window.addEventListener("resize", () => this.initializeSize());

        // ...once preloading is complete
        Promise.all([imgPlusPromise, imgMinusPromise, imgEqualsPromise]).then(() => {
            // Register: start or continue roll.
            document.body.addEventListener("mousedown", (e) => this.onStartOrContinue(e));
            document.body.addEventListener("touchstart", (e) => this.onStartOrContinue(e));
            document.body.addEventListener("keydown", (e) => this.onStartOrContinue(e));

            // Register: finish roll.
            document.body.addEventListener("mouseup", (e) => this.onFinish(e));
            document.body.addEventListener("touchend", (e) => this.onFinish(e));
            document.body.addEventListener("keyup", (e) => this.onFinish(e));

            // No need to keep rolling while we're looking away.
            document.body.addEventListener("blur", (e) => this.onFinish(e));

            // Register: full roll.
            document.body.addEventListener("focus", (e) => this.onFullRoll(e));

            // Initial paint.
            this.onFullRoll();
        });
    },

    initializeSize: function() {
        const SIZE = Math.min(window.innerWidth, window.innerHeight);
        this.canvas.width = SIZE;
        this.canvas.height = SIZE;
        this.scale = SIZE/512;

        // Reset any previous scaling.
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.scale(this.scale, this.scale);

        // Update display.
        this.paint();
    },

    // Roll the dice updating `this.values`.
    // Doesn't paint anything.
    roll: function() {
        for (var i = 0; i < 4; ++i) {
            const rand = Math.random();
            var value;
            if (rand < 1/3) {
                value = 0;
            } else if (rand < 2/3) {
                value = 1;
            } else {
                value = -1;
            }
            this.values[i] = value;
        }
    },

    // Paint a single frame.
    // Doesn't update accessibility.
    paint: function() {
        for (var i = 0; i < 4; ++i) {
            const value = this.values[i];
            const {x, y} = this.coordinates[i];
            var img;
            if (value == -1) {
                img = this.imgMinus;
            } else if (value == 0) {
                img = this.imgEquals;
            } else {
                img = this.imgPlus;
            }
            this.context.drawImage(img, x, y);
        }
    },

    onAnimationFrame: function() {
        this.updateRegistered = false;

        if (!this.shouldContinue) {
            // We have received a keyup/..., we may already have updated
            // accessibility, let's stop now.
            return;
        }

        // Update state.
        this.roll();
        // Paint.
        this.paint();

        // Register for next frame.
        requestAnimationFrame(() => this.onAnimationFrame());
        // FIXME: We probably shouldn't update *that* often.
    },

    onStartOrContinue: function() {
        if (!this.updateRegistered) {
            this.updateRegistered = true;
            this.shouldContinue = true;

            requestAnimationFrame(() => this.onAnimationFrame());
        }
    },

    onFinish: function() {
        this.shouldContinue = false;

        // Finally, update accessibility.
        var result = this.values.reduce((acc, val) => acc + val);
        this.canvas.textContent = result > 0 ? "+" + result : "" + result;
    },

    // Make a full roll, regardless of animation frame.
    onFullRoll: function() {
        this.roll();
        this.paint();
        this.onFinish();
    },

    // Number of frames to wait before updating.
    FRAME_WAIT: 4,
    shouldContinue: false,
    updateRegistered: false,
    canvas: null,
    context: null,
    imgPlus: null,
    imgMinus: null,
    imgEquals: null,
    coordinates: [{x: 0, y: 0}, {x: 256, y: 0}, {x: 0, y: 256}, {x: 256, y: 256}],
    values: [0, 0, 0, 0],
    scale: 1,
};

app.initialize();
