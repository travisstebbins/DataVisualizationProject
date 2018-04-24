# Import the necessary package to process data in JSON format
from bson.json_util import dumps
import os
import pymongo
from random import *
# Import the necessary methods from "twitter" library
from twitter import Twitter, OAuth, TwitterStream

MONGO_USER = os.environ['MONGO_USER']
MONGO_PASS = os.environ['MONGO_PASS']
MONGO_END = os.environ['MONGO_END']

client = pymongo.MongoClient("mongodb+srv://" + MONGO_USER + ":" + MONGO_PASS + "@" + MONGO_END)
db = client.dataviz
tweetsCollection = db.new_tweets

tweets = list(tweetsCollection.find())
print(len(tweets))

# write the result
with open('tweets.json', 'w') as outfile:
    outfile.write(dumps(tweets))