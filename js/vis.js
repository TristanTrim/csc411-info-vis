

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

d3.select('body')
.style("margin",0)
.style("padding",0)
.style("border",0)
;
const layoutTopRow = d3.select('body').append("div")
.style("margin",0)
.style("padding",0)
.style("border",0)
;
const layoutBottomRow = d3.select('body').append("div")
.style("margin",0)
.style("padding",0)
.style("border",0)
;

const layoutWidth = innerWidth-15;
const layoutHeight = innerHeight-15;

const layoutMapWidth = layoutWidth-layoutHeight/2;
const layoutMapHeight = layoutHeight/2;

const layoutTimelineWidth = layoutWidth;
const layoutTimelineHeight = layoutHeight/2;

const mapSvg =layoutTopRow.append("svg")
.attr('class','mapSvg')
.style('width',layoutMapWidth+"px")
.style('height',layoutMapHeight+"px")
;
// <--- data detail terminal goes here
const timelineSvg = layoutBottomRow.append("svg")
.attr('class','timelineSvg')
.style('width',layoutTimelineWidth+"px")
.style('height',layoutTimelineHeight+"px")
;



window.projection = d3.geoNaturalEarth1();
projection.translate([layoutMapWidth/2,layoutMapHeight/2])
projection.scale(layoutMapHeight/3);

const pathGenerator = d3.geoPath().projection(projection);

const mapBg = mapSvg.append("g").attr("class","mapBg");
window.mapOverlay = mapSvg.append("g").attr("class","mapOverlay");

d3.select('body').append("div")
.attr("class","countryTitle")
.style("position","absolute")
.style("pointer-events", "none") // when moving mouse down don't mouseover this text preventing events below.
.style("text-shadow", Array(13).fill("0px 0px 3px #fff").join(",") ) // That's css uwu
.attr("fill","black")
.attr("z",10)
;



var datasets = {};
var _wa_proc_done = false;
var _wa_callbacks = [];
var _efotw_proc_done_ = false;
var _cowisw_proc_done_ = false;

d3.csv("./data/Inter-StateWarData_v4.0.csv")
.then(data => {
    datasets.interStateWarData = data;
    if ( _efotw_proc_done_ ){
        connectWarsWithCountries();
    } else {
        _cowisw_proc_done_ = true;
    }
});
d3.csv("./data/COW-country-codes.csv")
.then(data => {
    datasets.cowCountryCodes = data;
});
d3.csv("./data/iso3166😵‍💫.csv")
.then(data => {
    datasets.iso3166 = data;
});
d3.csv("./data/efotw2023.csv")
.then(data => {
    datasets.efotw = data;
    procEfotw();
});

let newCou = function( cdat, i ){
    let cob = {
        "name": cdat.Countries,
        "_ef_index_": {
            "start": i,
            "end": null,
        },
        "ef": [cdat],
        "map_data": null,
        "map_area": null,
        "map_lines": [],
        "scatter_line": null,
        "scatter_points": [],
        "war_participations": []
    };

    // TODO: add to lookups here!


    return cob;
};

let procEfotw = function(){


    window.countries = [];
    window._name2country = {}; // should only be used to build the other data structs
    window._ef_i2country = [];
    
    let nc =newCou( datasets.efotw[0], 0); // nc, new country
    countries.push(nc);
    _ef_i2country.push(nc);
    _name2country[nc.name] = nc;
    for (let i=1; i<datasets.efotw.length; i++){
        let nef = datasets.efotw[i]; // nef, new efotw data entry
        if ( nc.name === nef.Countries ){
            nc.ef.push(nef);
        } else {
            nc._ef_index_.end = i;
            nc =newCou( nef, i); 
            countries.push(nc);
            _name2country[nc.name] = nc;
        }
        _ef_i2country.push(nc);

    }
    nc._ef_index_.end = datasets.efotw.length;


    // ready to draw the map if it's loaded
    if ( _wa_proc_done  ){
        drawMap();
    }
    _efotw_proc_done_ = true;
    // ready to link with war data if it's loaded
    if ( _cowisw_proc_done_ ){
        connectWarsWithCountries();
    }


    // ndsp matrix stuff


    window.ndsp = makeNDSP();

    for (const cb of _wa_callbacks){ cb(); }

};

