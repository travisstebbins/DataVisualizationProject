import requests
import json
import os
import nltk
from nltk import ne_chunk, pos_tag, word_tokenize
from nltk.tree import Tree

PLACES_API = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_API_KEY = os.environ['PLACES_API_KEY']

Tweets_File = "tweets.json"

def extract_location_query(tweet):
    chunked = ne_chunk(pos_tag(word_tokenize(tweet)))
    continuous_chunk = []
    current_chunk = []
    for i in chunked:
        if type(i) == Tree:
            current_chunk.append(" ".join([token for token, pos in i.leaves()]))
        elif current_chunk:
            named_entity = " ".join(current_chunk)
            if named_entity not in continuous_chunk:
                continuous_chunk.append(named_entity)
                current_chunk = []
    return "+".join(continuous_chunk)


def google_places_query(query):
    region_param = "region=us"
    query_param = "query=" + query
    key_param = "key=" + PLACES_API_KEY
    url = PLACES_API + "?" + region_param + "&" + query_param + "&" + key_param
    # get the response
    response = requests.get(url)
    json_response = response.json()
    # get the lat and lng of the first response
    if len(json_response.get("results")) > 0:
        # print(True)
        result = json_response.get("results")[0]
        location = result.get("geometry").get("location")
        formatted_address = result.get("formatted_address")
        if formatted_address is not None and len(formatted_address.split(",")) > 2:
            city = formatted_address.split(",")[-2].strip()
            state = formatted_address.split(",")[-1].strip()[0:2]
        else:
            city = ""
            state = ""
        name = result.get("name")
        return {"lat": location["lat"], "lng": location["lng"], "name": name, "city": city, "state": state}
    else:
        # print(False)
        return False


def extract_tweet_location(tweet):
    if tweet.get("coordinates") is not None:
        location = tweet["coordinates"]["coordinates"]
        lat = location[1]
        lng = location[0]
        name = "precise_location"
    else:
        box = tweet["place"]["bounding_box"]["coordinates"][0]
        lat = (box[1][1] + box[2][1])/2
        lng = (box[0][0] + box[1][0])/2
        name = tweet["place"]["name"]
    return {"lat": lat, "lng": lng, "name": name}

tweets = json.load(open(Tweets_File))
output = []
# process the tweets
for tweet in tweets:
    if tweet.get("coordinates") is not None or tweet.get("place") is not None:
        print(True)
        src = extract_tweet_location(tweet)
        query = extract_location_query(tweet["text"])
        print(query)
        dest = google_places_query(query)
        if dest is not False:
            text = tweet["text"]
            time = tweet["created_at"]
            output.append({"source": {
                                "lat": src.get("lat"),
                                "lng": src.get("lng"),
                                "name": src.get("name")},
                           "destination": {
                                "lat": dest.get("lat"),
                                "lng": dest.get("lng"),
                                "name": dest.get("name"),
                                "city": dest.get("city"),
                                "state": dest.get("state")},
                           "text": text,
                           "time": time})

# write the result
with open('data.json', 'w') as outfile:
    json.dump(output, outfile)
