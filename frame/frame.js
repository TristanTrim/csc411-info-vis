
window.addPictureFrame = function(){
  //let fimg = svg.append("image")
  //.attr("href","./frame/frame.png")
  //.attr("preserveAspectRatio","none")
  //.style("transform","rotate(90deg)")
  //.style("pointer-events", "none")
  //.attr("y","-960px")
  //.attr("height","960px")
  //.attr("width","500px") 
  //;
  let fimg = d3.select("body").append("img")
  .style("preserveAspectRatio","none")
  .attr("src","./frame/frame.png")
  .style("position","fixed")
  .style("transform","rotate(90deg)")
  .style("width",window.innerHeight+"px" ) 
  .style("height",window.innerWidth+"px" ) 
  .style("top",(-window.innerWidth+window.innerHeight)/2+"px")
  .style("left",(-window.innerHeight+window.innerWidth)/2+"px")
  .style("pointer-events", "none")
  ;
  addEventListener("resize", (event) => {
    setTimeout(()=>{
      fimg
      .transition()
      .duration(500)
      .ease(d3.easeBounceOut)
      .style("width",window.innerHeight+"px" ) 
      .style("height",window.innerWidth+"px" ) 
      .style("top",(-window.innerWidth+window.innerHeight)/2+"px")
      .style("left",(-window.innerHeight+window.innerWidth)/2+"px")
      ;
    },500);
  });
};