let makeNDSP = function(){

    window.axes = {};

    axes._proto_var_lists = {
        "all44" : [ "1A Government consumption", "1B  Transfers and subsidies", "1C  Government investment", "1Di Top marginal income tax rate", "1Dii Top marginal income and payroll tax rate", "2A  Judicial independence", "2B  Impartial courts", "2C  Property rights", "2D  Military interference", "2E Legal integrity", "2F Contracts", "2G Real property", "2H Police and crime", "3A  Money growth", "3B  Standard deviation of inflation", "3C  Inflation", "3D  Foreign currency bank accounts", "4Ai  Trade tax revenue", "4Aii  Mean tariff rate", "4Aiii  Standard deviation of tariff rates", "4Bi  Non-tariff trade barriers", "4Bii  Costs of importing and exporting", "4C  Black market exchange rates", "4Di  Financial openness", "4Dii  Capital controls", "4Diii Freedom of foreigners to visit", "4Div Protection of Foreign Assets", "5Ai  Ownership of banks", "5Aii Private sector credit", "5Aiii  Interest rate controls/negative real interest rates)", "5Bi  Labor regulations and minimum wage", "5Bii  Hiring and firing regulations", "5Biii  Flexible wage determination", "5Biv  Hours Regulations", "5Bv Cost of worker dismissal", "5Bvi  Conscription", "5Bvii Foreign Labor", "5Ci  Regulatory Burden", "5Cii  Bureacracy costs", "5Ciii  Impartial Public Administration", "5Civ Tax compliance", "5Di  Market openness", "5Dii Business Permits", "5Diii Distorton of the business environment" ] , // sorry.
        "main5" : [
            "1  Size of Government",
            "2  Legal System & Property Rights -- With Gender Adjustment",
            "2 Legal System & Property Rights - No Gender Adjustment",
            "3  Sound Money",
            "4  Freedom to trade internationally",
            "5  Regulation"]
        };


    // tf needs to request data back from the gpu which is probs gonna be slower most of the time
    
    //let data_of_interest = datasets.efotw.map( d => vars_of_interest.map( i => d[i] ) );
    //window.ef = tf.tensor(data_of_interest,null,'float32')

    window.ef_names = axes._proto_var_lists.main5;
    window.ef = numeric.t(
            datasets.efotw.map( d => ef_names.map( i => d[i] )));


    let ndsp = {};

    ndsp.center_pos = [layoutWidth - layoutHeight/4, layoutHeight/4];
    ndsp.scale_factor = (layoutHeight - 40)/40;

    // bg

    ndsp.bg = timelineSvg.append("circle")
    .attr("r",layoutHeight/4)
    .attr("cx",ndsp.center_pos[0])
    .attr("cy",ndsp.center_pos[1])
    .attr("fill",d3.hsl(0,0,.3) )
    ;


    // axes

    ndsp.fakeAxes = [];
    let nax = ef_names.length;
    for (let i=0;i<nax;i++){
        ndsp.fakeAxes.push([
            -15*i/nax + 7.4,
            .5+.3* (10-Math.abs(i-10)) * Math.random() ]);
    }


    // layers to control what shows up on top of what

    let axisLineLayer = timelineSvg.append("g").attr("class","axisLineLayer");

    let dataLayer = timelineSvg.append("g").attr("class","dataLayer")
    //.style("pointer-events", "none") ; // don't prevent mouse events below.

        // This is cool:
        // https://stackoverflow.com/a/14387859/3988392
        //  <!-- This transfer function leaves all alpha values of the unfiltered
        //       graphics that are lower than .5 at their original values.
        //       All higher alpha above will be changed to .5.
        //       These calculations are derived from the values in
        //       the tableValues attribute using linear interpolation. -->
    timelineSvg.append("filter")
    .attr("id", "constantOpacity")
    .append("feComponentTransfer")
    .append("feFuncA")
    .attr("type","table")
    .attr("tableValues","0 .5 .5")
    ;
    let axisCircleLayer = timelineSvg.append("g")
    .attr("class","axisCircleLayer")
    .attr("filter","url(#constantOpacity)")
    ;


    // add datapoints

    ndsp.efcy_data = ef.dot(ndsp.fakeAxes).x;


    ndsp.positionedPoints =
        numeric.mul(
            ndsp.efcy_data,
            layoutHeight/1000
        ).map(
            ([x,y])=>[
                ndsp.center_pos[0]+x,
                ndsp.center_pos[1]-y,
            ]
        );

    dataLayer.selectAll(".efcyPath").data(countries)
    .enter()
    .append("path")
    .attr("class","efcyPath")
    .attr("fill","rgb(0,0,0,0)")
    .attr("stroke",d3.hsl(0,0,1,.1))
    .attr("stroke-width",0.7)
    .attr('d', (d,i,b)=>{
        let path_data = ndsp.positionedPoints.slice(
            d._ef_index_.start,
            d._ef_index_.end
        );
        d.scatter_line = b[i];
        return d3.line()(path_data);
    })
    ;
        // TODO: this should not be duplicated by below behavior
    dataLayer.selectAll(".efcy").data(ndsp.positionedPoints)
    .enter()
    .append("circle")
    .attr("class","efcy")
    .attr("country", (d,i,b)=>{
        let cou = _ef_i2country[i];
        cou.scatter_points.push(b[i]);
        return cou;
    })
    .attr("fill",d3.hsl(0,0,1,.1))
    .attr("r",1)
    .attr("cx", d => d[0])
    .attr("cy", d => d[1])
    ;


    // add axes

      // lines
    axisLineLayer.selectAll(".axisLine")
    .data(ndsp.fakeAxes)
    .enter()
    .append("line")
    .attr("class","axisLine")
    .attr("id",(d,i)=>"axline"+i)
    .attr("x1",(d)=> ndsp.center_pos[0])
    .attr("y1",(d)=> ndsp.center_pos[1])
    .attr("x2",(d)=> ndsp.scale_factor*d[0]+ndsp.center_pos[0])
    .attr("y2",(d)=> ndsp.center_pos[1]-ndsp.scale_factor*d[1])
    .attr("stroke",d3.hsl(0,0,0,.5))
    ;
      // circles
    axisCircleLayer.selectAll(".axisCircle")
    .data(ndsp.fakeAxes)
    .enter()
    .append("circle")
    .attr("class","axisCircle")
    .attr("id",(d,i)=>i)
    .attr("name",(d,i)=>ef_names[i])
    .attr("r",8)
    .attr("fill",d3.hsl(0,0,.1,.1) )
    .attr("stroke",d3.hsl(0,0,.1) )
    .attr("stroke-width","2px")
    .attr("cx",(d)=> ndsp.scale_factor*d[0]+ndsp.center_pos[0])
    .attr("cy",(d)=> ndsp.center_pos[1]-ndsp.scale_factor*d[1])
    .call(d3.drag()
        .on("start", ()=>{
            ndsp.dragged = event.target;
        })
        .on("drag", (e)=>{
            let id = ndsp.dragged.id;
            ndsp.fakeAxes[id] = numeric.add(
                    ndsp.fakeAxes[id],
                    numeric.div(
                            [e.dx,-e.dy],
                            ndsp.scale_factor
                            ));

            if (numeric.norm2(ndsp.fakeAxes[id]) > 10) {
                ndsp.fakeAxes[id] = numeric.mul(10,numeric.div(
                    ndsp.fakeAxes[id],
                    numeric.norm2(ndsp.fakeAxes[id])
                    ));
            }


            let new_coord = numeric.add(
                [ ndsp.scale_factor*ndsp.fakeAxes[id][0],
                  -ndsp.scale_factor*ndsp.fakeAxes[id][1] ],
                ndsp.center_pos);
            d3.select(ndsp.dragged)
            .attr("cx", new_coord[0])
            .attr("cy", new_coord[1])
            ;
            d3.select("#axline"+id)
            .attr("x2", new_coord[0])
            .attr("y2", new_coord[1])
            ;

            // I was trying to be smart and not do the whole
            // matrix every time... Maybe do it again, it's
            // pretty expensive calculation.
         //   let [xs, ys] = numeric.transpose(ndsp.efcy_data);
         //   let ax = ef.x[id];
         //   ndsp.efcy_data = numeric.transpose([
         //       numeric.add(
         //           xs,
         //           numeric.mul(
         //               numeric.mul(
         //                   e.dx / ndsp.scale_factor ,
         //                   ax
         //               ),
         //               xs
         //           )
         //       ),
         //       numeric.add(
         //           ys,
         //           numeric.mul(
         //               numeric.mul(
         //                   -e.dy / ndsp.scale_factor  ,
         //                   ax
         //               ),
         //               ys
         //           )
         //       )
         //   ]);
                    

            // recalculate the positions of the datapoints !
            ndsp.efcy_data = ef.dot(ndsp.fakeAxes).x;

            // reposition them.

            ndsp.positionedPoints =
                numeric.mul(
                    ndsp.efcy_data,
                    layoutHeight/1000
                ).map(
                    ([x,y])=>[
                        ndsp.center_pos[0]+x,
                        ndsp.center_pos[1]-y,
                    ]
                );

            let efcy = dataLayer.selectAll(".efcyPath").data(countries)
            efcy
            .merge(efcy)
            .attr('d', (d)=>{
                let path_data = ndsp.positionedPoints.slice(
                    d._ef_index_.start,
                    d._ef_index_.end
                );
                return d3.line()(path_data);
            })
            ;

            efcy = timelineSvg.selectAll(".efcy").data(ndsp.positionedPoints);
            // TODO: this should normalize on furthest point
            // and should not be duplicating above functionality
            efcy
            .merge(efcy)
            .attr("cx", d => d[0])
            .attr("cy", d => d[1])
            ;

            for (const cou of countries){
                if ( cou.map_area ){
                  //let val = numeric.mean(ndsp.efcy_data.slice(
                  let val = (ndsp.efcy_data[cou._ef_index_.start][1] + 20) / 200;
                  cou.map_data.color = d3.hsl(0,0,val );
                  cou.map_area.setAttribute("fill",d3.hsl(0,0,val));
                }
            }

            drawLinesOnTimeline();

        })
      //  .on("end", ()=>{
      //  })
    )
    .on("click",()=>{
        //.attr("cx",(d)=> ndsp.scale_factor*d[0]+ndsp.center_pos[0])
        //.attr("cy",(d)=> ndsp.scale_factor*d[1]+ndsp.center_pos[1])
    })
    .on('mouseenter', (e)=>{
        d3.select(".countryTitle")
        .style("left",(ndsp.center_pos[0] - .4*layoutTimelineHeight)+"px")
        .style("top",(ndsp.center_pos[1] + .5*layoutTimelineHeight)+"px")
        .html(e.target.getAttribute("name"))
        ;
    })
    .on('mouseleave', (e)=>{
        d3.select(".countryTitle")
        .html()
        ;
    })
    ;



    ndsp.center = timelineSvg.append("circle")
    .attr("r",5)
    .attr("cx",ndsp.center_pos[0])
    .attr("cy",ndsp.center_pos[1])
    .attr("fill",d3.hsl(0,0,.6,.5) )
    .attr("stroke",d3.hsl(0,0,0,.5))
    .style("pointer-events", "none") // should be able to drag axis handles out from center
    ;



    return ndsp;
};


