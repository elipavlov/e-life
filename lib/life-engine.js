/**
 * Created by eli on 07.01.16.
 */

function Vector(x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype.plus = function(other) {
    return new Vector(this.x + other.x, this.y + other.y);
};

/**
 * @param width
 * @param height
 * @constructor Grid
 */
function Grid(width, height) {
    this.space = new Array(width * height);
    this.width = width;
    this.height = height;
}
Grid.prototype.isInside = function(vector) {
    return vector.x >= 0 && vector.x < this.width &&
        vector.y >= 0 && vector.y < this.height;
};
Grid.prototype.get = function(vector) {
    return this.space[vector.x + this.width * vector.y];
};
Grid.prototype.set = function(vector, value) {
    this.space[vector.x + this.width * vector.y] = value;
};
Grid.prototype.toString = function() {
    var res = '', i = 0;
    this.space.forEach(function(cell){
        if (!cell)
            res += ' ';
        else
            res += charFromElement(cell);

        if (0 == ((i+1)%this.width))
            res += '\n';

        i++;
    }.bind(this));

    return res;
};
Grid.prototype.forEach = function(f, context) {
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            var value = this.space[x + y * this.width];
            if (value != null)
                f.call(context, value, new Vector(x, y));
        }
    }
};
Grid.prototype.getAllCritters = function(critters) {
    var res = [];

    var wallch = legends.findCharByType(Wall);
    if (critters.length>0) {
        var crprots = critters.map(function (cr) {
            if (cr.name) {
                return cr.name;
            }
        });

        this.forEach(function (el) {
            if (el && el.originChar!=wallch && el.constructor.name && crprots.indexOf(el.constructor.name ) >= 0) {
                res.push(el);
            }
        });
    }else
        this.forEach(function(el){
            if (el && el.originChar != wallch) {
                res.push(el);
            }
        });

    return res;
};

/**
 *
 * @param map
 * @param legends
 * @constructor
 */
function World(map, legends) {
    this.map = map;
    this.legends = legends;
    this.lastShowStats = new Date();
    this.reload();
}

World.prototype.reload = function() {
    var grid = new Grid(this.map[0].length, this.map.length);
    this.grid = grid;
    this.map.forEach(function(line, y) {
        for (var x = 0; x < line.length; x++)
            grid.set(new Vector(x, y),
                elementFromChar(legends, line[x]));
    });

    this.lastReload = new Date();
    console.log('reload %s', this.lastReload);
};

World.prototype.toString = function print() {
    return this.grid.toString();
};

World.prototype.turn = function() {
    var acted = [];
    this.grid.forEach(function(critter, vector) {
        if (critter.act && acted.indexOf(critter) == -1) {
            acted.push(critter);
            this.letAct2(critter, vector);
        }
    }, this);

    if (this.lastReload && ((new Date()) - this.lastReload) > 5000 ) {
        var plants = this.grid.getAllCritters([Plant]);
        var plantEaters = this.grid.getAllCritters([PlantEater]);
        var splantEaters = this.grid.getAllCritters([SmartPlantEater]);

        if (((new Date()) - this.lastShowStats) > 10000) {
            console.log(splantEaters.length, splantEaters);
            this.lastShowStats = new Date();
        }

        if (plants.length == 0) {
            // TODO: create new plants randomly;
        }

        if (plantEaters.length == 0 && splantEaters.length == 0) {
            this.reload();
        }
    }
};

World.prototype.letAct = function(critter, vector) {
    var action = critter.act(new View(this, vector));
    if (action && action.type == "move") {
        var dest = this.checkDestination(action, vector);
        if (dest && this.grid.get(dest) == null) {
            this.grid.set(vector, null);
            this.grid.set(dest, critter);
        }
    }
};

World.prototype.letAct2 = function(critter, vector) {
    var action = critter.act(new View(this, vector));
    var handled = action &&
        action.type in actionTypes &&
        actionTypes[action.type].call(this, critter, vector, action);

    if (!handled) {
        critter.energy -= 0.2;
        if (critter.energy <= 0)
            this.grid.set(vector, null);
    }
};

World.prototype.checkDestination = function(action, vector) {
    if (directions.hasOwnProperty(action.direction)) {
        var dest = vector.plus(directions[action.direction]);
        if (this.grid.isInside(dest))
            return dest;
    }
};

/**
 * @type {{n: Vector, ne: Vector, e: Vector, se: Vector, s: Vector, sw: Vector, w: Vector, nw: Vector}}
 */
