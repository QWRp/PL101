function Turtle(paper, width, height) {
    "use strict";

    this.paper = paper;
    this.originx = width / 2;
    this.originy = height / 2;
    this.clear();
}

function clone_object(obj) {
    "use strict";

    var target = {}, i;
    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            target[i] = obj[i];
        }
    }
    return target;
}

Turtle.prototype = {
    clear: function () {
        "use strict";

        this.state = {
            x : this.originx,
            y : this.originy,
            angle : 90,
            scale : 1,
            pen : true,
            stroke : {
                'stroke-width' : 4,
                'stroke' : "#f00",
                'stroke-opacity' : 1.0,
                'stroke-linecap' : 'round',
                'stroke-linejoin' : 'round'
            }
        };

        this.states_stack = [];

        this.turtleimg = this.paper.image(
            "http://nathansuniversity.com/gfx/turtle2.png",
            0, 0, 64, 64
        );

        this.updateTurtle();
    },

    updateTurtle: function () {
        "use strict";

        this.turtleimg.attr({
            x: this.state.x - 32,
            y: this.state.y - 32,
            transform: "r" + (-this.state.angle)
        });
        this.turtleimg.toFront();
    },

    drawTo: function (x, y) {
        "use strict";

        var x1 = this.state.x, y1 = this.state.y,
            path = this.paper.path(Raphael.format("M{0},{1}L{2},{3}", x1, y1, x, y)).attr(this.state.stroke);
    },

    forward: function (d) {
        "use strict";

        var newx = this.state.x + Math.cos(Raphael.rad(this.state.angle)) * d * this.state.scale,
            newy = this.state.y - Math.sin(Raphael.rad(this.state.angle)) * d * this.state.scale;

        if (this.state.pen) {
            this.drawTo(newx, newy);
        }

        this.state.x = newx;
        this.state.y = newy;
        this.updateTurtle();
    },

    set_position: function (x, y) {
        "use strict";

        this.state.x = x;
        this.state.y = y;

        this.updateTurtle();
    },

    right: function (ang) {
        "use strict";

        this.state.angle -= ang;
        this.updateTurtle();
    },

    set_heading: function(heading) {
        "use strict";

        this.state.angle = 90 - heading;
        this.updateTurtle();
    },

    push_state : function () {
        this.states_stack.push(clone_object(this.state));
    },

    pop_state : function () {
        this.state = this.states_stack.pop();
    },

    spawn_turtle : function () {
        return new Turtle(this.paper, this.originx * 2, this.originy * 2);
    }
};

function bind_math(env) {
    "use strict";

    var math_functions = ['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan'],
        math_constants = ['E', 'PI', 'SQRT2', 'SQRT1_2'], i, fn;

    for (i = 0; i < math_constants.length; i++) {
        add_binding(env, math_constants[i], Math[math_constants[i]]);
    }
    for (i = 0; i < math_functions.length; i++) {
        fn = Math[math_functions[i]];
        fn.tortoise_length = fn.length;

        add_binding(env, math_functions[i], fn);
    }
}

function create_basic_environment(turtle, turtle_canvas_id) {
    "use strict";

    var env = { outer: null }, elem = $('#'+turtle_canvas_id);
    var default_turtle = turtle;

    env.bindings = {
        forward: function (d) { turtle.forward(d); },
        backward: function (d) { turtle.forward(-d); },
        left: function (d) { turtle.right(-d); },
        right: function (d) { turtle.right(d); },
        pen_up: function () { turtle.state.pen = false; },
        pen_down: function () { turtle.state.pen = true; },
        is_pen_down: function () { return turtle.state.pen; },
        set_pen_color: function (d) { turtle.state.stroke.stroke = d; },
        get_pen_color: function () { return turtle.state.stroke.color; },
        set_pen_width: function (d) { turtle.state.stroke['stroke-width'] = d; },
        get_pen_width: function () { return turtle.state.stroke['stroke-width']; },
        set_pen_opacity: function (d) { turtle.state.stroke['stroke-opacity'] = d; },
        get_pen_opacity: function () { return turtle.state.stroke['stroke-opacity']; },
        get_paper_color: function () { return rgb2hex(elem.css('background-color')); },
        set_paper_color: function (d) { elem.css('background-color', d); },
        push: function () { turtle.push_state(); },
        pop: function () { turtle.pop_state(); },
        scale: function (d) { turtle.state.scale *= d; },
        get_scale: function () { return turtle.state.scale; },
        clear: function () {
            turtle.paper.clear();
            this.set_paper_color('#ffffff');
            turtle.clear();
        },
        spawn_turtle: function () {
            var t =  turtle.spawn_turtle();
            env.bindings.select_turtle(t);
            return t;
        },
        select_turtle: function (t) {
            if (!(t instanceof Turtle)) {
                throw "Function 'select_turtle' expects turtle variable!";
            }
            turtle = t;
        },
        home: function () { turtle.set_position(turtle.originx, turtle.originy); },
        set_heading: function (d) { turtle.set_heading(d); },
        get_heading: function () { return 90 - turtle.state.angle; },
        set_position: function (x, y) { turtle.set_position(x, y); },
        get_position_x: function () { return turtle.state.x; },
        get_position_y: function () { return turtle.state.y; },
        current_turtle: turtle,
        default_turtle: default_turtle,
        log_console: log_console || console.log
    };

    bind_math(env);

    return { bindings: {}, outer: env };
}

//From http://stackoverflow.com/questions/1740700/get-hex-value-rather-than-rgb-value-using-jquery
var hexDigits = new Array
    ("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f");

//Function to convert hex format to a rgb color
function rgb2hex(rgb) {
    if (rgb[0] === '#') {
        return rgb;
    }
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}


function hex(x) {
    return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}