// foo is reference code...

// this is a bunch of code snippits from trying
// to line up different datasests in different ways.

var foo = function(){

cowDict = {};
for (const cont of datasets.cowCountryCodes) {
  cowDict[cont.CCode] = cont;
}
cowDict[datasets.interStateWarData[0].ccode]
// worldAtlasCountries codes are ISO 3166-1 numeric
datasets.worldAtlasCountries.features[0].id

num2let = {};
let2num = {};
for (const cunt of datasets.iso3166) {
  let2num[cunt["alpha-3"]]=cunt["country-code"];
  num2let[cunt["country-code"]]=cunt["alpha-3"];
}

// these are some of the recent interStateWarData StateName
// entries that don't exist in the worldAltlas
name2geoFilter={
	"South Vietnam":"Vietnam",
	"Democratic Republic of the Congo":"Dem. Rep. Congo",
	"Bosnia":"Bosnia and Herz.",
	"Yugoslavia":"Bosnia and Herz.", // also Slovenia, Croatia, Serbia, Montenegro, Macedonia
}
name2atlas = {}
for (const geo of datasets.worldAtlasCountries.objects.countries.geometries) {
  name2atlas[geo.properties.name] = geo;
} 
name2atlas[	"South Vietnam" ] = name2atlas["Vietnam"];
name2atlas[	"Democratic Republic of the Congo" ] = name2atlas["Dem. Rep. Congo"];
name2atlas[	"Bosnia" ] = name2atlas["Bosnia and Herz."];
name2atlas[	"Yugoslavia" ] = name2atlas["Bosnia and Herz."]; // also Slovenia, Croatia, Serbia, Montenegro, Macedonia

// so this is how you would highlight a country based on a war:
cName = datasets.interStateWarData[0].StateName
mapSvg.select(".mapBg") .selectAll("path[name='"+cName+"']").attr("fill","pink")
// possibly it could be more computationally efficient some other way,
// but in general d3 seems pretty optimized.
// Fine for human interaction, might chug on a bunch of automated stuff.

};



