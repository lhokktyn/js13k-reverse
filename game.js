/* ------------------------------------------------------------------ Globals */

var cMain, ctxMain,
    cMask, ctxMask,
    sprites = {
        lightOff: null, lightOn: null,
        floaterOff: null, floaterOn: null
    },
    controls = {
        mouseup:null, mousedown:null, mousemove:null, mouseout:null, tap:null,
        touchstart:null, touchend:null, touchmove:null
    },
    gameState = {
        inLoop: false,    // Enables/disables the game loop
        level: 0,         // Current level
        bg: null,         // Background image or canvas
        dateStart: null,  // Date the level started (used for timed events)
        levelTick: null,  // Function specfic to current level; run every tick
        levelInit: null,  // Function run to intiailise the level
        levelEnd: null,   // Function run at end of the level
        viewport: {       // Browser viewport 
            z: 1, ztgt: 1,    // z = zoom level, ztgt = target zoom (for animation)
            cx: 0, cxtgt: 0,  // cx/cy = current offset from centre of stage, cxtgt/ytgt = target offset (for animation)
            cy: 0, cytgt: 0,
            bx: 0, by: 0, bw: 0, bh: 0  // Describes the bit of stage that is fully visible within the browser viewport (x, y, width, height)
        },
        stage: {    // The stage width and height (ie the game field)
            w: 0,
            h: 0
        },
        maxLightRadius: null,     // When a light is on full power, it will throw this radius of illumination
        powerDrainPerLight: 0.9,  // Multiplier to affect light radius per light on stage
        numActiveLights: 0,       // No. lights turned on currently
        lights: []                // All light switches on the stage
    };

/**
 * A light.
 * 
 * @param {float} x   x coord (relative to top left of stage)
 * @param {float} y   y coord (relative to top left of stage)
 * @param {int} i   interactive? (0 = no (default), 1 = yes)
 * @param {int} s   state (0 = off (default), 1 = on)
 * @param {function|array} p   tick function(s) (execute on every frame)
 * @param {string} col colour (eg. "rgb(255, 200, 100)")
 * @param {int} t   sprite type (0 = lamp, 1 = floating light, 2 = orb)
 */
var Light = function (x, y, i, s, p, col, t) {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.interactive = i === 1;
    this.state = s === 1;
    this.tickFunc = p ? (typeof p === 'function' ? [p] : p) : [function () {}];
    this.color = col || "rgb(230, 230, 220)";  // slightly off-full white gives better overlap effects light
    this.type = t || 0;

    // power = 0..1
    // targetPower is for animation purposes
    this.power = 1;
    this.targetPower = 1;

    this.updateTick = function (state, dt) {
        for (var i = 0, l = this.tickFunc.length; i < l; i ++) {
            this.tickFunc[i].call(this, state, dt);
        }
        this.targetPower = Math.min(1, this.targetPower + (Math.random() * 0.1) - 0.05);    // adds "flicker"
        this.power += (this.targetPower - this.power) * 0.10;
    };

    this.hitTest = function (x, y) {
        var threshold = this.type === 1 ? 20 : 15,
            dd = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
        return dd < threshold;
    };

    this.plotSprite = function (state, dest, x, y) {
        var s, dx = 0, dy = 0;
        switch (this.type) {
            case 2: s = sprites[this.state ? 'orbOn' : 'orbOff']; dx = -s.width*0.5; dy = -s.height*0.5; break;
            case 1: s = sprites[this.state ? 'floaterOn' : 'floaterOff']; dx = -s.width*0.5; dy = -15; break;
            default: s = sprites[this.state ? 'lightOn' : 'lightOff']; dx = -s.width*0.5; dy = -15;
        }
        dest.drawImage(s, x + (dx * state.viewport.z), y + (dy * state.viewport.z), s.width * state.viewport.z, s.height * state.viewport.z);
    };
};


/* ----------------------------------------------------------- Browser events */

