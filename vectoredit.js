var map, polygons, controls;
var enable_gmaps = true;
var feature;

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

    //this script doesn't seem to give a damn what's specified for an extent or centroid
    // center = new OpenLayers.LonLat(2002637.64,5008738.43);
            
    OpenLayers.Feature.Vector.style['default']['strokeWidth'] = '1';

    // allow testing of specific renderers via "?renderer=Canvas", etc
    var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
    renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

    polygons = new OpenLayers.Layer.Vector("Vector Layer", {
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
    map.addLayers([polygons]);
    map.addControl(new OpenLayers.Control.Navigation({'zoomWheelEnabled': false}));
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.addControl(new OpenLayers.Control.PanZoom());
    map.addControl(new OpenLayers.Control.MousePosition());
    
    function handle_geometry(event) {
        //OpenLayers.Console.log(event.type, event.feature ? event.feature.id : event.components);
        //alert('hey')
        //feature = event;
        //console.log(event);
        var wkt = event.feature.geometry.toString();
        alert(wkt);
    }

    function post_geometry(event) {
        feature = event;
        // merc bounds and polygon
        var g = event.feature.geometry;
        g.calculateBounds();
        var merc_bbox = g.bounds.toBBOX();
        var merc_wkt = g.toString();
        
        // now transform
        var geometry = g.clone();
        
        // no worky
        //geometry.calculateBounds();
        // from spherical mercator to wgs 84
        geometry.transform(map.projection, map.displayProjection);

        var wgs84_wkt = geometry.toString();
        // wtf?
        // TypeError: Result of expression 'geometry.bounds' [null] is not an object.
        //var wgs84_bbox = geometry.bounds.toBBOX();
        
        jQuery.ajax({
            type: "POST",
            url: "/can_be_anything_right_now/",
            data: {'merc_wkt':merc_wkt,
                   'merc_bbox':merc_bbox,
                   'wgs84_wkt':wgs84_wkt,
                   //'wgs84_bbox':wgs84_bbox,
                   },
            dataType: 'json',
            success: function(response, textStatus, XMLHttpRequest){
                //console.log(response);
                //alert(response);
                jQuery('#results')[0].innerHTML = 'Calculation Results: ' + JSON.stringify(response) + ' Soil Characteristics';
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert('error dude: ' + textStatus + ' ' + errorThrown);
            },
        });
    }


    function zoom_to_raster() {
        jQuery.ajax({
            type: "GET",
            url: "/meta",
            dataType: 'json',
            success: function(response, textStatus, XMLHttpRequest){
                var e = response.extent;
                var wgs84_bounds = new OpenLayers.Bounds(e[0],e[1],e[2],e[3]);
                console.log(wgs84_bounds);
                var merc_bounds = wgs84_bounds.transform(map.displayProjection,map.projection);
                console.log(merc_bounds);
                map.zoomToExtent(merc_bounds);
                map.zoomOut() // zoom back out one step
                // http://dev.openlayers.org/sandbox/pinch/examples/boxes.html
                var boxes  = new OpenLayers.Layer.Boxes( "Raster Box" );
                var box = new OpenLayers.Marker.Box(merc_bounds);
                box.events.register("click", box, function (e) {
                        this.setBorder("yellow");
                });
                boxes.addMarker(box);
                map.addLayers([boxes]);
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert('could not zoom to raster extent, so defaulting to null island... ');
                map.setCenter(new OpenLayers.LonLat(0, 0), 5);
            },
        });
    }
        
    polygons.events.on({
        //"beforefeaturemodified": post_geometry,
        "featuremodified": post_geometry,
        //"afterfeaturemodified": post_geometry,
        //"vertexmodified": post_geometry,
        //"sketchmodified": post_geometry,
        //"sketchstarted": post_geometry,
        "sketchcomplete": post_geometry
    });

    controls = {
        polygon: new OpenLayers.Control.DrawFeature(polygons,
                    OpenLayers.Handler.Polygon),
        modify: new OpenLayers.Control.ModifyFeature(polygons)
    };
    
    for(var key in controls) {
        map.addControl(controls[key]);
    }
    
    // try to zoom to the raster
    zoom_to_raster();
    
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    
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
        
