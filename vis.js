

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

d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  .then(data => {
    const countries = topojson.feature(data, data.objects.countries);
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

export { d3, svg };
