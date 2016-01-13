/**
 * Created by eli on 07.01.16.
 */


$(document).ready(function(){
    run();

    createStyle();
});

function run(){
    world.turn();
    //$('#world-plan').text(world.toString());

    drowWorld();
    //console.log(world.grid.getAllCritters());

    setTimeout(function(){
        run();
    }, 300);
}

function drowWorld() {
    $('#world-div').parent().remove();

    var $wrldwrp = $('<div class="container-fluid"></div>');
    var $wrldmap = $('<div id="world-div"></div>');

    var grid = world.grid;

    $wrldmap.css({width: grid.width * 15 + 'px', margin: 'auto'})

    for(var i=0; i<grid.space.length; i++) {
        if (i>0 && (i%grid.width) == 0)
            $wrldmap.append('<div class="clearfix"></div>');

        var q = $('<div class="cell"></div>');
        q.addClass(getClassByProto(grid.space[i]));
        $wrldmap.append(q);
    }

    $wrldwrp.append($wrldmap);
    $('body').append($wrldwrp);
}

function getClassByProto(obj) {
    if (!obj)
        return '';

    var proto = Object.getPrototypeOf(obj);
    var arr = [Wall.prototype, WallFollower.prototype, Plant.prototype, PlantEater.prototype, SmartPlantEater.prototype];
    var cls = [
        'glyphicon glyphicon-th-large',
        'glyphicon glyphicon-info-sign',
        'glyphicon glyphicon-leaf',
        'glyphicon glyphicon-fire',
        'glyphicon glyphicon-eye-open',
    ];
    var ind = arr.indexOf(proto);
    if ( ind>=0 )
        return cls[ind];

    return 'unknown';
}

function createStyle(){
    $('head').append('<style>\
    .cell {\
        display: inline-block;\
        width: 15px;\
        height: 15px;\
    }\
    </style>');
}