window.onload = function () {
    cMain = document.createElement('canvas');
    cMask = document.createElement('canvas');
    ctxMain = cMain.getContext('2d');
    ctxMask = cMask.getContext('2d');

    document.body.appendChild(cMain);
    window.onresize();

    loadAssets(function () {
        // If we've already been through the tutorial, don't bother again
        var lvl = window.localStorage.tut_revdark ? 1 : 0;
        prepareLevel(lvl, gameState, function () {
            start(gameState);
        });
    });
};

window.onresize = function () {
    // Cnavas always fills the browser viewport
    cMain.width = cMask.width = window.innerWidth;
    cMain.height = cMask.height = window.innerHeight;
};


/* ---------------------------------------------------------- Utility methods */

function loadAssets (cb) {
    var spriteSheet = new Image(),
        meta = [
            ['lightOff', 0, 0, 26, 70],
            ['lightOn', 26, 0, 26, 70],
            ['floaterOff', 52, 0, 26, 70],
            ['floaterOn', 78, 0, 26, 70],
            ['orbOff', 104, 0, 30, 30],
            ['orbOn', 104, 30, 30, 30]
        ];
    spriteSheet.onload = function () {
        for (var i = 0, l = meta.length; i < l; i ++) {
            var m = meta[i];
            sprites[m[0]] = document.createElement('canvas');
            var ctx = sprites[m[0]].getContext("2d");
            sprites[m[0]].width = m[3];
            sprites[m[0]].height = m[4];
            ctx.drawImage(this, m[1], m[2], m[3], m[4], 0, 0, m[3], m[4]);
        }
        cb();
    };
    spriteSheet.src = "sprites.png";
}

function stageCoordToViewport(c, state) {
    return {
        x: (c.x - state.viewport.bx) * state.viewport.z,
        y: (c.y - state.viewport.by) * state.viewport.z
    };
}

function viewportToStageCoord (c, state) {
    return {
        x: (c.x / state.viewport.z) + state.viewport.bx,
        y: (c.y / state.viewport.z) + state.viewport.by
    };
}

function start (state) {
    state.inLoop = false;

    if (state.level < 2) {
        setTip('<h1>Reverse the Darkness</h1>', 3000, function () {
            go();
        });
    } else {
        setTip('');
        go();
    }

    function go () {
        state.levelInit(state);
        state.dateStart = new Date();
        state.inLoop = true;
        gameLoop();
    }
}

/**
 * Prepare a level for playing.
 * 
 * @param {int} l Level index
 * @param {object} state Game state that will hold extracted level info
 * @param {Function} cb Callback once level is ready
 * @return {void}
 */
function prepareLevel (l, state, cb) {

    // Teardown any previous controls
    teardownControls(state);

    // Extract level meta
    var lm = levelMeta[l];
    state.level = l;
    state.levelMeta = lm;

    // Create lights
    state.maxLightRadius = lm.lr;
    state.powerDrainPerLight = lm.ld;
    state.lights = [];
    var B = {x:100000,y:100000,w:0,h:0};
    for (var a = 0, b = lm.l.length; a < b; a ++) {
        state.lights.push(new Light(lm.l[a].x, lm.l[a].y, lm.l[a].i, lm.l[a].s, lm.l[a].p, lm.l[a].col, lm.l[a].t));
        B.x = Math.min(B.x, lm.l[a].x);
        B.y = Math.min(B.y, lm.l[a].y);
        B.w = Math.max(B.w, Math.abs(B.x - lm.l[a].x));
        B.h = Math.max(B.h, Math.abs(B.y - lm.l[a].y));
    }

    // Viewport config
    // Set the zoom initially so the orb and starting light can be seen without
    // panning
    state.viewport.z = state.viewport.ztgt = Math.min(Math.min(window.innerHeight / B.h, window.innerWidth / B.w) * 0.80, 2);
    state.viewport.cx = state.viewport.cxtgt = state.lights[state.lights.length - 1].state ? ((state.lights[state.lights.length - 1].x + state.lights[0].x) * 0.5) - (lm.sw * 0.5) : 0;
    state.viewport.cy = state.viewport.cytgt = state.lights[state.lights.length - 1].state ? ((state.lights[state.lights.length - 1].y + state.lights[0].y) * 0.5) - (lm.sh * 0.5) : 0;

    // Level functions
    state.levelTick = lm.lvlt || function () {};
    state.levelInit = lm.lvli || function () {};
    state.levelEnd = lm.lvle || function () {};

    // Generate/load stage background
    var bg = new Image();
    bg.onload = function () {
        var c = document.createElement("canvas");
        c.width = lm.sw;
        c.height = lm.sh;
        var ctx = c.getContext("2d");
        var pat = ctx.createPattern(this, "repeat");
        ctx.rect(0, 0, lm.sw, lm.sh);
        ctx.fillStyle = pat;
        ctx.fill();
        state.bg = c;
        state.stage.w = lm.sw;
        state.stage.h = lm.sh;

        setupControls(state, cb);
    };
    bg.src = "bg.jpg";
};

