#!/usr/bin/env python

# http://docs.python.org/library/wsgiref.html#examples

import os
import mimetypes
from wsgiref.simple_server import make_server
from wsgiref.util import FileWrapper
import urllib2
import json
# import GDAL, numpy, matplotlib, pprint
from agoodle import AGoodle 

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
    # root of app requested
    if (path_info == '/'):
        mime = 'text/html'
        response = FileWrapper(open('index.html','rb'))
    elif (path_info == '/favicon.ico'):
        response = 'favicons are silly'
    elif (path_info == '/query/'):
        query = environ['QUERY_STRING']
        if False:# (query):
            response = 'query needed which contains wkt=something'
        else:
            # parse the query string
            # params = parse_qs(query)
            # print params
            # get a polygon geometry
            # valid wkt parameter
            # agoodle here!
            # open a tif
            g = AGoodle('demo_data/clay_sub1_utm.tif')
            g.raster_info.extent
            print "raster extent acquired"
            wkt = """POLYGON ((-78.6920697 38.1767129, -78.6920697 38.1863279, -78.6842881 38.1863279, -78.6842881 38.1767129, -78.6920697 38.1767129))"""
            print "geometry acquired"
            # summarize tiff based on geometry
            summary = g.summarize_wkt(wkt)
            print "agoodle-ized"
            pprint.pprint(summary)
            print "summary printed"
            mime = 'text/plain'
            data = {'a':'b'}
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

httpd = make_server('', 8000, application)
print "Serving on port 8000..."
httpd.serve_forever()