d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
.then(data => {
  datasets.worldAtlasCountries = data;
  if ( _efotw_proc_done_ ){
      drawMap();
  } else {
      _wa_proc_done = true;
  }
})
;

let wa_name2ef_name = {
    "W. Sahara": null,
    "United States of America": "United States",
    "Uzbekistan": null,
    "Dem. Rep. Congo": "Congo, Dem. Rep.",
    "Dominican Rep.": "Dominican Republic",
    "Russia": "Russian Federation",
    "Bahamas": "Bahamas, The",
    "Falkland Is.": null,
    "Greenland": null,
    "Fr. S. Antarctic Lands": null,
    "Venezuela": "Venezuela, RB",
    "Puerto Rico": null,
    "Cuba": null,
    "Central African Rep.": "Central African Republic",
    "Congo": "Congo, Rep.",
    "Eq. Guinea": null,
    "eSwatini":  "Eswatini",
    "Palestine": null,
    "Gambia": "Gambia, The",
    "Vanuatu": null,
    "Laos": "Lao PDR",
    "North Korea": null,
    "South Korea": "Korea, Rep.",
    "Afghanistan": null,
    "Kyrgyzstan": "Kyrgyz Republic",
    "Turkmenistan": null,
    "Iran": "Iran, Islamic Rep.",
    "Syria": "Syrian Arab Republic",
    "Turkey": null,
    "New Caledonia": null,
    "Solomon Is.": null,
    "Brunei": "Brunei Darussalam",
    "Slovakia": "Slovak Republic",
    "Eritrea": null,
    "Yemen": "Yemen, Rep.",
    "Antarctica": null,
    "N. Cyprus":  "Cyprus",
    "Egypt": "Egypt, Arab Rep.",
    "Somaliland":  null, // apparently somaliland is a democracy that broke from "Somalia",
    "Bosnia and Herz.": "Bosnia and Herzegovina",
    "Macedonia": "North Macedonia",
    "Kosovo": null,
    "S. Sudan":  null // idk what's up with sudan & south sudan, but they aren't the same "Sudan"
    };

