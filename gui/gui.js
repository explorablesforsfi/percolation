
		var controlbox_width = width,
			controlbox_height = plot_height,
			n_grid_x = 24, // these two variables
			n_grid_y = 12; // are used for putting a grid on the controls panels
	

		// this is the svg for the controls
		
		var controls = d3.selectAll("#control_container").append("svg")
			.attr("width",controlbox_width)
			.attr("height",controlbox_height)
			.attr("class","explorable_widgets");
			//.style("border","1px solid black")


		// this defines a grid, only used for making it easier to place widgets
		// kind of a simple integer internal coordinate system
		
		var g = widget.grid(controlbox_width,controlbox_height,n_grid_x,n_grid_y);

		var anchors = g.lattice(); // g has a method that returns a lattice with x,y coordinates

		// here we draw the lattice (usually not done in production)
/*

		controls.selectAll(".grid").data(anchors).enter().append("circle")
			.attr("class","grid")
			.attr("transform",function(d){return "translate("+d.x+","+d.y+")"})
			.attr("r",1)
			.style("fill","black")
			.style("stroke","none")
*/

		///////////////////
		// buttons
		///////////////////

		// we first define the button parameters

		var b5 = { id:"b5", name:"a new one", actions: ["rewind"], value: 0};

		// values of these parameters are changed when the widget is activated

		// now we generate the button objects and put them into an array, the last button is modified a bit from its default values

		var buttons = [
			widget.button(b5).size(60).symbolSize(30).update(function(d){
        if (use_growing_occupation)
          init_for_growing_occupation();
        create_a_new_one();
      }),
		]
		// now we define a block in the control panel where the buttons should be placed

		var buttonbox = g.block({x0:2,y0:10,width:20,height:0}).Nx(buttons.length);

		// now we draw the buttons into their block

		controls.selectAll(".button").data(buttons).enter().append(widget.buttonElement)
			.attr("transform",function(d,i){return "translate("+buttonbox.x(i)+","+buttonbox.y(0)+")"});	


		///////////////////
		// toggles
		///////////////////

		// we first define the toggle parameters

		var t4 = {id:"t4", name: "generate new for each change",  value: !use_growing_occupation };
		var use_log_y = {id:"t3", name: "histogram log-y",  value: true };
		var use_log_x = {id:"t2", name: "histogram log-x",  value: true };


		// now the array of toggle objets

		var toggles = [
			widget.toggle(t4).label("right").update(function(d){
          use_growing_occupation = !use_growing_occupation;
          create_a_new_one();
      }),
			widget.toggle(use_log_y).label("right").update(function(d){
          if (use_log_y.value)
            h_pl.yscale("log");
          else
            h_pl.yscale("lin");
          plot_component_histogram();
      }),
			widget.toggle(use_log_x).label("right").update(function(d){
          if (use_log_x.value)
            h_pl.xscale("log");
          else
            h_pl.xscale("lin");
          plot_component_histogram();
      }),
		]

		// here comes the block for the toggles

		var togglebox = g.block({x0:10,y0:1.5,width:4,height:3}).Ny(toggles.length);

		// and here we att them to the panel

		controls.selectAll(".toggle").data(toggles).enter().append(widget.toggleElement)
			.attr("transform",function(d,i){return "translate("+togglebox.x(0)+","+togglebox.y(i)+")"});	


		///////////////////
		// sliders
		///////////////////	

		var x3 = {id:"ghult", name: "occupation probability", range: [0,1], value: p};


		var sliders = [
			widget.slider(x3).update(function(){
        p = x3.value; 
        d3.selectAll("#p-show").text("p = "+d3.format(".3f")(p));
        create_a_new_one();
      })
		]

		var sliderbox = g.block({x0:6,y0:8,width:14,height:1}).Ny(2);

		sliders.forEach(function(d){
			d.width(sliderbox.w())
		})


		controls.selectAll(".slider").data(sliders).enter().append(widget.sliderElement)
			.attr("transform",function(d,i){return "translate("+sliderbox.x(0)+","+sliderbox.y(i)+")"});	
    controls.append("text")
        .attr("id","p-show")
        .attr("x",sliderbox.x(0))
        .attr("y",sliderbox.y(2))
        .attr("style",'font-size: 18; font-family: Helvetica, Arial, sans-serif')
        .text("p = "+d3.format(".3f")(p))
      ;
    


		///////////////////
		// sliders
		///////////////////	


		var r2 = {id:"r2", name:"color", choices: ["color none","color largest","color spanning","color all"], value:3 };
    color_behavior = "color_all";

		var radios = [
			widget.radio(r2).shape("round").update(function(){
        if (r2.value == 0)
          color_behavior = "color_none";
        else if (r2.value == 1)
          color_behavior = "color_largest";
        else if (r2.value == 2)
          color_behavior = "color_spanning";
        else if (r2.value == 3)
          color_behavior = "color_all";
        draw();
      }),
		]

    

		var radiobox  = g.block({x0:1,y0:0,width:3,height:6}).Nx(2);
	

		radios.forEach(function(d){
			d.size(radiobox.h())
		})

		controls.selectAll(".radio").data(radios).enter().append(widget.radioElement)
			.attr("transform",function(d,i){return "translate("+radiobox.x(i)+","+radiobox.y(0)+")"});	
