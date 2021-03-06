# soilquery readme
2011-04-17
Bill Morris

# Project Components
## Input Data
Soil chemistry and biophysical data provided by ground surveys or by any publicly-available soil data source. The initial format is 1-meter resolution .tif raster, of which there are about 80 layers representing everything from nitrogen content to soil texture at various horizons.
## GUI
A web map interface based on [probably google] aerial imagery, with a really basic toolkit. A user should be able to select a drawing tool and a desired soil characteristics layer, sketch a "management boundary" (for instance a paddock she wants to plant with alfalfa for the coming year), and hit a "calculate" button. The result should then be a report, telling the user how big the paddock is, along with mean, minimum and maximum values for the selected raster within the geometry of the polygon. Ideally, the user should be able to come back to the page in the future and compare past years' management boundaries and results through the toolkit.

# Workflow
## Drawing a polygon
User draws vector polygon on Google Maps API v3 imagery:
## Passing the geometry
Polygon geometry is passed to a database, also stored there for future graphic retrieval
## Agoodle query

Polygon is used to query soil raster data stored in the same database via agoodle (https://github.com/brentp/agoodle)
agoodle requirements include:

      $ git clone git://github.com/brentp/agoodle.git
      $ cd agoodle
      $ sudo python setup.py install
      $ sudo apt-get install python-matplotlib
## Query result storage
Calculation results are stored in the database associated with the polygon
## To-User onscreen query output
Results are written to a neat-looking report onscreen for the user, perhaps with a bar chart graphic and/or an option to download an .xls.
