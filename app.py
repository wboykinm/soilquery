#!/usr/bin/env python

# http://docs.python.org/library/wsgiref.html#examples

import os
import sys
import mimetypes
from wsgiref.simple_server import make_server
from wsgiref.util import FileWrapper
import urllib2
import json
# import GDAL, numpy, matplotlib, pprint
from agoodle import AGoodle
print "agoodle activated"

def parse_qs(query):
    data = {}
    for i in urllib2.unquote(query).split("&"):
        k, v = i.split("=")
        data[k] = v
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
            response = json.dumps(params)
        else:
            response = '{"error":"nematodes without data are not sexy!"}'
    # root of app requested
    elif (path_info == '/'):
        mime = 'text/html'
        response = FileWrapper(open('index.html','rb'))
    elif (path_info == '/favicon.ico'):
        response = 'favicons are silly'
    elif (path_info == '/query/'):
        query = environ['QUERY_STRING']
        if False:# (query):
            response = 'query needed which contains wkt=something'
        else:
            # bring in the raster using agoodle:
            g = AGoodle('demo_data/clay_sub1_wgs84.tif')
            print "raster extent acquired"
            bbox = (-78.6920697, -78.6842881, 38.1767129, 38.1863279) #specifies extent
            print "bounding box established"
            arr = g.read_array_bbox()
            print "array established"
            # to feed in user-drawn polgon: wkt = """POLYGON ((-78.6920697 38.1767129, -78.6920697 38.1863279, -78.6842881 38.1863279, -78.6842881 38.1767129, -78.6920697 38.1767129))"""
            # print "polygon imported to wkt"
            # arr.mask_with_poly(wkt)
            # print "geometry acquired"
            ranges = [(0, 45), (45, 50), (50, 60), (60, 75)] # establishes data output binned classes
            cell_area = abs(g.raster_info.xsize * g.raster_info.ysize)
            for vmin, vmax in ranges:
            	subset = arr[(arr > vmin) & (arr <= vmax)]
            	print vmin, vmax, len(subset), len(subset) * cell_area
            print "agoodle-ized"
            mime = 'text/plain'
            data = {'a':'b'} # not sure what purpose this output serves
            response = json.dumps(data)
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
    # return  response
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
        