var directions = {
    "n":  new Vector( 0, -1),
    "ne": new Vector( 1, -1),
    "e":  new Vector( 1,  0),
    "se": new Vector( 1,  1),
    "s":  new Vector( 0,  1),
    "sw": new Vector(-1,  1),
    "w":  new Vector(-1,  0),
    "nw": new Vector(-1, -1)
};

function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function BouncingCritter() {
    this.direction = randomElement(Object.keys(directions));
};

BouncingCritter.prototype.act = function(view) {
    if (view.look(this.direction) != " ")
        this.direction = view.find(" ") || "s";

    return {type: "move", direction: this.direction};
};


function Wall() {}


/**
 * @desc descript View
 */

function View(world, vector) {
    this.world = world;
    this.vector = vector;
}
View.prototype.look = function(dir) {
    var target = this.vector.plus(directions[dir]);
    if (this.world.grid.isInside(target))
        return charFromElement(this.world.grid.get(target));
    else
        return "#";
};
View.prototype.findAll = function(ch) {
    var found = [];
    for (var dir in directions)
        if (this.look(dir) == ch)
            found.push(dir);
    return found;
};
View.prototype.find = function(ch) {
    var found = this.findAll(ch);
    if (found.length == 0) return null;
    return randomElement(found);
};

/**
 * @desc description World
 */

/**
 *
 *
 * @param legend
 * @param ch
 * @returns {null}
 */
function elementFromChar(legends, ch) {
    if (ch == " ")
        return null;
    var element = new legends[ch]();
    element.originChar = ch;
    return element;
}
function charFromElement(element) {
    if (element == null)
        return " ";
    else
        return element.originChar;
}

function createMap(width,height) {
    var plan = [
        "###############################################",
        "#         *                                  ##",
        "#     xxxx                                    #",
        "#     xxxx       #####                        #",
        "##               #####            ##x         #",
        "###                               x#x         #",
        "#                 ###             x#x        u#",
        "#      s          xxx                         #",
        "#                                             #",
        "#         ##x                  s              #",
        "#         ##x                                 #",
        "#          #x                        ###      #",
        "#          #x                        xxx      #",
        "#                                             #",
        "#             *       ###            xx       #",
        "#       xx            ###            xxxx     #",
        "#       xx            xxx                *    #",
        "#   *   xx                             xx     #",
        "#                        u             xx     #",
        "###############################################"];

    return plan;
}



var directionNames = Object.keys(directions);

function dirPlus(dir, n) {
    var index = directionNames.indexOf(dir);
    return directionNames[(index + n + 8) % 8];
}

function WallFollower() {
    this.dir = "s";
}

WallFollower.prototype.act = function(view) {
    var start = this.dir;
    if (view.look(dirPlus(this.dir, -3)) != " ")
        start = this.dir = dirPlus(this.dir, -2);
    while (view.look(this.dir) != " ") {
        this.dir = dirPlus(this.dir, 1);
        if (this.dir == start) break;
    }
    return {type: "move", direction: this.dir};
};

function Plant() {
    this.energy = 3 + Math.random() * 4;
}
Plant.prototype.act = function(context) {
    if (this.energy > 15) {
        var space = context.find(" ");
        if (space)
            return {type: "reproduce", direction: space};
    }
    if (this.energy < 20)
        return {type: "grow"};
};


function PlantEater() {
    this.energy = 20;
}
PlantEater.prototype.act = function(context) {
    var space = context.find(" ");
    if (this.energy > 60 && space)
        return {type: "reproduce", direction: space};
    var plant = context.find(legends.findCharByType(Plant));
    if (plant)
        return {type: "eat", direction: plant};
    if (space)
        return {type: "move", direction: space};
};

function SmartPlantEater() {
    this.location = new Vector(0,0);
    this.map = [];
    this.lastDir = 's';
    this.lastDirCount = 0;
    PlantEater.call(this);
}
//SmartPlantEater.prototype = Object.create(PlantEater.prototype);