window.drawMap = function(){

    // this is the ocean / map outline

    let sphere = mapBg.selectAll('.sphere').data([0]);
    sphere
    .enter().append('path')
    .attr('class', 'sphere')
    .attr('fill',d3.hsl(0,0,.3))
    .merge(sphere)
    .attr('d', pathGenerator({type: 'Sphere'}))
    ;

    // this is the countries

    let data = datasets.worldAtlasCountries;
    let countries = topojson.feature(data, data.objects.countries);

    // fake made up _values and colors
    countries.features.map( (c) => {
        //c._value_ = Math.random()*(1-.1-.4)+.4;
        //c.color = d3.hsl(30,0,c._value_);
        c.color = d3.hsl(180,.3,.3);
        });

    let d3cou = mapBg.selectAll('.country').data(countries.features);
    d3cou
    .enter().append('path')
    .attr('class', 'country')
    .attr('stroke',"#000")
    .attr('fill', d=>d.color)
    .on('mouseenter', (e)=>{

        let mHL = e.target.cloneNode();
        mHL.setAttribute("id","mHL");
        mHL.setAttribute("stroke","#fa0");
        mHL.style.setProperty("pointer-events", "none")
        mapSvg.append(()=>mHL);
        
     //   d3.select(e.target)
     //   //.attr("fill","sandybrown")
     //   //.attr("fill","peachpuff")
     //   .attr("fill",(d)=>d3.hsl(30,0.8,d._value_))
     //   .attr("stroke","#fa0")
     //   ;
        d3.select(".countryTitle")
        .html(e.target.getAttribute("name"))
        ;
        if ( e.target.country ){
            d3.selectAll(e.target.country.scatter_points)
            .attr("fill","orange").attr("r",2)
            ;
            d3.select(e.target.country.scatter_line)
            .interrupt()
            .attr("stroke","orange")
            .attr("stroke-width",1.5)
            ;
        }
    })
    .on('mousemove',(e)=>{
        d3.select(".countryTitle")
        .style("left",(e.clientX-30)+"px")
        .style("top",(e.clientY+20)+"px")
        //.style("x",(e.clientX-30)+"px")
        //.style("y",(e.clientY+20)+"px")
        ;
    })
    .on('mouseleave', (e)=>{

        d3.select("#mHL").remove();

    //    d3.select(e.target)
    //    .attr('fill', d=>d.color)
    //    ;
        d3.select(".countryTitle")
        .html("")
        ;
        if ( e.target.country ){
            d3.selectAll(e.target.country.scatter_points)
            .attr("fill",d3.hsl(0,0,1,.1))
            .attr("r",0.7)
            ;
            d3.select(e.target.country.scatter_line)
            .attr("stroke","skyblue")
            .transition()
            //.ease(d3.easePolyIn(1))
            .ease(d3.easeExpOut)
            .duration(15000)
            .attr("stroke",d3.hsl(0,0,1,.1))
            .attr("stroke-width",0.7)
            ;
        }
    })
    .attr("name",(d)=>{
        return( d.properties.name );
    })
    .attr("country", (d,i,b)=>{

        let cou = _name2country[d.properties.name];
        if ( cou === undefined ) {
            cou = _name2country[ wa_name2ef_name[d.properties.name] ];
            if ( ! (cou === undefined) ) {
              cou.map_data = d;
              cou.map_area = b[i];
              b[i].country = cou;
            }
        } else {
          cou.map_data = d;
          cou.map_area = b[i];
          b[i].country = cou;
        }
        return( cou );
    })
    .merge(d3cou)
    .attr('d', pathGenerator)
    ;
};



