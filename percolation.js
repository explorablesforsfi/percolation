let show_runtime = false;
function run_function_and_measure_runtime(func,name)
{
    let t0 = performance.now();

    func();

    let t1 = performance.now();

    if (show_runtime)
        console.log("function " + name +" needed " + (t1-t0)+ " milliseconds");
    
}


var sites = [];
var clusters = [];
let nnz_positions = [];
let pixel_width = 2;
let size_of_cluster = {};
let use_color = true;

let cluster_coordinates = [];

let p = 0.59274,
    sidelength = 250;
p = 0.54; 

let N = sidelength*sidelength;
let n_clusters = 0;
let color = d3.scaleOrdinal(d3.schemeDark2);

var width = sidelength*pixel_width, 
    height = sidelength*pixel_width;
var canvas = d3.select('#container')
  .append('canvas')
  .attr('width', width)
  .attr('height', height);

var ctx = canvas.node().getContext('2d');
var transform = d3.zoomIdentity;




var main_timer;

var updates_per_frame = 15;


function create_a_new_one() {
    run_function_and_measure_runtime(init,"init");
    run_function_and_measure_runtime(update,"update");
    run_function_and_measure_runtime(draw,"draw");
}

canvas
    //.call(d3.drag().subject(dragsubject).on("drag", dragged))
    .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed))
    .call(draw);

function zoomed() {
  transform = d3.event.transform;
  draw();
}

function fill4(x_,y_,this_cluster) {
    let stack = [ [x_,y_] ];

    while (stack.length > 0)
    {
        let pos = stack.pop();
        let x = pos[0];
        let y = pos[1];
        if ((sites[index(x,y)] == 1) && clusters[index(x,y)] == -1)
        {
            cluster_coordinates[this_cluster].push([x,y]);
            clusters[index(x,y)] = this_cluster;
            size_of_cluster[this_cluster]++;

            if (y+1 < sidelength)
                stack.push([x,y+1]);
            if (y-1 >= 0)
                stack.push([x,y-1]);
            if (x+1 < sidelength)
                stack.push([x+1,y]);
            if (x-1 >= 0)
                stack.push([x-1,y]);
        }
    }
}


function update() {

    nnz_positions.forEach(function(pos) {
        let x = pos[0];
        let y = pos[1];
        let this_cluster = n_clusters;
        if (clusters[index(x,y)] < 0)
        {
            cluster_coordinates.push([]);
            size_of_cluster[this_cluster] = 0;
            fill4(x,y,this_cluster);
            n_clusters++;
        }

    });

}

function draw() {
    ctx.save();

    // delete all that was drawn
    let bg_val = 0;
    ctx.fillStyle = "rgb("+bg_val+","+bg_val+","+bg_val+")";
    ctx.fillRect( 0, 0, width, height );
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    let site_val = 255-bg_val;
    ctx.fillStyle = "rgb("+site_val+","+site_val+","+site_val+")";

    // sort cluster ids such that the largest has id 0
    let cluster_ids = d3.range(cluster_coordinates.length);
    let cluster_sizes = cluster_coordinates.map(arr => arr.length);
    cluster_ids.sort(function(a, b) {
        return cluster_sizes[b]-cluster_sizes[a];
    });
    //console.log("");
    //for(let cluster_id = 0; cluster_id < cluster_coordinates.length; cluster_id++)
    //{
    //    console.log(cluster_ids[cluster_id],cluster_sizes[cluster_ids[cluster_id]]);
    //}
    //
    let color_behavior = get_color_behavior();
    
    //let color_behavior = document.querySelector('input[name="color"]:checked').value

    for(let i = 0; i < cluster_coordinates.length; i++)
    {
        if (   (
                  (color_behavior == "color_largest") && ( i == 0)
               )
             ||
               (color_behavior == "color_all")
             )
            ctx.fillStyle = color(i);
        else if ( (color_behavior == "color_largest") && ( i > 0))
            ctx.fillStyle = "rgb("+site_val+","+site_val+","+site_val+")";

        cluster_coordinates[cluster_ids[i]].forEach(function(pos) {
            let x = pos[0];
            let y = pos[1];
            ctx.fillRect( x*pixel_width, y*pixel_width, pixel_width, pixel_width );
        });
    }

    ctx.restore();
}

function index(i,j){
    return i * sidelength + j;
}

function init(){
    sites.length = 0;
    clusters.length = 0;
    nnz_positions.length = 0;
    cluster_coordinates.length = 0;
    size_of_cluster = {};
    n_clusters = 0;
    for(let i=0; i<sidelength; i++)
    {
        for(let j=0; j<sidelength; j++)
        {
            if (Math.random() < p)
            {
                nnz_positions.push([i,j]);
                sites.push(1);
            }
            else
            {
                sites.push(0);
            }
            clusters.push(-1);
        }
    }
}
