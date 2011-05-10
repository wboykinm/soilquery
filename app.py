#!/usr/bin/env python

# http://docs.python.org/library/wsgiref.html#examples

import os
import sys
import mimetypes
from wsgiref.simple_server import make_server
from wsgiref.util import FileWrapper
import urllib2
import urllib
import json
from osgeo import osr
from agoodle import AGoodle, points_from_wkt


# ultimately this should likely be user driven...
RASTER = 'demo_data/clay_sub1_wgs84.tif'

def parse_qs(query):
    data = {}
    for i in urllib2.unquote(query).split("&"):
        k, v = i.split("=")
        data[k] = urllib.unquote_plus(v)
    return data

def application(environ, start_response):
    
    # defaults
    response = None
    status = '200 OK'
    mime = 'text/plain'

    path_info = environ['PATH_INFO']
    #http://stackoverflow.com/questions/775396/how-to-catch-post-using-wsgiref
    method = environ['REQUEST_METHOD']

    # first catch any data that is POST'ed and assume it is a query
    if (method == 'POST'):
        # http://stackoverflow.com/questions/28395/passing-post-values-with-curl
        request_body_size = int(environ['CONTENT_LENGTH'])
        query = environ['wsgi.input'].read(request_body_size)
        print 'POST query: ',query
        # parse the query string
        if query:
            params = parse_qs(query)
            #import pdb;pdb.set_trace()
            wkt = params.get('wgs84_wkt')
            if wkt:
                
                g = AGoodle(RASTER)
                
                use_wkt = True
                
                print wkt
                if use_wkt:
                    srs = osr.SpatialReference()
                    srs.ImportFromWkt(g.raster.GetProjection())
                    pts, bbox = points_from_wkt(wkt, srs, srs)
                    
                    arr = g.read_array_bbox(bbox)
                    # not working right, blows up in agoodle
                    #arr.mask_with_poly(pts, copy=False)
                else:
                    bbox = (-78.6920697, -78.6842881, 38.1767129, 38.1863279) #specifies extent
                    arr = g.read_array_bbox(bbox)
                
                cell_area = abs(g.raster_info.xsize * g.raster_info.ysize)
                result = {}
                result['sum'] = str(arr.sum())
                result['max'] = str(arr.max())
                result['min'] = str(arr.min())
                result['mean'] = str(arr.mean())
                result['data_type'] = str(arr.dtype)
                result['area'] = str(len(arr) * cell_area)
                #import pdb;pdb.set_trace()
                
                mime = 'text/plain'
                response = json.dumps(result)
                print response
            else:
                response = '{"error":"wgs84_wkt param was empty!"}'
        else:
            response = '{"error":"nematodes without data are not sexy!"}'
    elif (path_info == '/meta'):
        mime = 'text/plain'
        g = AGoodle(RASTER)
        meta = {}
        meta['extent'] = g.raster_info.extent
        meta['nx'] = g.raster_info.nx
        meta['ny'] = g.raster_info.ny
        meta['xsize'] = g.raster_info.xsize
        meta['ysize'] = g.raster_info.ysize
        response = json.dumps(meta)
        
    # root of app requested
    elif (path_info == '/'):
        mime = 'text/html'
        response = FileWrapper(open('index.html','rb'))
    elif (path_info == '/favicon.ico'):
        response = 'favicons are silly'
    else:
        # assume it is a file name
        filename = os.path.basename(path_info)
        if os.path.exists(filename):
            mime = mimetypes.guess_type(filename)
            response = FileWrapper(open(filename,'rb'))
        else:
            response = 'not found'
 
    # set headers
    headers = [('Content-Type', str(mime))]
    start_response(str(status), headers)
    # return response
    return response

def run():
    try:
        httpd = make_server('0.0.0.0', 8000, application)
        print "...Serving on localhost:8000"
        print "...use ctrl-c to quit."
        httpd.serve_forever()
    except KeyboardInterrupt:
        print '\n...nematode out, bra'
        sys.exit(0)

# if run from the command line...
if __name__ == "__main__":
    run()