// war data <--> country data

let cow_name2ef_name = {
    "Taiwan (ROC)":"Taiwan",
    "China (PRC)":"China",
    "United States of America": "United States",
    "South Korea": "Korea, Rep.",
    "South Vietnam": "Vietnam",
    "Egypt": "Egypt, Arab Rep.",
    "Syria": "Syrian Arab Republic",
    "Laos": "Lao PDR",
    "Turkey": null,
    "Cuba": null,
    "Democratic Republic of the Congo": "Congo, Dem. Rep.",
    "Iran": "Iran, Islamic Rep.",
    "Bosnia": "Bosnia and Herzegovina",
    "Yugoslavia":"Bosnia and Herz.", // it's not exact 100% the maps were different back then
    "Eritrea": null,
    "Afghanistan": null
    };


let newPar = function(entry){

    let par = {};

    par.death = Number(entry.BatDeath);
    if (par.death == -9) par.death = null;
    par.start = new Date(entry.StartYear1+"-"+entry.StartMonth1+"-"+entry.StartDay1)
    par.end = new Date(entry.EndYear1+"-"+entry.EndMonth1+"-"+entry.EndDay1)

    par.war = null; // gets set by caller

    par.country = _name2country[entry.StateName];
    if (!(par.country)){
        par.country = _name2country[cow_name2ef_name[entry.StateName]];
    } // country will still be null if it's null in cow_name2ef_name

    if (par.country){
        par.cname = par.country.name;
    } else {
        par.cname = entry.StateName;
    }

    par.scatter_lines = []; //TODO

    return par;
}