function setupControls (state, cb) {
    var touchStartTime,
        touchStartPosition,
        dragging,
        dragAnchor,
        tapThreshold = 300,
        dragThreshold = 10,
        hasInteracted = false;

    document.body.addEventListener('mousedown', controls.mousedown = controls.touchstart = function (ev) {
        touchStartTime = (new Date).getTime();
        touchStartPosition = ev.type === 'touchstart' ? {x:ev.touches[0].clientX, y:ev.touches[0].clientY} : {x:ev.clientX, y:ev.clientY};
        /*-DEBUG:START-*/
        if (window.debug) {
            var c = viewportToStageCoord({x:ev.clientX, y:ev.clientY}, state);
            for (var i = 0, l = state.lights.length; i < l; i ++) {
                if (state.lights[i].interactive && state.lights[i].hitTest(c.x, c.y)) {
                    window.draggingsprite = state.lights[i];
                    window.draggingspritex = state.lights[i].x;
                    window.draggingspritey = state.lights[i].y;
                }
            }
        }
        /*-DEBUG:END-*/
    }, false);
    document.body.addEventListener('touchstart', controls.touchstart, false);

    document.body.addEventListener('mouseup', controls.mouseup = controls.touchend = function (ev) {
        var dt = (new Date).getTime() - touchStartTime;
        if (dt < tapThreshold && dt > 0) {  // 0 to cater for mouseup being triggered by touchend on laptop touhscreens
            var e = new CustomEvent('tap', {detail:touchStartPosition});
            document.body.dispatchEvent(e);
        }
        touchStartTime = 0;
        touchStartPosition = null;
        dragging = false;

        /*-DEBUG:START-*/
        if (window.debug) {
            window.draggingsprite = null;
            var map = [];
            for (var i = 0, l = state.lights.length; i < l; i ++) {
                map.push({
                    x:state.lights[i].x,
                    y:state.lights[i].y,
                    i:1,
                    s:i === 0 ? 1 : 0
                });
            }
            console.log(JSON.stringify(map).replace(/"/g, ''));
        }
        /*-DEBUG:END-*/
    }, false);
    document.body.addEventListener('touchend', controls.touchend, false);

    document.body.addEventListener('mousemove', controls.mousemove = controls.touchmove = function (ev) {
        var ex = ev.type === 'touchmove' ? ev.touches[0].clientX : ev.clientX,
            ey = ev.type === 'touchmove' ? ev.touches[0].clientY : ev.clientY;

        /*-DEBUG:START-*/
        if (window.debug && dragging && window.draggingsprite) {
            var dx = (dragAnchor.x - state.viewport.cx) + (touchStartPosition.x - ex) / state.viewport.z,
                dy = (dragAnchor.y - state.viewport.cy) + (touchStartPosition.y - ey) / state.viewport.z;
            window.draggingsprite.x = window.draggingspritex - dx;
            window.draggingsprite.y = window.draggingspritey - dy;
            return true;
        }
        /*-DEBUG:END-*/

        if (dragging) {
            var dx = touchStartPosition.x - ex,
                dy = touchStartPosition.y - ey;
            state.viewport.cxtgt = state.viewport.cx = dragAnchor.x + dx / state.viewport.z;
            state.viewport.cytgt = state.viewport.cy = dragAnchor.y + dy / state.viewport.z;
        } else if (touchStartPosition && (Math.abs(ex - touchStartPosition.x) > dragThreshold || Math.abs(ey - touchStartPosition.y) > dragThreshold)) {
            touchStartTime = 0;
            dragging = true;
            dragAnchor = {x:state.viewport.cx, y:state.viewport.cy};
        }
    });
    document.body.addEventListener('touchmove', controls.touchmove, false);

    window.addEventListener('mouseout', controls.mouseout = function () {
        touchStartTime = 0;
        touchStartPosition = null;
        dragging = false;
    }, false);

    document.body.addEventListener('tap', controls.tap = function (ev) {
        var c = viewportToStageCoord(ev.detail, state),
            sx = c.x,
            sy = c.y;

        // Get colour at tap - we're only interested in taps that took place in
        // the light
        var p = ctxMask.getImageData(ev.detail.x, ev.detail.y, 1, 1).data,
            col = ((p[0] << 16) | (p[1] << 8) | p[2]);
        if (col < 65000) {   // Greyscale threshold below which th tap is considered "not within the light"
            return false;
        }

        // Find the light switch that was hit, and toggle
        // At this point, we also hide the end light, if it's not already
        for (var i = 0, l = state.lights.length; i < l; i ++) {
            if (state.lights[i].interactive && state.lights[i].hitTest(sx, sy)) {
                state.lights[i].state = !state.lights[i].state;
                if (i !== state.lights.length - 1 && !hasInteracted) {
                    hasInteracted = true;
                    state.lights[0].interactive = 1;
                    state.lights[state.lights.length - 1].state = 0;
                    state.lights[state.lights.length - 1].interactive = 1;
                    state.viewport.ztgt = state.levelMeta.sz || 1;
                    state.viewport.cxtgt = state.levelMeta.sx - (state.levelMeta.sw * 0.5);
                    state.viewport.cytgt = state.levelMeta.sy - (state.levelMeta.sh * 0.5);
                }
            }
        }
    }, false);

    cb();
};

function teardownControls (state, cb) {
    with(document.body) {
        for (var i in controls) {
            removeEventListener(i, controls[i], false);
            controls[i] = null;
        }
    }

    if (cb) {
        cb();
    }
}

function setTip (html, t, cb) {
    var d = document.getElementsByTagName('div')[0];
    d.innerHTML = html || "";
    d.className = '';
    if (t) {
        setTimeout(function () {
            d.className = 'clear';
            setTimeout(function () {
                if (cb) cb();
            }, 1000);
        }, t);
    } else if (!html) {
        d.className = '';
    }
};


/* --------------------------------------------------------------------- Game */

function gameLoop () {
    if (gameState.inLoop) {
        requestAnimationFrame(gameLoop);
        renderGame(gameState);
    }
};

function nextLevel (state) {
    state.inLoop = false;
    setTip('', 1, function () {
        prepareLevel(state.level + 1, state, function () {
            start(state);
        });
    });
    return false;
};

function endLevel (state, success) {
    if (!success) {
        state.inLoop = false;
        setTip("You're alone, in the dark.", 2000, function () {
            prepareLevel(1, state, function () {
                start(state);
            });
        });
        return;
    }

    // Turn off all lights except the end light
    for (var i = state.lights.length - 2; i >= 0; i --) {
        state.lights[i].state = false;
    }
    var ll = state.lights[state.lights.length - 1];
    ll.state = true;
    ll.interactive = false;
    state.viewport.cxtgt = ll.x - (state.stage.w * 0.5);
    state.viewport.cytgt = ll.y - (state.stage.h * 0.5);
    state.viewport.ztgt = 2;

    window.nextLevel = function () {
        state.inLoop = false;
        ctxMain.width = ctxMain.width;
        ctxMain.height = ctxMain.height;
        if (levelMeta.length <= state.level + 1) {
            setTip('<h1>The End</h1><p>You\'ve got yourself a nice bag of orbs there.</p>')
        } else {
            prepareLevel(state.level + 1, state, function () {
                start(state);
            });
        }
        return false;
    };
    setTip('<button onclick="nextLevel()" type="button">Play more?</button>');
};

function renderGame (state) {

    // Clear canvases
    cMain.width = cMain.width;
    cMain.height = cMain.height;

    // Update viewport bounds
    // These map the browser viewport to the visible box on the stage
    state.viewport.z += (state.viewport.ztgt - state.viewport.z) * 0.03;
    state.viewport.cx += (state.viewport.cxtgt - state.viewport.cx) * 0.03;
    state.viewport.cy += (state.viewport.cytgt - state.viewport.cy) * 0.03;
    state.viewport.bw = window.innerWidth / state.viewport.z;
    state.viewport.bh = window.innerHeight / state.viewport.z;
    state.viewport.bx = ((state.stage.w - state.viewport.bw) * 0.5) + state.viewport.cx;
    state.viewport.by = ((state.stage.h - state.viewport.bh) * 0.5) + state.viewport.cy;

    // Update each light using their individual tick function
    state.numActiveLights = 0;
    for (var i = 0, l = state.lights.length; i < l; i ++) {
        state.numActiveLights += state.lights[i].state;
    }
    for (var i = 0, l = state.lights.length; i < l; i ++) {
        state.lights[i].targetPower = Math.pow(state.powerDrainPerLight, state.numActiveLights - 1);
        state.lights[i].updateTick(state, (new Date).getTime() - state.dateStart.getTime());
    }

    // No lights? No continue
    if (state.level > 0 && state.numActiveLights < 1) {
        endLevel(state, false);
        return;
    }

    // Level-specific global update
    state.levelTick(state, (new Date).getTime() - state.dateStart.getTime());

    // Render UI
    renderStage(state);
    renderSprites(state);
    renderMask(state);
};

function renderStage (state) {
    ctxMain.drawImage(
        state.bg,
        -state.viewport.bx * state.viewport.z,
        -state.viewport.by * state.viewport.z,
        state.stage.w * state.viewport.z,
        state.stage.h * state.viewport.z
    );
};

function renderSprites (state) {
    for (var i = 0, l = state.lights.length, x, y, s, d, light; i < l; i ++) {
        light = state.lights[i];

        var c = stageCoordToViewport(light, state);
        x = c.x;
        y = c.y;

        light.plotSprite(state, ctxMain, x, y);
    }
};

function renderMask (state) {

    // Fill the entire mask with darkness
    ctxMask.globalCompositeOperation = 'source-over';
    ctxMask.fillStyle = '#000000';
    ctxMask.fillRect(0, 0, cMask.width, cMask.height);

    // Cut out holes for each light that's visible within the current viewport
    ctxMask.globalCompositeOperation = 'lighter';   // "screen" looks better, but only works on Chrome
    for (var i = 0, l = state.lights.length, x, y, d, c, light, grd; i < l; i ++) {
        light = state.lights[i];
        if (!light.state) {
            continue;
        }

        d = state.maxLightRadius * 2 * state.viewport.z * light.power;
        c = stageCoordToViewport(light, state);
        x = c.x;
        y = c.y;

        grd = ctxMask.createRadialGradient(x, y, d * 0.45 * light.power, x, y, d * 0.5);
        grd.addColorStop(0, light.color);
        grd.addColorStop(1, "black");

        ctxMask.beginPath();
        ctxMask.arc(x, y, d * 0.5, 0, 2 * Math.PI, false);
        ctxMask.fillStyle = grd;
        ctxMask.fill();
    }

    ctxMain.globalCompositeOperation = 'multiply';
    ctxMain.drawImage(cMask, 0, 0);
    ctxMain.globalCompositeOperation = 'source-over';
};
