import re
import json
from flask import render_template, request, make_response
import httplib2
import json
import predix.data.asset
from . import dashboard

asset = predix.data.asset.Asset()

def natural_sort(l):
    """
    Sort alpha-naturally so N10 comes after N2.
    """
    convert = lambda text: int(text) if text.isdigit() else text.lower()
    alphanum_key = lambda key: [ convert(c) for c in re.split('([\d]+)', key['val']) ]
    return sorted(l, key=alphanum_key)

# Genereate simple response for GET request
# message: displayed string
# code: status code
def generateResponse(message, code):
    response = make_response(json.dumps(message), code)
    response.headers['Content-Type'] = 'application/json'
    return response

@dashboard.route('/')
def home():
    """
    For root route we display a simple volcano dashboard to view node and
    sensor data in a time series graph.
    """
    # Query the node assets we tracked
    nodes = []
    default_node = ''
    default_node_name = ''
    node_id = ''
    sensor_tags = 'HUMA,TCA' # Default sensors
    for node in asset.get_collection('/node'):
        nodes.append({
            "key": node['uri'],
            "val": node['name']
            })
        if node['name'] == 'N10':
            default_node = node['uri']
            default_node_name = node['name']
            node_id = default_node.split("/")[-1] # get node id from uri

    # Query the sensor assets we tracked
    sensors = []
    for sensor in asset.get_collection('/datatype'):
        sensors.append({
            "key": sensor['tag'],
            "val": sensor['data_type'] + " (%s)" % (sensor['tag'])
            })

    # Render the dashboard jinja2 template
    return render_template('home.html',
            sensors=json.dumps(natural_sort(sensors)),
            default_node=default_node,
            default_node_name=default_node_name,
            node_id=node_id,
            sensor_tags=sensor_tags,
            nodes=json.dumps(natural_sort(nodes))) 

@dashboard.route('/node/<node_id>/<sensor_tags>/', methods=['GET'])
def node(node_id, sensor_tags):
    """
    For this route we display a simple volcano dashboard to view specified node and
    sensor data in a time series graph.
    """
    # Query the node assets we tracked
    nodes = []
    default_node = ''
    default_node_name = ''
    is_valid_node_id = False # used to validate node_id
    sensor_tags_lst = sensor_tags.split(",") # store sensor ids  as list
    node_uri = '/node/' + node_id
    for node in asset.get_collection('/node'):
        nodes.append({
            "key": node['uri'],
            "val": node['name']
            })
        if node['name'] == 'N10':
            default_node = node['uri']
        if node_uri == node['uri']: # if node uri matched then node id is valid
            is_valid_node_id = True
            default_node = node_uri
            default_node_name = node['name']

    if not is_valid_node_id:
        return generateResponse("Invalid node id", 401)

    # Query the sensor assets we tracked
    sensors = []
    for sensor in asset.get_collection('/datatype'):
        sensors.append({
            "key": sensor['tag'],
            "val": sensor['data_type'] + " (%s)" % (sensor['tag'])
            })
        if sensor['tag'] in sensor_tags_lst: # Remove valid tag
            sensor_tags_lst.remove(sensor['tag'])

    if sensor_tags_lst != []: # sensor tag lists is not empty --> has invalid tags
        return generateResponse("Invalid sensor tag", 401)

    # Render the dashboard jinja2 template
    return render_template('home.html',
            sensors=json.dumps(natural_sort(sensors)),
            default_node=default_node,
            default_node_name=default_node_name,
            node_id=node_id,
            sensor_tags=sensor_tags,
            nodes=json.dumps(natural_sort(nodes))) 