SmartPlantEater.prototype.act = function(context) {
    var avSpaces = context.findAll(" ");
    var avPlants = context.findAll(legends.findCharByType(Plant));

    if (this.energy > 80 && avSpaces.length>0) {
        var unknowns = this.getKnownDirs(avSpaces);
        if (unknowns.length>0)
            var dir = unknowns[Math.floor(Math.random() * unknowns.length)];
        else
            var dir = avSpaces[Math.floor(Math.random() * avSpaces.length)];

        this.rememberDir(dir, SmartPlantEater);
        return {type: "reproduce", direction: dir};
    }
    if (avPlants.length>0) {
        var dir = avPlants[Math.floor(Math.random()*avPlants.length)];
        var npos = new Vector(this.location.x,this.location.y);

        this.rememberDir(npos, Plant);
        this.addLastDir(dir, true);
        return {type: "eat", direction: dir};
    } else {
        if (avSpaces.length>0) {
            if (this.map.length == 0) {
                var dir = avSpaces[Math.floor(Math.random() * avSpaces.length)];
                this.location = this.location.plus(directions[dir]);

                this.rememberDir(this.location, null);
                this.addLastDir(dir, true);
                return {type: "move", direction: dir};
            } else {
                var unknowns = this.getUnknownDirs(avSpaces);
                if (unknowns.length>0) {
                    if (unknowns.indexOf(this.lastDir)>=0 && this.canUseLastDir()) {
                        var dir = this.lastDir;
                        this.addLastDir(dir);
                    } else {
                        var dir = unknowns[Math.floor(Math.random() * unknowns.length)];
                        this.addLastDir(dir, true);
                    }
                } else {
                    if (avSpaces.indexOf(this.lastDir)>=0 && this.canUseLastDir()) {
                        var dir = this.lastDir;
                        this.addLastDir(dir);
                    } else {
                        var dir = avSpaces[Math.floor(Math.random() * avSpaces.length)];
                        this.addLastDir(dir, true);
                    }
                }

                this.location = this.location.plus(directions[dir]);
                this.rememberDir(this.location, null);
                return {type: "move", direction: dir};
            }
        }

        return null;
    }
};
SmartPlantEater.prototype.canUseLastDir = function() {
    return this.lastDirCount<6;
}
SmartPlantEater.prototype.addLastDir = function(dir, drop) {
    if (drop === true)
        this.lastDirCount = 0;
    if (this.lastDir == dir)
        this.lastDirCount++;
    else {
        this.lastDirCount = 1;
        this.lastDir = dir;
    }

};
SmartPlantEater.prototype.rememberDir = function(ndir, type) {
    if (this.map.length == 0) {
        this.map[0] = [];
        this.map[0][0] = null;
    }
    if (this.checkDirIsUnknown(ndir)) {
        this.map[ndir.x] = [];
    }
    this.map[ndir.x][ndir.y] = type;
};
SmartPlantEater.prototype.getUnknownDirs = function(avSpaces) {
    var dirs = avSpaces.filter(function(space){
        var newd = new Vector(this.location.x, this.location.y);
        newd = newd.plus(directions[space]);
        if (this.checkDirIsUnknown(newd)) {
            return space;
        }
    }, this);
    return dirs;
};
SmartPlantEater.prototype.getKnownDirs = function(avSpaces) {
    var dirs = avSpaces.filter(function(space){
        var newd = new Vector(this.location.x, this.location.y);
        newd = newd.plus(directions[space]);
        if (!this.checkDirIsUnknown(newd)) {
            return space;
        }
    }, this);
    return dirs;
};
SmartPlantEater.prototype.checkDirIsUnknown = function(vector) {
    if (this.map[vector.x] == undefined || this.map[vector.x][vector.y] === undefined) {
        return true;
    }
    return false;
};


var actionTypes = Object.create(null);
actionTypes.grow = function(critter) {
    critter.energy += 0.5;
    return true;
};
actionTypes.move = function(critter, vector, action) {
    var dest = this.checkDestination(action, vector);
    if (dest == null ||
        critter.energy <= 1 ||
        this.grid.get(dest) != null)
        return false;
    critter.energy -= 1;
    this.grid.set(vector, null);
    this.grid.set(dest, critter);
    return true;
};
actionTypes.eat = function(critter, vector, action) {
    var dest = this.checkDestination(action, vector);
    var atDest = dest != null && this.grid.get(dest);
    if (!atDest || atDest.energy == null)
        return false;
    critter.energy += atDest.energy;
    this.grid.set(dest, null);
    return true;
};
actionTypes.reproduce = function(critter, vector, action) {
    var baby = elementFromChar(this.legends, critter.originChar);
    var dest = this.checkDestination(action, vector);
    if (dest == null ||
        critter.energy <= 2 * baby.energy ||
        this.grid.get(dest) != null)
        return false;
    critter.energy -= 2 * baby.energy;
    this.grid.set(dest, baby);
    return true;
};

var legends = {
    "#": Wall,
    "o": BouncingCritter,
    "u": WallFollower,
    "x": Plant,
    "*": PlantEater,
    "s": SmartPlantEater
};
legends.findCharByType = function(type){
    var res = ' ';
    Object.keys(this).forEach(function(key) {
        if (this[key].prototype && type.prototype && this[key].prototype == type.prototype) {
            res = key;
            return false;
        }

    }, this);

    return res;
};
var world = new World(createMap(), legends);

//module.exports = new World();