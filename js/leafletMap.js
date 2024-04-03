class LeafletMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
    }
    this.data = _data;
    this.initVis();
    this.initUI(); // Call method to initialize UI

  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    //ESRI
    vis.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    vis.esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    //TOPO
    vis.topoUrl ='https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    vis.topoAttr = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';

    //Thunderforest Outdoors- requires key... so meh... 
    vis.thOutUrl = 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}';
    vis.thOutAttr = '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    //Stamen Terrain
    vis.stUrl = 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}';
    vis.stAttr = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';


    vis.jawgLagoonUrl = 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png';
    vis.jawgLagoonAttr = 'Map <a href="https://memomaps.de/">memomaps.de</a> <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    vis.checkurl = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';
    vis.checkAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    //this is the base map layer, where we are showing the map background
    vis.base_layer = L.tileLayer(vis.esriUrl, {
      id: 'esri-image',
      attribution: vis.esriAttr,
      ext: 'png'
    });

    vis.theMap = L.map('my-map', {
      center: [30, 0],
      zoom: 2,
      layers: [vis.base_layer]
    }).setView([37.8, -96], 3.25);

    //if you stopped here, you would just have a map

    //initialize svg for d3 to add to map
    L.svg({clickable:true}).addTo(vis.theMap)// we have to make the svg layer clickable
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
    vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto")

    //these are the city locations, displayed as a set of dots 
    vis.Dots = vis.svg.selectAll('circle')
                    .data(vis.data) 
                    .join('circle')
                        .attr("fill", "steelblue") 
                        .attr("stroke", "black")
                        //Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
                        //leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
                        //Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
                        .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
                        .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y) 
                        .attr("r", 3)
                        .on('mouseover', function(event,d) { //function to add mouseover event
                            d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                              .duration('150') //how long we are transitioning between the two states (works like keyframes)
                              .attr("fill", "red") //change the fill
                              .attr('r', 4); //change radius

                            //create a tool tip
                            d3.select('#tooltip')
                                .style('opacity', 1)
                                .style('z-index', 1000000)
                                  // Format number with million and thousand separator
                                .html(`<div class="tooltip-label"><b>City:</b> ${d.city_area}, <b>Date and Time:</b> ${d.date_time}, <b>UFO shape</b>: ${d.ufo_shape}, <b>Encounter Description</b>: ${d.description}</div>`);

                          })
                        .on('mousemove', (event) => {
                            //position the tooltip
                            d3.select('#tooltip')
                             .style('left', (event.pageX + 10) + 'px')   
                              .style('top', (event.pageY + 10) + 'px');
                         })              
                        .on('mouseleave', function() { //function to add mouseover event
                            d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                              .duration('150') //how long we are transitioning between the two states (works like keyframes)
                              .attr("fill", "steelblue") //change the fill
                              .attr('r', 3) //change radius

                            d3.select('#tooltip').style('opacity', 0);//turn off the tooltip

                          })
                        .on('click', (event, d) => { //experimental feature I was trying- click on point and then fly to it
                           // vis.newZoom = vis.theMap.getZoom()+2;
                           // if( vis.newZoom > 18)
                           //  vis.newZoom = 18; 
                           // vis.theMap.flyTo([d.latitude, d.longitude], vis.newZoom);
                          });
    
    //handler here for updating the map, as you zoom in and out           
    vis.theMap.on("zoomend", function(){
      vis.updateVis();
    });

  }

  updateVis(selectedAttribute) {
    let vis = this;

     //ESRI
     vis.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
     vis.esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
 
     //TOPO
     vis.topoUrl ='https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
     vis.topoAttr = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
 
     //Thunderforest Outdoors- requires key... so meh... 
     vis.thOutUrl = 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}';
     vis.thOutAttr = '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
 
     //Stamen Terrain
     vis.stUrl = 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}';
     vis.stAttr = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
 
 
     vis.jawgLagoonUrl = 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png';
     vis.jawgLagoonAttr = 'Map <a href="https://memomaps.de/">memomaps.de</a> <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

     vis.checkurl = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';
     vis.checkAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // Update map based on selected attribute
  switch (selectedAttribute) {
    case "Geo":
      vis.base_layer.setUrl(vis.esriUrl);
      vis.theMap.attributionControl.setPrefix(vis.esriAttr);
      break;
    case "Topo":
      vis.base_layer.setUrl(vis.topoUrl);
      vis.theMap.attributionControl.setPrefix(vis.topoAttr);
      break;
    case "Street":
      vis.base_layer.setUrl(vis.checkurl.replace('{apikey}', vis.accessToken));
      vis.theMap.attributionControl.setPrefix(vis.checkAttr);
      break;
    case "Airport":
      vis.base_layer.setUrl(vis.jawgLagoonUrl.replace('{s}', 'toner').replace('{ext}', 'png'));
      vis.theMap.attributionControl.setPrefix(vis.jawgLagoonAttr);
      break;
    default:
      console.error("Invalid attribute selection");
      break;
  }

    //want to see how zoomed in you are? 
    // console.log(vis.map.getZoom()); //how zoomed am I
    
    //want to control the size of the radius to be a certain number of meters? 
    vis.radiusSize = 3; 

    // if( vis.theMap.getZoom > 15 ){
    //   metresPerPixel = 40075016.686 * Math.abs(Math.cos(map.getCenter().lat * Math.PI/180)) / Math.pow(2, map.getZoom()+8);
    //   desiredMetersForPoint = 100; //or the uncertainty measure... =) 
    //   radiusSize = desiredMetersForPoint / metresPerPixel;
    // }
   
   //redraw based on new zoom- need to recalculate on-screen position
    vis.Dots
      .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
      .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y)
      .attr("r", vis.radiusSize) ;

  }


  initUI() {
    let vis = this;
  
    // Add UI elements for 'color by' options
    const attributeSelect = document.getElementById('select-attribute-1');
  
    // Event listener for attribute selection change
    attributeSelect.addEventListener('change', () => {
      const selectedAttribute = attributeSelect.value;
      vis.updateVis(selectedAttribute);
    });
  
    // Add UI elements for 'color by' options
    const colorByYearButton = document.getElementById('colorByYear');
    const colorByMonthButton = document.getElementById('colorByMonth');
    const colorByTimeOfDayButton = document.getElementById('colorByTimeOfDay');
  
    // Event listeners for 'color by' options
    colorByYearButton.addEventListener('click', () => {
      vis.colorPointsByYear();
    });
  
    colorByMonthButton.addEventListener('click', () => {
      vis.colorPointsByMonth();
    });
  
    colorByTimeOfDayButton.addEventListener('click', () => {
      vis.colorPointsByTimeOfDay();
    });
  }

  // Method to color points based on year
  colorPointsByYear() {
    let vis = this;

    // Get the range of years in the data
    const minYear = d3.min(vis.data, d => new Date(d.date_time).getFullYear());
    const maxYear = d3.max(vis.data, d => new Date(d.date_time).getFullYear());

    // Define a color scale that maps older years to darker shades and younger years to lighter shades
    const colorScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range(["#333", "#eee"]); // Darker to lighter shades

    // Apply the color scale to the points based on the year
    vis.Dots.attr("fill", d => {
        // Extract year from date_time field
        const year = new Date(d.date_time).getFullYear();
        // Map year to color using the color scale
        return colorScale(year);
    });
  }

  // Method to color points based on month
  colorPointsByMonth() {
    let vis = this;

    // Logic to determine colors based on month
    // Example:
    vis.Dots.attr("fill", d => {
      // Extract month from date_time field
      const month = new Date(d.date_time).getMonth();
      // Assign color based on month
      // You can define your own color scale here
      // For demonstration, let's assign different shades of green for each month
      const colorScale = d3.scaleSequential(d3.interpolateGreens).domain([0, 11]);
      return colorScale(month);
    });
  }

  // Method to color points based on time of day
  colorPointsByTimeOfDay() {
    let vis = this;

    // Logic to determine colors based on time of day
    // Example:
    vis.Dots.attr("fill", d => {
      // Extract hour from date_time field
      const hour = new Date(d.date_time).getHours();
      // Assign color based on time of day
      // You can define your own color scale here
      // For demonstration, let's assign different colors for morning, afternoon, evening, and night
      if (hour >= 6 && hour < 12) return "yellow"; // Morning
      else if (hour >= 12 && hour < 18) return "orange"; // Afternoon
      else if (hour >= 18 && hour < 21) return "red"; // Evening
      else return "blue"; // Night
    });
  }
  renderVis() {
    let vis = this;

    //not using right now... 
 
  }
}

