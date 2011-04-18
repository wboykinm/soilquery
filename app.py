#!/usr/bin/env python

# http://docs.python.org/library/wsgiref.html#examples

import os
import mimetypes
from wsgiref.simple_server import make_server
from wsgiref.util import FileWrapper
import urllib2
import json

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
        if not (query):
            response = 'query needed which contains wkt=something'
        else:
            # parse the query string
            params = parse_qs(query)
            print params
            # valid wkt parameter
            # validate the polygon value
            # then think about next steps
            # agoodle here!
            # get a polygon geometry
            # open a tif
            # summarize tiff based on geometry
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