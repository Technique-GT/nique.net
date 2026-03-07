import collections
import xml.etree.ElementTree as ET
import json
from tqdm import tqdm
from datetime import datetime
import requests
import os

import xmltodict, json

# with open('technique_all.xml', 'r') as input:
#     o = xmltodict.parse(input.read())
#     with open('rawdata.json', 'w', encoding='utf-8') as f:
#         json.dump(o, f, ensure_ascii=False, indent=4)
with open('rawdata.json', 'r') as input:
    o = json.loads(input.read())

    # do work for articles
    new_json = {"authors": [], "articles": [], "attachments": []}
    relevant_attachments = set()
    relevant_authors = set()
    for child in o["rss"]["channel"]["item"]:
        if child["wp:post_type"] == "post" and child["wp:status"] == "publish":
            # get authors, categories, tags
            authors = set()
            categories = []
            tags = []
            if "dc:creator" in child:
                authors.add(child["dc:creator"])
            wp_categories = child["category"]
            if not isinstance(wp_categories, collections.abc.Sequence):
                wp_categories = [wp_categories]
            for category in wp_categories:
                if category["@domain"] == "author":
                    authors.add(category["#text"])
                if category["@domain"] == "category":
                    categories.append(category["@nicename"])
                if category["@domain"] == "post_tag":
                    tags.append(category["@nicename"])

            # get featured image, view count
            featured_image_id = None
            view_count = None
            wp_postmeta = child["wp:postmeta"]
            if not isinstance(wp_postmeta, collections.abc.Sequence):
                wp_postmeta = [wp_postmeta]
            for item in wp_postmeta:
                if item["wp:meta_key"] == "_thumbnail_id":
                    featured_image_id = item["wp:meta_value"]
                if item["wp:meta_key"] == "nique_page_views":
                    view_count = item["wp:meta_value"]
            
            date_published = datetime.strptime(child["wp:post_date_gmt"], r"%Y-%m-%d %H:%M:%S")
            
            for cat in ["blogs", "freshman-survival-guide"]:
                if cat in categories:
                    categories.remove(cat)
            
            for cat in ["consensus-opinion", "opinions", "opinion-blog"]:
                if cat in categories:
                    categories.remove(cat)
                    if "opinion" not in categories:
                        categories.append("opinion")

            new_article = {
                "title": child["title"],
                "slug": child["wp:post_name"],
                "content": child["content:encoded"],
                "status": "published",
                "authors": list(authors),
                "categories": categories,
                "tags": tags,
                "isSticky": child["wp:is_sticky"] == "1",
                "allowComments": child["wp:comment_status"] == "open",
                "publishedAt": child["wp:post_date_gmt"],
                "updatedAt": child["wp:post_modified_gmt"]
            }
            if featured_image_id is not None:
                new_article["featuredImage"] = int(featured_image_id)
            if view_count is not None:
                new_article["viewCount"] = int(view_count)

            # if date_published > datetime(2025, 5, 10, 20, 0, 0):
            if date_published > datetime(2025, 8, 10, 20, 0, 0):
                # print(date_published)
                new_json["articles"].append(new_article)
                if featured_image_id is not None:
                    relevant_attachments.add(int(featured_image_id))
                relevant_authors = relevant_authors.union(authors)

    counter = 0
    if not os.path.exists("images"):
        os.makedirs("images")
    for child in o["rss"]["channel"]["item"]:
        if child["wp:post_type"] == "attachment" and child["wp:post_id"] is not None and int(child["wp:post_id"]) in relevant_attachments:
            new_attachment = {
                "id": int(child["wp:post_id"]),
                "url": f"https://media.nique.net/{child["wp:attachment_url"].split("/")[-1]}",
                "title": child["title"],
                "createdAt": child["wp:post_date_gmt"],
                "updatedAt": child["wp:post_modified_gmt"]
            }
            new_json["attachments"].append(new_attachment)
            # resp = requests.get(new_attachment["url"])
            # with open(f"images/{new_attachment["url"].split("/")[-1]}", "wb") as f:
            #     f.write(resp.content)
            #     counter += 1
    
    for child in o["rss"]["channel"]["wp:author"]:
        if child["wp:author_login"] in relevant_authors:
            new_attachment = {
                "username": child["wp:author_login"],
                "email": child["wp:author_email"],
                "firstName": child["wp:author_first_name"],
                "lastName": child["wp:author_last_name"]
            }
            new_json["authors"].append(new_attachment)

    with open('articles.json', 'w', encoding='utf-8') as f:
        json.dump(new_json, f, ensure_ascii=False, indent=4)

    # do work for authors
    # new_json = {"authors": []}
    # for child in o["rss"]["channel"]["wp:author"]:
    #     print(child["wp:author_login"])

# def explore(root, level=0):
#     # str = ""
#     # for _ in range(level - 1):
#     #     str += " "
#     # if len(str) > 0:
#     #     print(str, root.tag, root.attrib, root.text)
#     # else:
#     #     print(root.tag, root.attrib, root.text)
#     for child in root:
#         if root.tag == "item" and child.tag == "title":
#             print(child.text)
#         explore(child, level+2)

# tree = ET.parse('technique.xml')
# root = tree.getroot()
# explore(root)

# data = {}
# with open('data.json', 'w', encoding='utf-8') as f:
#     json.dump(data, f, ensure_ascii=False, indent=4)