let newWar = function(entry){


    let war = {};

    war.name = entry.WarName;
    war.id = entry.WarNum;

    let pT = d3.timeParse("%Y-%m-%d");
    war.start = pT(entry.StartYear1+"-"+entry.StartMonth1+"-"+entry.StartDay1)
    war.end = pT(entry.EndYear1+"-"+entry.EndMonth1+"-"+entry.EndDay1)
    war.participants = [];

    war.addParticipant = function(centry){
        let par = newPar(centry);
        par.war = war;
        war.participants.push(par);
        if ( par.start < war.start){ war.start = par.start; }
        if ( war.end < par.end){ war.end = par.end; }
    };

    return war;
};

var connectWarsWithCountries = function(){

    window.wars = [];

    let cow = datasets.interStateWarData;
    let nw = newWar(cow[0]);
    wars.push(nw);
    nw.addParticipant(cow[0]);
    for (let i = 1; i<cow.length; i++){
        let ncow = cow[i];
        if (!(nw.name === ncow.WarName)){
            nw = newWar(ncow);
            wars.push(nw);
        }
        nw.addParticipant(ncow);
    }

    // lets only look at the ones since 1970
    let pT = d3.timeParse("%Y-%m-%d");
    wars = wars.filter((d)=>d.start > pT("1970-1-1"));

}



// timeline

var testData = [
	{label: "person a", times: [
		{"starting_time": 1355752800000, "ending_time": 1355759900000},
		{"starting_time": 1355767900000, "ending_time": 1355774400000}]},
	{label: "person b", times: [
		{"starting_time": 1355759910000, "ending_time": 1355761900000}]},
	{label: "person c", times: [
		{"starting_time": 1355761910000, "ending_time": 1355763910000}]}
	];

var testData2 = [{date: 1970, value: 0}, {date: 1976, value: 4}, {date: 1994, value: 9}, {date: 2007, value: 1}, {date: 2024, value: 10}];

// function(d){
//     return { date: d3.timeParse("%Y")(d.date), value : d.value }
// };

