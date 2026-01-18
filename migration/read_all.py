from datetime import datetime
import json
import os


with open("authors.txt", "r") as authors:
	with open("publish_date.txt", "r") as publish_date:
		with open("section.txt", "r") as section:
			with open("subsection.txt", "r") as subsection:
				with open("caption.txt", "r") as photo_caption:
					with open("titles.txt", "r") as titles:
						with open("articles.txt", "r") as body_text:
							author_arr = authors.read().strip().split("\n")
							publish_date_arr = publish_date.read().strip().split("\n")
							section_arr = section.read().strip().split("\n")
							subsection_arr = subsection.read().strip().split("\n")
							photo_caption_arr = photo_caption.read().split("\n")
							titles_arr = titles.read().strip().split("\n")
							body_text_arr = body_text.read().strip().split("\n")
							with open("new_articles.json", "w") as output:
								ans = {"authors": [], "articles": [], "attachments": []}
								for i in range(len(author_arr)):
									author = author_arr[i].strip()
									author_split = author.split(" ")
									first_name = author_split[0] if len(author_split) == 2 else author_split[0] + " " + author_split[1]
									last_name = author_split[-1] if len(author_split) != 4 else author_split[2] + " " + author_split[3]
									ans["authors"].append({"username": author, "email": f"null{i}@temp.com", "firstName": first_name, "lastName": last_name})
								
								valid_image_ids = set()

								for i in range(len(photo_caption_arr)):
									image_name = None
									for image in os.listdir("manual_images"):
										if image.strip().split("_")[0] == str(i+1):
											image_name = image
											break
									if image_name == None:
										print("WEEWOOWEEWOO")
									if "placeholder" in image_name:
										continue
									ans["attachments"].append({
										"id": int(i+1),
										"url": f"https://media.nique.net/{image_name.replace(" ", "%20")}",
										"title": photo_caption_arr[i].strip(),
										"caption": photo_caption_arr[i].strip(),
										"createdAt": str(datetime.now()).split(".")[0],
										"updatedAt": str(datetime.now()).split(".")[0]
									})
									valid_image_ids.add(int(i+1))
								
								for i in range(len(body_text_arr)):
									record = {
										"title": titles_arr[i],
										"slug": titles_arr[i],
										"content": body_text_arr[i],
										"status": "published",
										"authors": [
											author_arr[i].strip()
										],
										"categories": [
											section_arr[i].strip()
										],
										"subcategories": [
											
										],
										"isSticky": False,
										"allowComments": True,
										"publishedAt": str(datetime.strptime(publish_date_arr[i], "%-m/%-d/%y")).split(".")[0],
										"updatedAt": str(datetime.strptime(publish_date_arr[i], "%-m/%-d/%y")).split(".")[0],
										"featuredImage": None if (i+1) not in valid_image_ids else (i+1),
										"tags": []
									}

									if len(subsection_arr[i].strip()) > 1:
										record["subcategories"].append({"category": section_arr[i].strip(), "value": subsection_arr[i].strip()})
									
									ans["articles"].append(record)

								json.dump(ans, output, ensure_ascii=False, indent=4)
