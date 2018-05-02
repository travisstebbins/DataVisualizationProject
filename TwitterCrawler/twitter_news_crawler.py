import os
import json
import re
import random
import requests
import pymongo
from bs4 import BeautifulSoup
# Import the necessary methods from "twitter" library
from twitter import Twitter, OAuth, TwitterStream

stop_words = []
for line in open("stop_words.txt", "r"):
    stop_words.append(line[:-1]) # [-1] to remove new line

stop_words.append("says")
stop_words.append("exclusive")
stop_words.append("many")
stop_words.append("...")

NEWS_API_KEY = os.environ['NEWS_API_KEY']

url = ('https://newsapi.org/v2/top-headlines?'
       'country=us&'
       'category=general&'
       'apiKey=' + NEWS_API_KEY)

news_json = requests.get(url).json()

with open('news.json', 'w') as outfile:
    json.dump(news_json, outfile)

# Using google search to create a better query
def query_from_search(title):
    url = "https://www.google.com/search"
    search_param = "q="
    start_param = "start="

    pages = 1
    result_links = []
    for i in range(0, pages + 1):
        start = i * 10;
        search_string = title
        gen_url = url + "?" + search_param + "+".join(search_string.split(" ")) + "&" + start_param + str(start)

        site = requests.get(gen_url)
        soups = BeautifulSoup(site.content, "html.parser")

        result_h3 = soups.find_all("h3", class_="r")
        for h3 in result_h3:
            result_links.append(h3.find("a"))

    word_counts = {}
    for link in result_links:
        print(link.text)

    word_counts = {}
    for link in result_links:
        words = link.text.split(" ")
        for w in words:
            if word_counts.get(w) is not None:
                word_counts[w] = word_counts[w] + 1
            else:
                word_counts[w] = 1

    sorted_words = []
    for k, v in word_counts.items():
        print(str(k))
        if len(sorted_words) == 0:
            sorted_words.append([k, v])
        else:
            for i, item in enumerate(sorted_words):
                if v > item[1]:
                    sorted_words.insert(i, [k, v])
                    break
                elif i + 1 == len(sorted_words):
                    sorted_words.append([k, v])
                    break

    query = []
    for item in sorted_words:
        if item[0] not in stop_words:
            query.append(item[0])
        if len(query) >= 3:
            break

    return " ".join(query)

stories = []
queries = []
for article in news_json.get("articles"):
    story = {}
    print(article.get("title"))
    story["title"] = article.get("title")
    story["query"] = query_from_search(article.get("title"))
    queries.append(story["query"])

# OLD CODE
# ATTEMPTED TO EXTRACT AN EFFECTIVE QUERY BY COMPARING NEWS URL TO NEWS TITLE
# def query_from_title(title):
#     pattern = re.compile('[^\w\s]+')
#     alpha_title = pattern.sub('', title)
#     query = []
#     for word in alpha_title.split(" "):
#         if len(query) >= 3:
#             break
#         if word.lower() not in stop_words:
#             query.append(word)
#     return ' '.join(query)
#
# queries = []
# for article in news_json.get("articles"):
#     title = article.get("title")
#     url = article.get("url")
#     url_title = ""
#     # get the longest slash separated section of the url
#     longest_section_length = 0
#     for section in url.split("/"):
#         if len(section) > longest_section_length:
#             url_title = section
#     # construct title from url
#     if url_title != "":
#         new_title = []
#         title_parts = url_title.split("-")
#         for word in title_parts:
#             important = True
#             for num in range(0, 9):
#                 if str(num) in word:
#                     important = False
#             for stop in stop_words:
#                 if stop == word:
#                     important = False
#             if important:
#                 new_title.append(word)
#
#         url_title = " ".join(new_title)
#     # compare url title to actual title to see if it's meaningful
#     similar_count = 0
#     for word in title.split(" "):
#         for url_word in url_title.split(" "):
#             if url_word.lower() == word.lower():
#                 similar_count += 1
#     if similar_count > 2:
#         queries.append(url_title)
#
# for q in queries:
#     print(q)

# Variables that contains the user credentials to access Twitter API
ACCESS_TOKEN = os.environ['ACCESS_TOKEN']
ACCESS_SECRET = os.environ['ACCESS_SECRET']
CONSUMER_KEY = os.environ['CONSUMER_KEY']
CONSUMER_SECRET = os.environ['CONSUMER_SECRET']

oauth = OAuth(ACCESS_TOKEN, ACCESS_SECRET, CONSUMER_KEY, CONSUMER_SECRET)

twitter = Twitter(auth=oauth)

# OLD CODE
# Searching based on Twiter trends
#
# trends = twitter.trends.place(_id=23424977)
# trends_str = ""
# for location in trends:
#     for trend in location["trends"]:
#         trends_str += trend["name"] + ","
# trends_str = trends_str[:-1] #remove last comma
# query_str = trends_str

twitter_stream = TwitterStream(auth=oauth)
iterator = twitter_stream.statuses.filter(track=query_str)

MONGO_USER = os.environ['MONGO_USER']
MONGO_PASS = os.environ['MONGO_PASS']
MONGO_END = os.environ['MONGO_END']

client = pymongo.MongoClient("mongodb+srv://" + MONGO_USER + ":" + MONGO_PASS + "@" + MONGO_END)
db = client.dataviz
tweetsCollection = db.data_viz_tweets


for tweet in iterator:
    if tweet.get("coordinates") is not None or tweet.get("place") is not None:
        tweetsCollection.insert_one(tweet)
        print(tweetsCollection.count())