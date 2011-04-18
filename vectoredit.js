var map, vectors, controls;
        function init(){
            map = new OpenLayers.Map('map');
            var wms = new OpenLayers.Layer.WMS( "OpenLayers WMS", 
                "http://vmap0.tiles.osgeo.org/wms/vmap0?", {layers: 'basic'}); 
            OpenLayers.Feature.Vector.style['default']['strokeWidth'] = '2';
 
            // allow testing of specific renderers via "?renderer=Canvas", etc
            var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
            renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;
 
            vectors = new OpenLayers.Layer.Vector("Vector Layer", {
                renderers: renderer
            });
 
            map.addLayers([wms, vectors]);
            map.addControl(new OpenLayers.Control.LayerSwitcher());
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
        
