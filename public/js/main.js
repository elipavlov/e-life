/**
 * Created by eli on 07.01.16.
 */


$(document).ready(function(){
    run();
});

function run(){
    world.turn();
    $('#world-plan').text(world.toString());

    //console.log(world.grid.getAllCritters());

    setTimeout(function(){
        run();
    }, 300);
}