// class LeafletMap {

//   /**
//    * Class constructor with basic configuration
//    * @param {Object}
//    * @param {Array}
//    */
//   constructor(_config, _data) {
//     this.config = {
//       parentElement: _config.parentElement,
//     }
//     this.data = _data;
//     this.initVis();
//     this.initUI(); // Call method to initialize UI
//   }
  
//   /**
//    * We initialize scales/axes and append static elements, such as axis titles.
//    */
//   initVis() {
//     let vis = this;

//     //ESRI
//     vis.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
//     vis.esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

//     // Initialize Leaflet map
//     vis.theMap = L.map('my-map').setView([37.8, -96], 3.25);

//     // Base layer
//     vis.base_layer = L.tileLayer(vis.esriUrl, {
//       id: 'esri-image',
//       attribution: vis.esriAttr,
//       ext: 'png'
//     }).addTo(vis.theMap);

//     // Initialize SVG overlay
//     // vis.overlay = L.d3SvgOverlay(svg => {
//     //   vis.svg = svg;
//     //   vis.g = svg.append('g');
//     //   vis.brush = d3.brush().on('brush', brushed);
//     //   vis.g.call(vis.brush);
//     // }).addTo(vis.theMap);
//     // Initialize SVG overlay
// vis.overlay = L.d3SvgOverlay(function (selection, projection) {
//   vis.svg = selection;
//   vis.g = selection.append('g');
//   vis.brush = d3.brush().on('brush', brushed);
//   vis.g.call(vis.brush);
// }).addTo(vis.theMap);


//     // Initialize D3 visualization
//     vis.updateVis();

//     // Brushing function
//     function brushed() {
//       const selection = d3.event.selection;
//       const selectedPoints = vis.data.filter(d => {
//         const [x, y] = vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]);
//         return x >= selection[0][0] && x <= selection[1][0] && y >= selection[0][1] && y <= selection[1][1];
//       });
//       // Do something with selectedPoints, e.g., update another visualization
//     }
//   }

//   updateVis() {
//     let vis = this;

//     // Update D3 visualization based on map state, e.g., zoom level, pan
//     // Example:
//     vis.g.selectAll('circle')
//       .data(vis.data)
//       .join('circle')
//       .attr('cx', d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).x)
//       .attr('cy', d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).y)
//       .attr('r', 3)
//       .attr('fill', 'steelblue')
//       .attr('stroke', 'black');
//   }

//   initUI() {
//     // Add UI elements, if needed
//   }
// }