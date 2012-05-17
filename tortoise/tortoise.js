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
        this.stroke_width = 4;
        this.stroke_color = "#f00";

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

        var x1 = this.x, y1 = this.y, params = { 'stroke-width': this.stroke_width, 'stroke': this.stroke_color },
            path = this.paper.path(Raphael.format("M{0},{1}L{2},{3}", x1, y1, x, y)).attr(params);
    },

    forward: function (d) {
        "use strict";

        var newx = this.x + Math.cos(Raphael.rad(this.angle)) * d,
            newy = this.y - Math.sin(Raphael.rad(this.angle)) * d;

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
        log: log_console
    };

    return { bindings: {}, outer: env };
}