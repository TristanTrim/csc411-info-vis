

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

d3.csv("./data/Inter-StateWarData_v4.0.csv")
.then(data => {
    datasets.interStateWarData = data;
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

let procEfotw = function(){
    let vars_of_interest = [ "1A Government consumption", "1B  Transfers and subsidies", "1C  Government investment", "1Di Top marginal income tax rate", "1Dii Top marginal income and payroll tax rate", "2A  Judicial independence", "2B  Impartial courts", "2C  Property rights", "2D  Military interference", "2E Legal integrity", "2F Contracts", "2G Real property", "2H Police and crime", "3A  Money growth", "3B  Standard deviation of inflation", "3C  Inflation", "3D  Foreign currency bank accounts", "4Ai  Trade tax revenue", "4Aii  Mean tariff rate", "4Aiii  Standard deviation of tariff rates", "4Bi  Non-tariff trade barriers", "4Bii  Costs of importing and exporting", "4C  Black market exchange rates", "4Di  Financial openness", "4Dii  Capital controls", "4Diii Freedom of foreigners to visit", "4Div Protection of Foreign Assets", "5Ai  Ownership of banks", "5Aii Private sector credit", "5Aiii  Interest rate controls/negative real interest rates)", "5Bi  Labor regulations and minimum wage", "5Bii  Hiring and firing regulations", "5Biii  Flexible wage determination", "5Biv  Hours Regulations", "5Bv Cost of worker dismissal", "5Bvi  Conscription", "5Bvii Foreign Labor", "5Ci  Regulatory Burden", "5Cii  Bureacracy costs", "5Ciii  Impartial Public Administration", "5Civ Tax compliance", "5Di  Market openness", "5Dii Business Permits", "5Diii Distorton of the business environment", ] ; // sorry.


    // tf needs to request data back from the gpu which is probs gonna be slower most of the time
    
    //let data_of_interest = datasets.efotw.map( d => vars_of_interest.map( i => d[i] ) );
    //window.ef = tf.tensor(data_of_interest,null,'float32')

    window.ef = numeric.t(
            datasets.efotw.map( d => vars_of_interest.map( i => d[i] )));
    window.ef_names = vars_of_interest;

    window.ndsp = makeNDSP();

};

let makeNDSP = function(){

    let ndsp = {};

    ndsp.center_pos = [layoutWidth - layoutHeight/4, layoutHeight/4];

    ndsp.fakeAxes = [[7,7],[1,2],[5,7]];

    ndsp.scale_factor = (layoutHeight - 40)/40;

    let axes = timelineSvg.selectAll(".ndspAxes")
    .data(ndsp.fakeAxes)
    .enter()
    .append("g")
    .attr("class","ndspAxes")
    ;
    axes.append("circle")
    .attr("r",10)
    .attr("cx",(d)=> ndsp.scale_factor*d[0]+ndsp.center_pos[0])
    .attr("cy",(d)=> ndsp.scale_factor*d[1]+ndsp.center_pos[1])
    .attr("id",(d,i)=>i)
    .call(d3.drag()
        .on("start", ()=>{
            ndsp.dragged = event.target;
        })
        .on("drag", (e)=>{
            let id = ndsp.dragged.id;
            ndsp.fakeAxes[id] = numeric.add(
                    ndsp.fakeAxes[id],
                    numeric.div(
                            [e.dx,e.dy],
                            ndsp.scale_factor
                            ));

            if (numeric.norm2(ndsp.fakeAxes[id]) > 10) {
                ndsp.fakeAxes[id] = numeric.mul(10,numeric.div(
                    ndsp.fakeAxes[id],
                    numeric.norm2(ndsp.fakeAxes[id])
                    ));
            }


            let new_coord = numeric.add(numeric.mul(ndsp.scale_factor,ndsp.fakeAxes[id]), ndsp.center_pos);
            d3.select(ndsp.dragged)
            .attr("cx", new_coord[0])
            .attr("cy", new_coord[1])
            ;
            d3.select("#axline"+id)
            .attr("x2", new_coord[0])
            .attr("y2", new_coord[1])
            ;

        })
      //  .on("end", ()=>{
      //  })
    )
    .on("click",()=>{
        //.attr("cx",(d)=> ndsp.scale_factor*d[0]+ndsp.center_pos[0])
        //.attr("cy",(d)=> ndsp.scale_factor*d[1]+ndsp.center_pos[1])
    })
    ;
    axes.append("line")
    .attr("id",(d,i)=>"axline"+i)
    .attr("x1",(d)=> ndsp.center_pos[0])
    .attr("y1",(d)=> ndsp.center_pos[1])
    .attr("x2",(d)=> ndsp.scale_factor*d[0]+ndsp.center_pos[0])
    .attr("y2",(d)=> ndsp.scale_factor*d[1]+ndsp.center_pos[1])
    .attr("stroke","#000")
    ;



    ndsp.center = timelineSvg.append("circle")
    .attr("r",5)
    .attr("cx",ndsp.center_pos[0])
    .attr("cy",ndsp.center_pos[1])
    .attr("fill","#fff")
    .attr("stroke","#000")
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
  drawMap();
})
;

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

    countries.features.map( (c) => {
        c._value_ = Math.random()*(1-.1-.4)+.4;
        c.color = d3.hsl(30,0,c._value_);
        });

    let d3cou = mapBg.selectAll('.country').data(countries.features);
    d3cou
    .enter().append('path')
    .attr('class', 'country')
    .attr('fill', d=>d.color)
    .on('mouseenter', (d)=>{
        d3.select(event.target)
        //.attr("fill","sandybrown")
        //.attr("fill","peachpuff")
        .attr("fill",(d)=>d3.hsl(30,0.8,d._value_))
        ;
        d3.select(".countryTitle")
        .html(event.target.getAttribute("name"))
        ;
    })
    .on('mousemove',(d)=>{
        d3.select(".countryTitle")
        .style("left",(event.clientX-30)+"px")
        .style("top",(event.clientY+20)+"px")
        //.style("x",(event.clientX-30)+"px")
        //.style("y",(event.clientY+20)+"px")
        ;
    })
    .on('mouseleave', (d)=>{
        d3.select(event.target)
        .attr('fill', d=>d.color)
        ;
        d3.select(".countryTitle")
        .html("")
        ;
    })
    .attr("name",(d)=>{
        return( d.properties.name );
    })
    .merge(d3cou)
    .attr('d', pathGenerator)
    ;
};

// simply adding a comment to confirm I know how to push & pull
// ( it worked ! )

// export stuff for access later & in web console.
window.d3 = d3;
window.mapSvg = mapSvg;
window.timelineSvg = timelineSvg;
window.datasets = datasets;

