def function():
    import json
    import os
    from openai import OpenAI
    from dotenv import load_dotenv
    from dbConnect import DBConnect
    import pymongo
    from bson.objectid import ObjectId
    from pydantic import BaseModel
    #used to get OpenAI API key
    load_dotenv()
    print("YIPPEE")
    sys.stdout.flush()