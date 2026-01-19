import collections
import xml.etree.ElementTree as ET
import json
from tqdm import tqdm
from datetime import datetime
import requests
import os

import xmltodict, json

with open('articles.json', 'r') as input:
    o = json.loads(input.read())

    categories = set()
    for article in o['articles']:
        if len(article["categories"]) < 1:
            print("amogus")
        categories = categories.union(set(article["categories"]))
    print(categories)