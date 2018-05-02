from bs4 import BeautifulSoup
import requests
import re

url = "https://www.britannica.com/topic/list-of-cities-and-towns-in-the-United-States-2023068"

site = requests.get(url)
soups = BeautifulSoup(site.content, "html.parser")

cities = soups.find_all("a", class_="md-crosslink", href=re.compile("place"))

with open('us_cities.txt', 'w') as outfile:
    for x in cities:
        outfile.write(x.text.strip() + "\n")