# Site Percolation

This is a small web app to demonstrate site percolation and
explore the occuring phase transition.

## Run

First, clone this repository

    git clone https://github.com/explorablesforsfi/percolation.git

Then change to this repository and start a local webserver

    cd percolation
    python -m "http.server" 1313
    
Go to your browser and navigate to http://localhost:1313 .

![percolation](https://github.com/explorablesforsfi/percolation/raw/master/img/example.png)

## License

All original code in this repository, i.e. all code which is not in the subdirectory `/libs/` is licensed under the CC 4.0 license. The subdirectory `/libs/` contains external libraries which are licensed as follows

 
| File name                      | License                                 | Link to repository|
|--------------------------------|-----------------------------------------|-------------------|
| `d3-color.v1.min.js`           | BSD 3-Clause "New" or "Revised" License | [d3-color](https://github.com/d3/d3-color)|
| `d3-scale-chromatic.v1.min.js` | BSD 3-Clause "New" or "Revised" License | [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic)|
| `d3.v4.min.js`                 | BSD 3-Clause "New" or "Revised" License | [d3](https://github.com/d3/d3)|
| `simple_plot.js`               | CC 4.0                                  | [simple-plot](https://github.com/benmaier/simple-plot)|
| `widget.v3.4.js`               | permission to use given by D. Brockmann | [complexity explorables](http://www.complexity-explorables.org) |
