// some debugging function
let show_runtime = false;

function run_function_and_measure_runtime(func,name)
{
    let t0 = performance.now();

    func();

    let t1 = performance.now();

    if (show_runtime)
        console.log("function " + name +" needed " + (t1-t0)+ " milliseconds");
    
}

// nicer display on retina
function retina(canv,cont,w,h)
{
  if (window.devicePixelRatio){
      canv
          .attr('width', w * window.devicePixelRatio)
          .attr('height', h * window.devicePixelRatio)
          .style('width', w + 'px')
          .style('height', h + 'px');

      cont.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
}

function histogram(sizes)
{
    let hist = {};
    sizes.forEach(function(s){
        if (!hist.hasOwnProperty(s))
            hist[s] = 1;
        else
            hist[s]++;
    });
    let x = [];
    let y = [];
    Reflect.ownKeys(hist).forEach(function(key){
        x.push(+key);
        y.push(+hist[key]);
    });
    return { 'x': x, 'y': y };
}


// explorable definitions
//
var use_growing_occupation = true;
var sites = [];               // one-dimensional array containing all sites (1 if occupied, 0 if not)
var clusters = [];            // for each site, contains the id of the cluster it belongs to (-1 if None)
let nnz_positions = [];       // save (x,y)-coordinates of occupied sites
let pixel_width = 2;          // width of one site in pixels 
let size_of_cluster = [];     // list mapping cluster-id to its size
let cluster_coordinates = []; // list mapping cluster-id to a list of its occupying sites' coordinates 
let cluster_ids;
let cluster_sizes;
let cluster_has_top_site = [];
let cluster_has_bottom_site = [];

 
let p = 0.59274,               // occupation probability 
    sidelength = 240;           // how many sites per side of the square
var color_behavior = "color_all";

let N = sidelength*sidelength; // total number of sites
let n_clusters = 0;            // current number of clusters
let color = d3.scaleOrdinal(d3.schemeDark2); // colorscheme

var width = sidelength*pixel_width,   // canvas width
    height = sidelength*pixel_width;  // canvas height
var plot_width = width/2, plot_height=width/2;
var canvas = d3.select('#percolation_container')
               .append('canvas')
               .attr('width', width)
               .attr('height', height);

var ctx = canvas.node().getContext('2d');
var transform = d3.zoomIdentity;

var all_indices = d3.shuffle(d3.range(N));
retina(canvas,ctx,width,height);

// ================= plot canvases ============

var largest_component_canvas = d3.select('#largest_component_container')
  .append('canvas')
  .attr('width', plot_width)
  .attr('height', plot_height);

var largest_component_ctx = largest_component_canvas.node().getContext('2d');
retina(largest_component_canvas,largest_component_ctx,plot_width,plot_height);
var lc_pl = new simplePlot(largest_component_ctx,plot_width,plot_height,{margin:30,fontsize:12});
//lc_pl.xlabel('occupation probability');
lc_pl.ylabel('largest component size');
lc_pl.xlimlabels(['0','1']);
lc_pl.ylimlabels(['0','N']);
lc_pl.xlim([0,1]);
lc_pl.ylim([0,N]);
var lc_x = [];
var lc_y = [];

var variance_canvas = d3.select('#variance_container')
  .append('canvas')
  .attr('width', plot_width)
  .attr('height', plot_height);

var variance_ctx = variance_canvas.node().getContext('2d');
retina(variance_canvas, variance_ctx,plot_width,plot_height)
var var_pl = new simplePlot(variance_ctx,plot_width,plot_height,{margin:30,fontsize:12});
var_pl.ylabel('mean non-largest comp. size');
var_pl.xlabel('occupation probability');
var_pl.xlimlabels(['0','1']);
var_pl.ylimlabels(['0','20']);
var_pl.xlim([0,1]);
var_pl.ylim([0,20]);
var var_x = [];
var var_y = [];


var hist_canvas = d3.select('#histogram_container')
  .append('canvas')
  .attr('width', plot_width)
  .attr('height', plot_height);

var hist_ctx = hist_canvas.node().getContext('2d');
retina(hist_canvas, hist_ctx,plot_width,plot_height);
var h_pl = new simplePlot(hist_ctx,plot_width,plot_height,{margin:30,fontsize:12});
h_pl.xlabel('non-largest comp. size');
h_pl.ylabel('count');
h_pl.xscale('log');
h_pl.yscale('log');
//h_pl.xlimlabels(['0','log10(N)']);
//h_pl.ylimlabels(['0','(1/2)log10(N)']);
//h_pl.rangeX([0,log10(N)]);
//h_pl.rangeY([0,Math.sqrt(N)]);
var h_x = [];
var h_y = [];

// ============== percolation functions ===============
//
//
function init_for_growing_occupation() {
  all_indices = d3.shuffle(d3.range(N));
}

function create_a_new_one() {
    transform = d3.zoomIdentity;
    run_function_and_measure_runtime(init,"init");
    run_function_and_measure_runtime(update,"update");
    run_function_and_measure_runtime(analyze_cluster,"analyze_cluster");
    run_function_and_measure_runtime(draw,"draw");
    // plot
    plot_largest_component();
    plot_component_variance();
    plot_component_histogram();
}

function initialize_percolation_canvas() {
    canvas
        //.call(d3.drag().subject(dragsubject).on("drag", dragged))
        .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed))
        .call(draw);
}

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
            if (y == 0)
              cluster_has_top_site[this_cluster] = true;
            else if (y == sidelength-1)
              cluster_has_bottom_site[this_cluster] = true;

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
            size_of_cluster.push(0);
            cluster_has_top_site.push(false);
            cluster_has_bottom_site.push(false);
            fill4(x,y,this_cluster);
            n_clusters++;
        }

    });

}

