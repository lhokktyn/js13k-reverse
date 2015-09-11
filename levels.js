// Common update 
// uEnd: Use this on the end light in each level (sets red light and fixes power)
function uEnd (s, t) {
    this.color = "rgb(255, 0, 0)";
    this.power = 0.25;
    if (this.state && this.interactive && s.level > 0) {
        // END LEVEL
        endLevel(s, true);
    }
}

function uHBounce (dx, dt) {
    return function (s, t) {
        (t /= dt);
        this.x = this.originX + (Math.sin(t) * dx);
    }
}

function uVBounce (dy, dt, o) {
    o = o || 0;
    return function (s, t) {
        (t /= dt);
        this.y = this.originY + (Math.sin(t + o) * dy);
    }
}

function uCircle (r, dt) {
    return function (s, t) {
        (t /= dt);
        var da = t % 360,
            dx = Math.cos(da * Math.PI/180) * r,
            dy = Math.sin(da * Math.PI/180) * r;
        this.x = this.originX + dx;
        this.y = this.originY + dy;
    }
}

var levelMeta = [
    /* sw: stage width,
     * sh: stage height,
     * sw: start x,
     * sy: start y,
     * ex: exit x,
     * ey: exit y,
     * lr: max light radius,
     * ld: light power drain multiplier,
     * lvlt: function called on every tick (function (state, deltaTime))
     * lvli: function called at start of level (function (state))
     * lvle: function called at end of level (function (state))
     * l: [light params ..]
     *     x: x coord,
     *     y: y coord,
     *     i: is interactive (bool, default true),
     *     s: initial state (0 = off, 1 = on, default off),
     *     p: tick function (optional) - alters light every loop tick - accept args: state, ms since start of level,
     *     t: sprite type (0 (default) = normal, 1 = floating light, 2 = orb)
     *
     * The first light in the list MUT be the "start light" and the last light
     * MUST be the "end light".
     */
    {
        sw:1000, sh:500, sx:200, sy:250, sz:1, lr:150, ld:0.90, lvli: function (s) {
                var len = s.lights.length,
                    dly = 100;

                // Narrative
                setTip('<p>Illuminate the darkness around you,<br/>by tapping the lamps ...</p>', 3000, function () {
                    setTip('<p>... and finding your way ...</p>', 3000, function () {
                        setTip('<p>... to the orb of awesomeness.</p>', 3000, function () {

                        });
                    })
                });

                // State changes
                s.lights[0].state = true;
                setTimeout(function () { s.lights[1].state = true; }, 2000);
                setTimeout(function () { s.lights[2].state = true; s.viewport.cxtgt = 400 - (s.stage.w * 0.5); }, 2500);
                setTimeout(function () { s.lights[3].state = true; s.viewport.cxtgt = 500 - (s.stage.w * 0.5); }, 3000);
                setTimeout(function () { s.lights[4].state = true; s.viewport.cxtgt = 600 - (s.stage.w * 0.5); }, 3500);
                setTimeout(function () { s.lights[0].state = false; }, 6000);
                setTimeout(function () { s.lights[1].state = false; }, 6500);
                setTimeout(function () { s.lights[2].state = false; }, 7000);
                setTimeout(function () { s.lights[3].state = false; }, 7500);
                setTimeout(function () { s.lights[5].state = true; s.viewport.cxtgt = 700 - (s.stage.w * 0.5); }, 8000);
                setTimeout(function () { s.lights[6].state = true; s.viewport.cxtgt = 800 - (s.stage.w * 0.5); }, 8500);
                setTimeout(function () { s.lights[0].state = s.lights[4].state = s.lights[5].state = false; s.viewport.ztgt = 2; }, 10000);
                setTimeout(function () {
                    window.localStorage.tut_revdark = true;
                    s.lights[6].state = false;
                    setTip("<p>Now your turn ...</p>", 2000, function () {
                        nextLevel(s);
                    });
                }, 13000);
            }, l:[
            {x:200, y:250},
            {x:300, y:250},
            {x:400, y:250},
            {x:500, y:250},
            {x:600, y:250},
            {x:700, y:250},
            {x:800, y:250, t:2, p:uEnd}
        ]
    },

    // LEVEL 2 (the first playable level)
    {
        sw:1000, sh:500, sx:500, sy:250, sz:1, lr:150, ld:0.90, l:[
            {x:200, y:250, s:1},
            {x:300, y:250, i:1},
            {x:400, y:250, i:1},
            {x:500, y:250, i:1},
            {x:600, y:250, i:1},
            {x:700, y:250, i:1},
            {x:800, y:250, s:1, i:0, t:2, p:uEnd}
        ]
    },

    // LEVEL 3
    {
        sw:1000, sh:1000, sx:500, sy:500, sz:1, lr:200, ld:0.90, lvli: function (s) {
                setTip("<p>&quot;A step in the wrong direction,<br/>is yet a step of discovery.&quot;<br/><em>&mdash; Anon.</em></p>", 3000);
            }, l:[{x:200,y:200,i:0,s:1},{x:268,y:326,i:1,s:0},{x:359,y:582,i:1,s:0},{x:288,y:473,i:1,s:0},{x:338,y:181,i:1,s:0},{x:491,y:173,i:1,s:0},{x:759,y:430,i:1,s:0},{x:631,y:187,i:1,s:0},{x:782,y:545,i:1,s:0},{x:746,y:294,i:1,s:0},{x:788,y:680,i:1,s:0},
            {x:800, y:800, s:1, i:0, t:2, p:uEnd}
        ]
    },

    // LEVEL 4
    {
        sw:1000, sh:1000, sx:500, sy:500, sz:1, lr:200, ld:0.90, lvli: function (s) {
                setTip("<p>&quot;Jump aboard! We're headed for the moon!&quot;<br/><em>&mdash; Bob.</em></p>", 3000);
            }, l:[
            {x:200,y:200,i:0,s:1},
            {x:400,y:200,i:1,s:0, t:1, p:uHBounce(50, 500)},
            {x:580,y:200,i:1,s:0},
            {x:668,y:297,i:1,s:0},
            {x:677,y:556,i:1,s:0},
            {x:742,y:688,i:1,s:0},
            {x:673,y:418,i:1,s:0},
            {x:800, y:800, s:1, i:0, t:2, p:uEnd}
        ]
    },

    // LEVEL 5
    {
        sw:1000, sh:1700, sx:500, sy:625, sz:1, lr:200, ld:0.90, lvli: function (s) {
                setTip("<p>&quot;What goes around, comes around.&quot;<br/><em>&mdash; Anon.</em></p>", 3000);
            }, l:[
            {x:500,y:500,i:0,s:1},
            {x:500,y:500,i:1,s:1, t:1, p:uCircle(125, 25)},
            {x:500,y:750,i:1,s:0},
            {x:500,y:1000,i:1,s:0, t:1, p:uCircle(125, -25)},
            {x:500,y:1250,i:1,s:0},
            {x:500,y:1400,i:0,s:1,t:2,p:uEnd}
        ]
    },

    // LEVEL 6
    {
        sw:600, sh:600, sx:100, sy:100, sz:1, lr:100, ld:0.80, lvli: function (s) {
                setTip("<p>&quot;Sometimes, there's not a lot of light to go around.&quot;<br/><em>&mdash; The Deity of Light</em></p>", 3000);
            }, l:[
                {x:100,y:100,i:0,s:1},
                {x:385,y:270,i:1,s:0},
                {x:160,y:120,i:1,s:0},
                {x:225,y:140,i:1,s:0},
                {x:285,y:160,i:1,s:0},
                {x:130,y:240,i:1,s:0},
                {x:115,y:160,i:1,s:0},
                {x:346,y:188,i:1,s:0},
                {x:400,y:365,i:1,s:0},
                {x:429,y:452,i:1,s:0},
                {x:500,y:500,s:1,i:0,t:2,p:uEnd}
        ]
    },

    // LEVEL 7
    {
        sw:2000, sh:2000, sx:700, sy:1000, sz:1, lr:200, ld:0.90, lvli: function (s) {
                setTip("<p>&quot;A journey of a thousand miles<br/>begins with a single step.&quot;<br/><em>&mdash; Laozi</em></p>", 3000);
            }, l:[
                {x:700,y:1000,i:1,s:1},{x:702,y:867,i:1,s:0},{x:702,y:750,i:1,s:0},{x:701,y:640,i:1,s:0},{x:700,y:530,i:1,s:0},{x:475,y:530,i:1,s:0},{x:925,y:530,i:1,s:0},
                {x:475,y:640,i:1,s:0},
                {x:475,y:750,i:1,s:0},
                {x:475,y:867,i:1,s:0},
                {x:475,y:1000,i:1,s:0},
                {x:475,y:1150,i:1,s:0},
                {x:700,y:1300,i:1,s:0,t:1,p:uHBounce(225, 1000)},
                {x:1050,y:1300,i:1,s:0,t:1,p:uHBounce(-225, 1000)},
                {x:1450,y:1300,i:1,s:0},
                {x:1450,y:1150,i:1,s:0},
                {x:1450,y:1000,i:1,s:0},
                {x:1225,y:1000,i:1,s:0,t:1,p:uHBounce(125, 750)},
                {x:699,y:389,i:1,s:0,t:1,p:uHBounce(225, 1000)},
                {x:1000,y:1000,s:1,i:0,t:2,p:uEnd}
        ]
    },

    // LEVEL 8
    {
        sw:800, sh:800, sx:400, sy:400, sz:1, lr:130, ld:0.90, lvli: function (s) {
                setTip("<p>&quot;Extinguish the light to see more clearly.&quot;<br/><em>&mdash; The Dungeon Master</em></p>", 3000);
            }, l:[
                {x:200,y:200,i:1,s:1,t:0},
                {x:300,y:200,i:1,s:1,t:0},
                {x:400,y:200,i:1,s:1,t:0},
                {x:500,y:200,i:1,s:1,t:0},
                {x:600,y:200,i:1,s:1,t:0},

                {x:200,y:300,i:1,s:1,t:0},
                {x:300,y:300,i:1,s:1,t:0},
                {x:400,y:300,i:1,s:1,t:0},
                {x:500,y:300,i:1,s:1,t:0},
                {x:600,y:300,i:1,s:1,t:0},
                
                {x:200,y:400,i:1,s:1,t:0},
                {x:300,y:400,i:1,s:1,t:0},
                {x:400,y:400,i:1,s:1,t:0},
                {x:500,y:400,i:1,s:1,t:0},
                {x:600,y:400,i:1,s:1,t:0},
                
                {x:200,y:500,i:1,s:1,t:0},
                {x:300,y:500,i:1,s:1,t:0},
                {x:400,y:500,i:1,s:1,t:0},
                {x:500,y:500,i:1,s:1,t:0},
                {x:600,y:500,i:1,s:1,t:0},
                
                {x:200,y:600,i:1,s:1,t:0},
                {x:300,y:600,i:1,s:1,t:0},
                {x:400,y:600,i:1,s:1,t:0},
                {x:500,y:600,i:1,s:1,t:0},
                {x:600,y:600,i:1,s:1,t:0},

                {x:250,y:450,s:0,i:0,t:2,p:uEnd}
        ]
    }
];
