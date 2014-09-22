d3.json('./_data/saitama.geojson?1', function(pointjson){
	main(pointjson); 
});

function main(pointjson) {
 
	var  style_array_from_above_here = [{"stylers":[{"saturation":-100},{"gamma":1}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"visibility":"simplified"}]},{"featureType":"water","stylers":[{"visibility":"on"},{"saturation":50},{"gamma":0},{"hue":"#50a5d1"}]},{"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#333333"}]},{"featureType":"road.local","elementType":"labels.text","stylers":[{"weight":0.5},{"color":"#333333"}]},{"featureType":"transit.station","elementType":"labels.icon","stylers":[{"gamma":1},{"saturation":50}]}];   

	//Google Map 初期化
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 16,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		styles: style_array_from_above_here,
		center: { lat: 35.906961392699998, lng: 139.622833797 },       
	});

		
	var overlay = new google.maps.OverlayView(); //OverLayオブジェクトの作成

	//オーバレイ追加
	overlay.onAdd = function () {

		var layer = d3.select(this.getPanes().floatPane).append("div").attr("class", "SvgOverlay");
		var svg = layer.append("svg");
		var svgoverlay = svg.append("g").attr("class", "AdminDivisions");
		var defs = svg.append("defs");
		var clipPath = defs.append("clipPath").attr("id", "photoClip");
		clipPath.append("circle").attr({
			cx:0,
			cy:0,
			r:35
		})
		
		var markerOverlay = this;
		var overlayProjection = markerOverlay.getProjection();

		//Google Mapの投影法設定
		var googleMapProjection = function (coordinates) {
			var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
			var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
			return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
		}
		
		//パスジェネレーター作成
        path = d3.geo.path().projection(googleMapProjection);　
			
			
		//再描画時に呼ばれるコールバック    
		overlay.draw = function () {

			//母点位置情報
			var pointdata = pointjson.features;
			
			//ピクセルポジション情報
			var positions = [];
			 points = {"type": "LineString", "coordinates": []};

			pointdata.forEach(function(d) {		
				positions.push(googleMapProjection(d.geometry.coordinates));
				points.coordinates.push([d.geometry.coordinates[0], d.geometry.coordinates[1]]);
			});
			

			    //ライン追加
				var lineAttr = {
						"class":"line",
						"d": path,
						"fill": "none",
						"stroke": "green",
						"stroke-width": 6
					}
				var line = svgoverlay.selectAll(".line")
					.data([points])
					.attr(lineAttr)	
					.enter()
					.append("path")
					.attr(lineAttr);	

	
	
			var gAttr ={
				"class": "marker",
				"transform": function(d, i){
					return "translate("+[positions[i][0], positions[i][1]]+")";
				}
				
			}
	
			var g =svgoverlay.selectAll(".marker")
				.data(pointdata)
				.attr(gAttr)
				.enter()
				.append("g")
				.attr(gAttr)
				.on("click", function(){
					var p = d3.select(this).data().shift().properties;
					//alert(JSON.stringify(p, " ", "\n"))
				});

				g.append("circle")
				.attr({
					cx:0,
					cy:0,					
					r:38,
					fill:"black",
				});

				g.append("image")
				.attr({
					"xlink:href":function(d){
						var img = d.properties['pdfmaps_photos'].match(/(https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)/)[0];
						return img;
					},
					x:-60,
					y:-60,
					"width":120,
					"height":120,
					"clip-path":"url(#photoClip)",
				});

	  
		};

	};

	//作成したSVGを地図にオーバーレイする
	overlay.setMap(map);
	
		
};