function analyze_cluster() {

    // sort cluster ids such that the largest has id 0
    cluster_ids = d3.range(cluster_coordinates.length);
    cluster_sizes = cluster_coordinates.map(arr => arr.length);
    cluster_ids.sort(function(a, b) {
        return cluster_sizes[b]-cluster_sizes[a];
    });


    // save x/y values of largest component for plot
    if (!( typeof cluster_sizes[cluster_ids[0]] === 'undefined' || cluster_sizes[cluster_ids[0]] === null )){
        lc_x.push(p);
        lc_y.push(cluster_sizes[cluster_ids[0]]);
        var_x.push(p);
        if (cluster_sizes.length<2)
            var_y.push(0);
        else
            var_y.push(d3.mean(cluster_sizes)-cluster_sizes[cluster_ids[0]]/cluster_sizes.length);

        let hist = histogram(cluster_sizes);
        h_x = hist.x;
        h_y = hist.y;
    }
}

function draw() {
    ctx.save();

    // delete all that was drawn
    let bg_val = 0;
    ctx.fillStyle = "rgb("+bg_val+","+bg_val+","+bg_val+")";
    ctx.fillRect( 0, 0, width, height );
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    let site_val = 255 - bg_val;
    ctx.fillStyle = "rgb("+site_val+","+site_val+","+site_val+")";


    // draw the sites according to their clusters
    for(let i = 0; i < cluster_coordinates.length; i++)
    {
        if (   
               (
                  (color_behavior == "color_largest") && ( i == 0)
               )
             ||
               (color_behavior == "color_all")
             ||
               (
                  (color_behavior == "color_spanning") && 
                  cluster_has_top_site[cluster_ids[i]] &&
                  cluster_has_bottom_site[cluster_ids[i]]
               )
             )
            ctx.fillStyle = color(i);
      /*
        else if ( 
                   ((color_behavior == "color_largest") && ( i > 0))
                 || 
                   ((color_behavior == "color_spanning") && ( i > 0))
                )
                */
         else
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

function coords(i){
    return [ Math.floor(i/sidelength), i%sidelength ];
}

function init(){
    cluster_has_top_site.length = 0;
    cluster_has_bottom_site.length = 0;
    sites.length = 0;
    clusters.length = 0;
    nnz_positions.length = 0;
    cluster_coordinates.length = 0;
    size_of_cluster.length = 0;
    n_clusters = 0;
    if (use_growing_occupation)
    {
        sites = d3.range(N).map(i => 0);
        clusters = d3.range(N).map(i => -1);

        let this_slice = all_indices.slice(0,Math.floor(p*N));

        this_slice.forEach(i => sites[i] = 1 );

        // get indices
        nnz_positions = this_slice.map(coords);
    }
    else
    {
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
}

// ================= plot functions ===========

function plot_largest_component()
{
    lc_pl.scatter('lc',lc_x,lc_y,{marker:'o',markercolor:'rgba(27,158,119,1.0)',markerradius:2});
    lc_pl.plot('probability_marker',[p,p],[0,N],{linecolor:'rgba(102,102,102,1.0)'});

}

function plot_component_variance()
{
    var_pl.scatter('var',var_x,var_y,{marker:'o',markercolor:'rgba(217,95,2,1.0)',markerradius:2});
    var_pl.plot('probability_marker',[p,p],[0,20],{linecolor:'rgba(102,102,102,1.0)'});

}
function plot_component_histogram()
{
  
    let _h_x = h_x.map(tmp => tmp);
    let _h_y = h_y.map(tmp => tmp);
    let ndx = h_x.indexOf(d3.max(h_x));
    _h_y.pop(ndx);
    _h_x.pop(ndx);
    //let max_x = [ d3.max(h_x) ];
    //let max_y = [ h_y[h_x.indexOf(max_x[0])] ];
    if (h_pl.xscale() == "lin")
      h_pl.xlim(d3.extent(_h_x));

    if (h_pl.yscale() == "lin")
      h_pl.ylim(d3.extent(_h_y));

    h_pl.scatter('hist',_h_x,_h_y,{marker:'s',markercolor:'rgba(102,102,102,1.0)',markerradius:4});

    //h_pl.scatter('max',max_x,max_y,{marker:'s',markercolor:'rgba(27,158,119,1.0)',markerradius:4});

}
