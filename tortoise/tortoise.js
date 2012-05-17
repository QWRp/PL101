function Turtle(id) {
    "use strict";

    var elem = $('#' + id);

    this.paper = Raphael(id);
    this.originx = elem.width() / 2;
    this.originy = elem.height() / 2;
    this.clear();
}

Turtle.prototype = {
    clear: function () {
        "use strict";

        this.paper.clear();
        this.x = this.originx;
        this.y = this.originy;
        this.angle = 90;
        this.pen = true;

        this.stroke = {
            'stroke-width' : 4,
            'stroke' : "#f00",
            'stroke-opacity' : 1.0,
            'stroke-linecap' : 'round',
            'stroke-linejoin' : 'round'
        };

        this.states_stack = [];
        this.scale = 1;

        this.turtleimg = this.paper.image(
            "http://nathansuniversity.com/gfx/turtle2.png",
            0, 0, 64, 64
        );

        this.updateTurtle();
    },

    updateTurtle: function () {
        "use strict";

        this.turtleimg.attr({
            x: this.x - 32,
            y: this.y - 32,
            transform: "r" + (-this.angle)
        });
        this.turtleimg.toFront();
    },

    drawTo: function (x, y) {
        "use strict";

        var x1 = this.x, y1 = this.y,
            path = this.paper.path(Raphael.format("M{0},{1}L{2},{3}", x1, y1, x, y)).attr(this.stroke);
    },

    forward: function (d) {
        "use strict";

        var newx = this.x + Math.cos(Raphael.rad(this.angle)) * d * this.scale,
            newy = this.y - Math.sin(Raphael.rad(this.angle)) * d * this.scale;

        if (this.pen) {
            this.drawTo(newx, newy);
        }

        this.x = newx;
        this.y = newy;
        this.updateTurtle();
    },

    right: function (ang) {
        "use strict";

        this.angle -= ang;
        this.updateTurtle();
    },

    push_state : function () {
        this.states_stack.push({
            stroke: this.stroke,
            x : this.x,
            y: this.y,
            angle : this.angle,
            scale: this.scale,
            pen: this.pen
        });
    },

    pop_state : function () {
        var state = this.states_stack.pop();

        this.stroke = state.stroke;
        this.x = state.x;
        this.y = state.y;
        this.angle = state.angle;
        this.scale = state.scale;
        this.pen = state.pen;
    }
};

function create_basic_environment(turtle) {
    "use strict";

    var env = { outer: null };

    env.bindings = {
        forward: function (d) { turtle.forward(d); },
        backward: function (d) { turtle.forward(-d); },
        left: function (d) { turtle.right(-d); },
        right: function (d) { turtle.right(d); },
        penup: function () { turtle.pen = false; },
        pendown: function () { turtle.pen = true; },
        set_pen_color: function (d) { turtle.stroke.stroke = d; },
        set_pen_width: function (d) { turtle.stroke['stroke-width'] = d; },
        push: function () { turtle.push_state(); },
        pop: function () { turtle.pop_state(); },
        scale: function (d) { turtle.scale *= d; },
        log: log_console || console.log
    };

    return { bindings: {}, outer: env };
}