// makes a simple line graph, need to tweak still
window.drawTimeline1 = function(){

    // var svg = d3.select("svg"),
    //     margin = 200,
    //     width = layoutTimelineWidth, //svg.attr("width") - margin,
    //     height = layoutTimelineHeight; //svg.attr("height") - margin

    // Data area scaling
    var xScale = d3.scaleLinear().domain([1970, 2024]).range([50, layoutTimelineWidth*3/4 -75]),
        yScale = d3.scaleLinear().domain([0, 10]).range([layoutTimelineHeight*7/8, 0]);

    // Title
    // timelineSvg.append('text')
    // .attr('x', layoutTimelineWidth*3/8)
    // .attr('y', 100)
    // .attr('text-anchor', 'middle')
    // .style('font-family', 'Helvetica')
    // .style('font-size', 20)
    // .text('War Timeline');
        
    // // X label
    // timelineSvg.append('text')
    // .attr('x', layoutTimelineWidth*3/8)
    // .attr('y', layoutTimelineHeight)
    // .attr('text-anchor', 'middle')
    // .style('font-family', 'Helvetica')
    // .style('font-size', 12)
    // .text('Year');
        
    // Y label
    // timelineSvg.append('text')
    // .attr('text-anchor', 'middle')
    // .attr('transform', 'translate(60,' + layoutTimelineHeight/2 + ')rotate(-90)')
    // .style('font-family', 'Helvetica')
    // .style('font-size', 12)
    // .text('Dependant');

    // X axis line
    timelineSvg.append("g")
        .attr("transform", "translate(0," + layoutTimelineHeight*7/8 + ")")
        .call(d3.axisBottom(xScale)
        .ticks(layoutTimelineWidth / 250)
        //.tickFormat(d => d.getFullYear())
        .tickSizeOuter(0));

    // customization features to tweak
    // timelineSvg.append("g")
    //     .attr("transform", `translate(${marginLeft},0)`)
    //     .call(d3.axisLeft(y).ticks(height / 40))
    //     .call(g => g.select(".domain").remove())
    //     .call(g => g.selectAll(".tick line").clone()
    //         .attr("x2", width - marginLeft - marginRight)
    //         .attr("stroke-opacity", 0.1))
    //     .call(g => g.append("text")
    //         .attr("x", -marginLeft)
    //         .attr("y", 10)
    //         .attr("fill", "currentColor")
    //         .attr("text-anchor", "start")
    //         .text("↑ Daily close ($)"));

    // Line generator
    const line = d3.line()
        .x((d) => xScale(d[0]))
        //.y((d) => yScale(d.value))
        .y((d) => d[1])
        ;

    
    drawLinesOnTimeline._line = line;
    drawLinesOnTimeline();
};
window.drawLinesOnTimeline = function(){

    let couTL = timelineSvg.selectAll(".couTimeline").data(countries);
    couTL
    .enter()
    // Line
    .append("path")
    .attr("class","couTimeline")
    .attr("fill", "none")
    .attr("stroke", "#535966")
    .attr("stroke-width", 0.3)
    .merge(couTL)
    .attr("d", (d) => {
        let ydata = ndsp.positionedPoints.slice(
            d._ef_index_.start,
            d._ef_index_.end
        ).map( ([x,y]) => y );

        let xdata = d.ef.map(x=>x.Year);

        let linedata = numeric.transpose(
            [xdata, ydata] );
            
        return drawLinesOnTimeline._line(linedata);
    })
    ;

};

window.drawTimeline2 = function() {

 //   var xScale = d3.scaleLinear().domain([Date("1970-1-1"), Date("2024-1-1")]).range([50, layoutTimelineWidth*3/4 -75]),
 //       yScale = d3.scaleLinear().domain([0, 10]).range([layoutTimelineHeight*7/8, 0]);

    let pT = d3.timeParse("%Y-%m-%d");
    var xScale = d3.scaleTime()
      .domain([pT("1970-1-1"), pT("2024-1-1")])
      .range([50, layoutTimelineWidth*3/4 -75])
      ;

    var xAxis = d3.axisBottom(xScale);


    let warLi = timelineSvg.selectAll(".warLi")
    .data(wars);
    warLi
    .enter()
    .append("line")
    .attr("class","warLi")
    .attr("x1",d=> xScale(d.start))
    .attr("y1",10)
    .attr("x2",d=> xScale(d.end))
    .attr("y2",30)
    .attr("stroke","rgb(200,0,0)")
    .attr("stroke-width",7)
    //.attr("stroke-linecap","round")
    ;
    let warBo = timelineSvg.selectAll(".warBo")
    .data(wars);
    warBo
    .enter()
    .append("rect")
    .attr("class","warBo")
    .attr("x",d=> xScale(d.start))
    .attr("y",10)
    .attr("width", d=> ( xScale(d.end) - xScale(d.start) ))
    .attr("height", layoutTimelineHeight*7/8)
    .attr("fill","rgb(200,0,0,.2)")
    ;


}

if ( _wa_proc_done ){
  drawTimeline2();
  drawTimeline1();
}else{
  _wa_callbacks.push( drawTimeline2 );
  _wa_callbacks.push( drawTimeline1 );
}
      

// export stuff for access later & in web console.
window.d3 = d3;
window.mapSvg = mapSvg;
window.timelineSvg = timelineSvg;
window.datasets = datasets;

