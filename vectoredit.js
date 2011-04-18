var map, vectors, controls;
var enable_gmaps = true;


function init(){

    // Options for World Map in Google Spherical Mercator Projection
    var options = { 
        maxResolution: 156543.0339,
        units: 'm',
        projection: new OpenLayers.Projection("EPSG:900913"),
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
        controls: []
        };
    
    map = new OpenLayers.Map("map", options);
    
    OpenLayers.Feature.Vector.style['default']['strokeWidth'] = '2';

    // allow testing of specific renderers via "?renderer=Canvas", etc
    var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
    renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

    vectors = new OpenLayers.Layer.Vector("Vector Layer", {
        renderers: renderer
    });

    var osm = new OpenLayers.Layer.OSM("OpenStreetMap");
    osm.attribution = "Map Data CC-BY-SA Openstreetmap.org";
                             
    map.addLayers([osm]);

    if (enable_gmaps) {
        var gphy = new OpenLayers.Layer.Google( "Google Terrain", {type: G_PHYSICAL_MAP, 'sphericalMercator': true} );
        var gmap = new OpenLayers.Layer.Google( "Google Streets", {'sphericalMercator': true});
        var ghyb = new OpenLayers.Layer.Google("Google Satellite", {type: G_HYBRID_MAP, 'sphericalMercator': true} );
        map.addLayers([ghyb, gmap, gphy]);
    }
    map.addLayers([vectors]);
    map.addControl(new OpenLayers.Control.Navigation({'zoomWheelEnabled': false}));
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.addControl(new OpenLayers.Control.PanZoom());
    map.addControl(new OpenLayers.Control.MousePosition());
    
    function report(event) {
        OpenLayers.Console.log(event.type, event.feature ? event.feature.id : event.components);
    }
    vectors.events.on({
        "beforefeaturemodified": report,
        "featuremodified": report,
        "afterfeaturemodified": report,
        "vertexmodified": report,
        "sketchmodified": report,
        "sketchstarted": report,
        "sketchcomplete": report
    });
    controls = {
        point: new OpenLayers.Control.DrawFeature(vectors,
                    OpenLayers.Handler.Point),
        line: new OpenLayers.Control.DrawFeature(vectors,
                    OpenLayers.Handler.Path),
        polygon: new OpenLayers.Control.DrawFeature(vectors,
                    OpenLayers.Handler.Polygon),
        regular: new OpenLayers.Control.DrawFeature(vectors,
                    OpenLayers.Handler.RegularPolygon,
                    {handlerOptions: {sides: 5}}),
        modify: new OpenLayers.Control.ModifyFeature(vectors)
    };
    
    for(var key in controls) {
        map.addControl(controls[key]);
    }
    
    map.setCenter(new OpenLayers.LonLat(0, 0), 3);
    document.getElementById('noneToggle').checked = true;
}

function update() {
    // reset modification mode
    controls.modify.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
    var rotate = document.getElementById("rotate").checked;
    if(rotate) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.ROTATE;
    }
    var resize = document.getElementById("resize").checked;
    if(resize) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.RESIZE;
        var keepAspectRatio = document.getElementById("keepAspectRatio").checked;
        if (keepAspectRatio) {
            controls.modify.mode &= ~OpenLayers.Control.ModifyFeature.RESHAPE;
        }
    }
    var drag = document.getElementById("drag").checked;
    if(drag) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.DRAG;
    }
    if (rotate || drag) {
        controls.modify.mode &= ~OpenLayers.Control.ModifyFeature.RESHAPE;
    }
    var sides = parseInt(document.getElementById("sides").value);
    sides = Math.max(3, isNaN(sides) ? 0 : sides);
    controls.regular.handler.sides = sides;
    var irregular =  document.getElementById("irregular").checked;
    controls.regular.handler.irregular = irregular;
}

function toggleControl(element) {
    for(key in controls) {
        var control = controls[key];
        if(element.value == key && element.checked) {
            control.activate();
        } else {
            control.deactivate();
        }
    }
}
        
