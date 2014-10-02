/*後でまとめてリファクタリングする*/

var snapper;
var overlay = new google.maps.OverlayView();
var svgoverlay
var tourElemnt;
var googleMapProjection;
var path;
var map;

//zoomレベルごとのマーカーの表示サイズ(px)
var markerScale ={
	0:6, 1:6, 2:6, 3:8, 4:8, 5:8, 6:8, 9:14, 10:14,
	11:16,
	12:20,
	13:40,
	14:60,
	15:80,
	16:100,
	17:120,
	18:130,
	19:140,
	20:150,
	21:160	
}


/*初期化*/
snapper_init();
webix_init();
map = $$("map").map.data.map;
overlay_init();

/*起動時の読み込み*/
setTimeout(function(){
	drawTour("./_data/tetsudou.json?1");
}, 1000);

/*ルート選択(スライドメニュー)選択時のイベント*/
d3.selectAll(".tour").on("click", function(){
	console.log(this.dataset.geojsonFile);
	tourElemnt.remove();
	tourElemnt = svgoverlay.append("g");
	drawTour(this.dataset.geojsonFile);
	var latlng = this.dataset.startPoint.split(",");
	map.panTo(new google.maps.LatLng(latlng[0], latlng[1]));
	snapper.close();
})


function snapper_init(){
	snapper = new Snap({
		element: document.getElementById('snap_content')
	});	
	
	var addEvent = function addEvent(element, eventName, func) {
		if (element.addEventListener) {
			return element.addEventListener(eventName, func, false);
		} else if (element.attachEvent) {
			return element.attachEvent("on" + eventName, func);
		}
	};
	
	addEvent(document.getElementById('open-left'), 'click', function(){
		if( snapper.state().state=="left" ){
			snapper.close();
		} else {
			snapper.open('left');
		}
	});
}	

function webix_init(){
	webix.ui.fullScreen();
	var gmap_View = {
		id:"map",
		view:"google-map",
		zoom:16,
		center:[ 35.906961392699998, 139.622833797 ]
	}
	
	var detail_view = {
		id:"detail",	
		rows:[
			{ view:"button", id:"back_btn", value:"地図に戻る" },
			{
				template:'<div id="detail_content"></div>'
			}
		]
	}
	
	webix.ui({
		container:"main_view",
		animate:{type:"flip"},
		cells:[gmap_View, detail_view],
	});
	
	$$("back_btn").attachEvent("onItemClick", function(){
		$$("map").show();
	});
}


function overlay_init(){
	
	//オーバレイ追加
	overlay.onAdd = function () {

		var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "SvgOverlay");
		var svg = layer.append("svg");
		svgoverlay = svg.append("g").attr("class", "AdminDivisions");
		tourElemnt = svgoverlay.append("g")
		var defs = svg.append("defs");
		var clipPathGroup = defs.append("clipPath").attr("id", "photoClip");
		var clipPath = clipPathGroup.append("circle").attr({
			cx:0,
			cy:0,
			r:25
		})
		
		var markerOverlay = this;
		var overlayProjection = markerOverlay.getProjection();

		//Google Mapの投影法設定
		googleMapProjection = function (coordinates) {
			var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
			var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
			return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
		}
		
		//パスジェネレーター作成
        path = d3.geo.path().projection(googleMapProjection);
		
		overlay.draw = function(){};
	}
	
	//作成したSVGを地図にオーバーレイする
	overlay.setMap(map);
	
		
}

function drawTour(geojsonFIle){
	
	d3.json(geojsonFIle, function(pointjson){
		//再描画時に呼ばれるコールバック    
		overlay.draw = function () {
			var markerSize = markerScale[map.getZoom()];
			
		
			//母点位置情報
			var pointdata = pointjson.features;
			
			//ピクセルポジション情報
			var positions = [];
			 points = {"type": "LineString", "coordinates": []};
			 
			if(pointdata.length <= 0) return null;

			pointdata.forEach(function(d) {
				var b= d.geometry.coordinates;
				var a = googleMapProjection(b)
				positions.push(a);
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
				var line = tourElemnt.selectAll(".line")
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
	
			var g =tourElemnt.selectAll(".marker")
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
					//r:markerSize/4+3,
					fill:"black",
				});

				var photo = g.append("image")
				.attr({
					"xlink:href":function(d){
						if (d.properties['pdfmaps_photos'] !="") {
							var img = d.properties['pdfmaps_photos'].match(/(https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)/)[0];
						}else{
							var img = "img/noImage_s.jpg";
						}
						return img;
					},
					"clip-path":"url(#photoClip)",
				})
				.on("click", function(d){
					$$("detail").show();
					data = d.properties;
					/*todo:↓後で直す*/
					var html = "<center>";
					html += data["Name"];
					html += data["06_メモ"];
					html += "<br>";
					html += data["pdfmaps_photos"];
					document.querySelector("#detail_content").innerHTML = html;
				});
				
				
			//マーカーのサイズを調整	
			d3.selectAll("#photoClip > circle").attr("r", markerSize/4);
			d3.selectAll(".marker > circle").attr("r", markerSize/4+2);
			d3.selectAll(".marker > image").attr({
				x:-(markerSize/2),
				y:-(markerSize/2),
				"width":markerSize,
				"height":markerSize,				
			});


		};
		
		//再描画
		overlay.draw();		
	});

}

/* モバイルsafariがリンクを開くのを防ぐ */
(function (a, b, c) {
    if(c in b && b[c]) {
        var d, e = a.location,
            f = /^(a|html)$/i;
        a.addEventListener("click", function (a) {
            d = a.target;
            while(!f.test(d.nodeName)) d = d.parentNode;
            "href" in d && (d.href.indexOf("http") || ~d.href.indexOf(e.host)) && (a.preventDefault(), e.href = d.href)
        }, !1)
    }
})(document, window.navigator, "standalone");