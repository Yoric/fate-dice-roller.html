var app = {
    initialize: function() {
        // Offer install on relevant platforms (Firefox OS/KaiOS).
        this.install();

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
            window.addEventListener("blur", (e) => this.onFinish(e));

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

        // Don't update at 60 fps, that's too much.
        if (this.waitFramesProgress <= 0) {
            // Update state.
            this.roll();
            // Paint.
            this.paint();

            this.waitFramesProgress = this.FRAME_WAIT;
        } else {
            this.waitFramesProgress -= 1;
        }

        // Register for next frame.
        requestAnimationFrame(() => this.onAnimationFrame());
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
        this.waitFramesProgress = 0;

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

    install: function() {
        if (!("mozApps" in window.navigator)) {
            // We don't know how to install on this platform.
            return;
        }
        alert("Trying to install the application");
        // Check if the application is already installed.
        var request;
        try {
            request = window.navigator.mozApps.getSelf();
        } catch (ex) {
            alert("Request error " + ex);
        }
        alert("Request placed");
        request.onerror = function onerror() {
            alert("Cannot determine whether application is installed");
            console.log("Cannot determine whether application is installed", request.error.message);
        };
        request.onsuccess = function onsuccess() {
            alert("Request success");
            if (request.result && request.result.manifest.name) {
                alert("Application is already installed");
                console.log("Application is already installed", request);
                return;
            } else {
                alert("Application isn't installed yet");
                console.log("Application isn't installed yet", request);
                eltInstall.classList.remove("invisible");
                eltInstall.classList.add("visible");
            }
            alert("Setting up installer");
            console.log("Setting up installer", request);
            var request = window.navigator.mozApps.install("http://yoric.github.com/piranhas/manifests/piranha.webapp");
            request.onsuccess = function () {
                alert("Installed!");
                // Save the App object that is returned
                var appRecord = this.result;
                console.log('Installation successful!', appRecord);
            };
            request.onerror = function (e) {
                alert("Install failed!");
                // Display the error information from the DOMError object
                console.log('Installation failed!', e);
            };
        };
    },

    // Number of frames to wait before updating.
    FRAME_WAIT: 4,
    waitFramesProgress: 0,
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
