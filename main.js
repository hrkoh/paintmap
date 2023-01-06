// カラーコードをカラーに変換するための配列
const colorlist = {
  "#000000":"black",
  "#808080":"gray",
  "#0000ff":"blue",
  "#008000":"green",
  "#00ff00":"lime",
  "#ffff00":"yellow",
  "#ffa500":"orange",
  "#a52a2a":"brown",
  "#ff0000":"red",
  "#ffc0cb":"pink",
  "#ff00ff":"magenta",
  "#800080":"purple"
};

// 図形を採番するための変数
var featureId = 0;

var currentTile = 0;

var mapTile = [
  chiriinHakuchizuTile = new ol.layer.Tile({
    source: new ol.source.XYZ({
      attributions: [
        new ol.Attribution({
          html: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル（淡色地図）</a>"
        })
      ],
      url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
      projection: "EPSG:3857"
    })
  }),
  chiriinZenkokuSaishinShashinTile = new ol.layer.Tile({
    source: new ol.source.XYZ({
      attributions: [
        new ol.Attribution({
          html: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル（全国最新写真（シームレス））</a>"
        })
      ],
      url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
      projection: "EPSG:3857"
    })
  }),
  chiriinIrobetsuhyokozuTile = new ol.layer.Tile({
    source: new ol.source.XYZ({
      attributions: [
        new ol.Attribution({
          html: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル（色別標高図）「海域部は海上保安庁海洋情報部の資料を使用して作成」</a>"
        })
      ],
      url: "https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png",
      projection: "EPSG:3857"
    })
  }),
  chiriinIneikifukuzuTile = new ol.layer.Tile({
    source: new ol.source.XYZ({
      attributions: [
        new ol.Attribution({
          html: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル（標高タイル（基盤地図情報 数値標高モデル））</a>"
        })
      ],
      url: "https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png",
      projection: "EPSG:3857"
    })
  }),
  osmTile = new ol.layer.Tile({
    source: new ol.source.XYZ({
      attributions: "© <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
      url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
    })
  }),

];

const raster = new ol.layer.Tile({
  source: new ol.source.XYZ({
    attributions: [
      new ol.Attribution({
        html: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
      })
    ],
    url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    projection: "EPSG:3857"
  })
});

const source = new ol.source.Vector({wrapX: false});

var vector = new ol.layer.Vector({
  source: source,
});
vector.set('name', 'vector');

const map = new ol.Map({
  layers: [mapTile[currentTile], vector],
  target: 'map',
  controls: ol.control.defaults().extend([new ol.control.ScaleLine()]),
  loadTilesWhileAnimating: true,
  view: new ol.View({
    projection: "EPSG:3857",
    center: ol.proj.transform([138.7313889, 35.3622222], "EPSG:4326", "EPSG:3857"),
    maxZoom: 18,
    zoom: 5
  }),
  interactions: ol.interaction.defaults({
    mouseWheelZoom: false
  })
});

var mouseWheelInt = new ol.interaction.MouseWheelZoom();
map.addInteraction(mouseWheelInt);

mouseWheelInt.setActive(true);

let draw; // global so we can remove it later
var rec = false;
var erase = false;

function addInteraction() {
  draw = new ol.interaction.Draw({
    source: source,
    type: "LineString",
    freehand: true,
  });
  map.addInteraction(draw);

  draw.on('drawstart', function(e){
    var strokeColor = document.getElementById('strokeColor').value;
    var labelEdgeColor;
    switch(strokeColor){
      case '#00ff00':
      case '#ffff00':
      case '#ffc0cb':
        labelEdgeColor = '#000000';
        break;
      default:
        labelEdgeColor = '#ffffff';
        break;
    }

    e.feature.setStyle(
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: strokeColor,
          width: document.getElementById('strokeWidth').value
        }),
        text: new ol.style.Text({
//          textAlign: "Start",
          textBaseline: "middle",
          font: "Bold 20px/1 Arial",
          text: String(featureId + 1),
          fill: new ol.style.Fill({color: strokeColor}),
          stroke: new ol.style.Stroke({color: labelEdgeColor, width: "2"}),
          offsetX: "0",
          offsetY: "0",
          placement: "Point",
//          maxAngle: "45°",
          overflow: "False",
//          rotation: "0°",
        })
      })
    );
  });
  
  // 図形描画後の処理
  draw.on('drawend', function(e){
    var shape = e.feature.getGeometryName();
    e.feature.set('shape', shape);
    // IDを設定する
    e.feature.setId(++featureId);
    // カラーとサイズを設定する
    e.feature.set('color', colorlist[document.getElementById('strokeColor').value]);
    e.feature.set('colorcode', document.getElementById('strokeColor').value);
    e.feature.set('width', document.getElementById('strokeWidth').value);
  });
}

