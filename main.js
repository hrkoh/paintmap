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

const vector = new ol.layer.Vector({
  source: source,
});
vector.set('name', 'vector');

const map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  controls: ol.control.defaults().extend([new ol.control.ScaleLine()]),
  loadTilesWhileAnimating: true,
  view: new ol.View({
    projection: "EPSG:3857",
    center: ol.proj.transform([138.7313889, 35.3622222], "EPSG:4326", "EPSG:3857"),
    maxZoom: 18,
    zoom: 5
  }),
});

let draw; // global so we can remove it later
var rec = false;

function addInteraction() {
  draw = new ol.interaction.Draw({
    source: source,
    type: "LineString",
    freehand: true,
//    style: new ol.style.Style({
//      stroke: new ol.style.Stroke({
//        color: '#ff0000',
//        width: 3.5
//      })
//    })
  });
  map.addInteraction(draw);
}

function removeInteraction() {
  map.removeInteraction(draw);
}

var recBtn = document.getElementById('recBtn');
recBtn.addEventListener('click', function() {
  if (rec) {
    removeInteraction();
    recBtn.style.setProperty("border-radius","50%");
    rec = false;
  } else {
    addInteraction();
    recBtn.style.setProperty("border-radius","10%");
    rec = true;
  }
}, false);

var saveBtn = document.getElementById('saveBtn');
saveBtn.addEventListener('click', function() {
  alert("1")
  var features = source.getFeatures();
  var json = new ol.format.GeoJSON().writeFeatures(features);
  var blob = new Blob([json], {type : 'application/json'});
  saveAs(blob, 'paintmap.json');
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
