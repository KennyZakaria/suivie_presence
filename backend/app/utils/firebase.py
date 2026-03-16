import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings
import os
import json
_db = None


# def initialize_firebase():
#     global _db
#     if not firebase_admin._apps:
#         cred = credentials.Certificate(settings.firebase_credentials_path)
#         firebase_admin.initialize_app(cred, {
#             "projectId": settings.project_id,
#             "storageBucket": f"{settings.project_id}.appspot.com",
#         })
#     _db = firestore.client()

def initialize_firebase():
    global _db

    if not firebase_admin._apps:
        firebase_json = os.environ.get("FIREBASE_CREDENTIALS")
        cred_dict = json.loads(firebase_json)
        cred = credentials.Certificate(cred_dict)

        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    
def get_db() -> firestore.Client:
    global _db
    if _db is None:
        initialize_firebase()
    return _db
