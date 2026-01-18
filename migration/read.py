with open("input.txt", "r") as f:
	with open("articles.txt", "a") as of:
		lines = f.read().split("\n")
		for line in lines:
			line = line.strip()
			if len(line) > 2:
				line = "<p>" + line + "</p>"
				of.write(line)
		of.write("\n")