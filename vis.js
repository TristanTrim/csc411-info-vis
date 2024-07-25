

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const svg = d3.select('svg');

const projection = d3.geoNaturalEarth1();
const pathGenerator = d3.geoPath().projection(projection);

const mapBg = svg.append("g").attr("class","mapBg");
const mapOverlay = svg.append("g").attr("class","mapOverlay");

mapBg.append('path')
.attr('class', 'sphere')
.attr('d', pathGenerator({type: 'Sphere'}))
.attr('fill','grey')
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


// refcode
// needs in callback or something

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
svg.select(".mapBg") .selectAll("path[name='"+cName+"']").attr("fill","pink")
// possibly it could be more computationally efficient some other way,
// but in general d3 seems pretty optimized.
// Fine for human interaction, might chug on a bunch of automated stuff.

};



d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  .then(data => {
    datasets.worldAtlasCountries = data;
    let countries = topojson.feature(data, data.objects.countries);
    datasets.tj_worldAtlasCountries = countries;
    mapBg.selectAll('path').data(countries.features)
      .enter().append('path')
        .attr('class', 'country')
        .attr('fill', 'darkgrey')
        .on('mouseenter', ()=>{
            d3.select(event.target)
            //.attr("fill","sandybrown")
            .attr("fill","peachpuff")
            ;
            mapOverlay.select(".countryTitle")
            .text(event.target.getAttribute("name"))
            ;
        })
        .on('mousemove',()=>{
            mapOverlay.select(".countryTitle")
            .attr("x",event.clientX-30)
            .attr("y",event.clientY+20)
            ;
        })
        .on('mouseleave', ()=>{
            d3.select(event.target)
            .attr("fill","darkgrey")
            ;
            mapOverlay.select(".countryTitle")
            .text("")
            ;
        })
        .attr('d', pathGenerator)
        .attr("name",(d)=>{
            return( d.properties.name );
        })
        ;
  });

mapOverlay.append("text")
.attr("class","countryTitle")
.attr("fill","black")
.attr("z",10)
;

export { d3, svg, datasets };
