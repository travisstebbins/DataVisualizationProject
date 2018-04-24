# Import the necessary package to process data in JSON format
import json
import requests
import pymongo

stop_words = []
# Import the necessary methods from "twitter" library
from twitter import Twitter, OAuth, TwitterStream

#
# client = pymongo.MongoClient("mongodb+srv://" + MONGO_USER + ":" + MONGO_PASS + "@" + MONGO_END)
# db = client.dataviz
# tweetsCollection = db.tweets


# Scratch code for news api
NEWS_API_KEY = ""

url = ('https://newsapi.org/v2/top-headlines?'
       'country=us&'
       'category=general&'
       'apiKey=' + NEWS_API_KEY)

news_json = requests.get(url).json()

print(news_json)

queries = []
for article in news_json.get("articles"):
    title = article.get("title")
    url = article.get("url")
    url_title = ""
    longest_section_length = 0
    for section in url.split("/"):
        if len(section) > longest_section_length:
            url_title = section
    if url_title != "":
        url_title = " ".join(url_title.split("-"))
        url_title

for i, t in enumerate(titles):
    print(t)
    print(urls[i])

# oauth = OAuth(ACCESS_TOKEN, ACCESS_SECRET, CONSUMER_KEY, CONSUMER_SECRET)
#
# twitter = Twitter(auth=oauth)
# trends = twitter.trends.place(_id=23424977)
#
# trends_str = ""
# for location in trends:
#     for trend in location["trends"]:
#         trends_str += trend["name"] + ","
# trends_str = trends_str[:-1] #remove last comma
#
# # scratch code for twitter search
# # twitter = Twitter(auth=oauth)
# # crawler = twitter.search.tweets(q="#AfterTheFinalRose")
#
# # for tweet in crawler['statuses']:
# #     print(tweet['text'])
# #     print()
# twitter_stream = TwitterStream(auth=oauth)
# iterator = twitter_stream.statuses.filter(track=trends_str)
#
# for tweet in iterator:
#     tweetsCollection.insert_one(tweet)
#     print(tweetsCollection.count())