function removeInteraction() {
  map.removeInteraction(draw);
}

var select;
var selectedFeatures;

var openBtn = document.getElementById('openBtn');
var saveBtn = document.getElementById('saveBtn');
var recBtn = document.getElementById('recBtn');
var eraserImg = document.getElementById('eraserImg');
function eraseFeature(event) {
  if (erase) {
    map.removeInteraction(select);
    addInteraction();
    eraserImg.src = 'icon_R_0405.png'
    erase = false;
  } else {
    removeInteraction();
    select = new ol.interaction.Select({
      layers: [vector],
    });
    selectedFeatures = select.getFeatures();
    selectedFeatures.on('change:length', function(){
      if (selectedFeatures.getLength() > 0) {
        selectedFeatures.forEach(function(feature){
          source.removeFeature(feature);
        });
        selectedFeatures.clear();
      }
    });
    map.addInteraction(select);
    eraserImg.src = 'icon_R_0405_active.gif'
    erase = true;
  }
}
recBtn.addEventListener('click', function() {
  if (rec) {
    if (erase) {
      map.removeInteraction(select);
      erase = false;
    }
    removeInteraction();
    mouseWheelInt.setActive(true);
    saveBtn.disabled = false;
    openBtn.disabled = false;
    recBtn.style.setProperty("border-radius","50%");
    eraserImg.removeEventListener('click', eraseFeature, false);
    eraserImg.src = 'icon_R_0405.png'
    rec = false;
  } else {
    addInteraction();
    mouseWheelInt.setActive(false);
    saveBtn.disabled = true;
    openBtn.disabled = true;
    recBtn.style.setProperty("border-radius","10%");
    eraserImg.addEventListener('click', eraseFeature, false);
    rec = true;
  }
}, false);

saveBtn.addEventListener('click', function() {
  var features = source.getFeatures();
  var date = new Date();
  var datestr = date.toISOString().replace(/[^0-9]/g, '').slice(0, -5);
  var json = new ol.format.GeoJSON({
    dataProjection: "EPSG:4326",
    featureProjection: "EPSG:3857"
  }).writeFeatures(features);
  var blob = new Blob([json], {type : 'application/json'});
  saveAs(blob, 'paintmap_' + datestr + '.json');
}, false);

saveBtn.addEventListener('click', function() {

}, false);

var strokeWidth = document.getElementById('strokeWidth');
strokeWidth.addEventListener('change', function() {


}, false);

var strokeColor = document.getElementById('strokeColor');
strokeColor.addEventListener('change', function() {


}, false);

var tileSelect = document.getElementById('tileSelect');
tileSelect.addEventListener('change', function() {
  map.removeLayer(mapTile[currentTile]);
  currentTile = tileSelect.value;
  map.getLayers().insertAt(0, mapTile[currentTile]);
}, false);

// popup
var popup = new ol.Overlay.Popup();
map.addOverlay(popup);
// Instantiate with some options and add the Control
var geocoder = new Geocoder('nominatim', {
  provider: 'osm',
  lang: 'jp',  // 使用言語（英語は'en'）
  placeholder: '検索：',   // 'Search for ...',
  limit: 5,
  debug: false,
  autoComplete: true,
  keepOpen: true
});
map.addControl(geocoder);
// Listen when an address is chosen
geocoder.on('addresschosen', function (evt) {
    var center_point = new ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
    console.info(evt);
    window.setTimeout(function () {
    popup.show(evt.coordinate, evt.address.formatted);
// 位置情報表示の場合上の1行を下記と置き換える
//  var coord = new ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
//  var location = evt.address.formatted + "</br>" + ol.coordinate.toStringHDMS(coord);
//  popup.show(evt.coordinate, location);
  }, 3000);
  map.getView().setCenter(new ol.proj.fromLonLat(center_point));
  map.getView().setZoom(16);
});

