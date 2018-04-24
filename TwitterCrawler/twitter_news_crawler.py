import os
import json
import requests
import pymongo
# Import the necessary methods from "twitter" library
from twitter import Twitter, OAuth, TwitterStream

# stop_words = []
# for line in open("stop_words.txt", "r"):
#     stop_words.append(line)

# NEWS_API_KEY = os.environ['NEWS_API_KEY']
#
# url = ('https://newsapi.org/v2/top-headlines?'
#        'country=us&'
#        'category=general&'
#        'apiKey=' + NEWS_API_KEY)
#
# news_json = requests.get(url).json()
#
# print(news_json)

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

#
# Searching based on Twiter trends
#
trends = twitter.trends.place(_id=23424977)
trends_str = ""
for location in trends:
    for trend in location["trends"]:
        trends_str += trend["name"] + ","
trends_str = trends_str[:-1] #remove last comma
query_str = trends_str

twitter_stream = TwitterStream(auth=oauth)
iterator = twitter_stream.statuses.filter(track=query_str)

MONGO_USER = os.environ['MONGO_USER']
MONGO_PASS = os.environ['MONGO_PASS']
MONGO_END = os.environ['MONGO_END']

client = pymongo.MongoClient("mongodb+srv://" + MONGO_USER + ":" + MONGO_PASS + "@" + MONGO_END)
db = client.dataviz
tweetsCollection = db.new_tweets

for tweet in iterator:
    if tweet.get("coordinates") is not None or tweet.get("place") is not None:
        tweetsCollection.insert_one(tweet)
        print(tweetsCollection.count())
