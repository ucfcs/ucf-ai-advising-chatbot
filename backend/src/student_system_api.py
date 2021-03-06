from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo
from pymongo import MongoClient
from pymongo import ReturnDocument
import traceback
from database_manager import form_response, add_unseen, inc_num_of_questions_asked, inc_num_questions_answered_correctly, inc_num_times_referred_to_advisor, get_contact


# from ...ai import chatbot
from chatbot import predict

app = Flask(__name__)
CORS(app)

# connecting to the database
app.config["MONGO_DBNAME"] = "knugdb"  #'ourDB' <-- local connection
app.config[
    "MONGO_URI"
] = "mongodb://localhost:27017/knugdb"  #'mongodb://localhost:27017/ourDB' <-- local connection
# The "dnspython" module must be installed to use mongodb+srv:
mongo = PyMongo(app)
new_response = "Hello"

# Home page
@app.route("/")
def home():
    return "Home Page"


#PUT request to add 1 to metric 4
@app.route("/increment-metric-4", methods =["PUT"])
def add_metric_4():
    result = inc_num_times_referred_to_advisor(mongo)
    return jsonify("count updated for metric 4")

#PUT request to add 1 to metric 3
@app.route("/increment-metric-3", methods =["PUT"])
def add_metric_3():
    result = inc_num_questions_answered_correctly(mongo)
    return jsonify("count updated for metric 3")


#PUT request to add 1 to metric 2
@app.route("/increment-metric-2", methods =["PUT"])
def add_metric_2():
    result = inc_num_of_questions_asked(mongo)
    return jsonify("count updated for metric 2")

# POST request to add 1 to count in "Number of questions asked" stat
@app.route("/save-question-asked", methods = ["POST"])
def add_question():
    question = request.get_json()
    question_confirmation = add_unseen(mongo, question)
    if question_confirmation != None:
        return jsonify({"confirmation": question_confirmation})
    return "sorry question confirmation is empty"

# POST request to store form responses
@app.route("/submit-feedback", methods=["POST"])
def store_response():
    feedback = request.get_json()
    answered = feedback["answer"]
    rating = feedback["enjoyment"]
    simplicity = feedback["ease"]

    feedback_confirmation = form_response(mongo, answered, rating, simplicity)
    if(feedback != None):
        return jsonify({"feedback": feedback_confirmation})
    return "sorry feedback is empty"

# POST to recieve an input
@app.route("/get-user-response", methods=["POST"])
def create_response():
    try:
        # Saves the json in the user_response variable.
        user_response = request.get_json()
        user = user_response["name"]

        # predict the department, category, info
        result = predict(user)
        dept = result["dept"][0]["tag"]
        category = result["cat"][0]["tag"]
        info = result["info"][0]["tag"]
        intent = result["ints"][0]["tag"]
        probability = result["lowest_prob"]

        Entities = [intent, dept, category, info]
        # res = get_question(Entities)

        found = mongo.db.questions.find_one({"tags": {"$all": Entities}})
        if found is None:  # if there is no match
            return jsonify({"answer": "no match", "probability": float(probability)})
            
        fickleID = found.pop(
            "_id"
        )  # jasonify() doesn't know how to handle objects of type ObjectID, so we remove it
        found.update(
            {"_id": str(fickleID)}
        )  # put _id back in but as a regular string now
        response = found["response"]
        if "follow-up" in found:
            follow_up = found["follow-up"]["name"]
            # print(follow_up)
            return jsonify(
            {
                "department": dept,
                "category": category,
                "information": info,
                "answer": response,
                "probability": float(probability),
                "followUp": follow_up
                
            })
        else:
            return jsonify(
                {
                    "department": dept,
                    "category": category,
                    "information": info,
                    "answer": response,
                    "probability": float(probability),
                    
                    
                })
            
        
    except:
        print(traceback.print_exc())
        return "we've reached except"


# GET to send a response
# /chatbot-response
@app.route("/knugget-response", methods=["GET"])
def get_response():
    return jsonify({"name": new_response})


if __name__ == "__main__":
    app.run(port=5000)
