from pydantic import BaseModel
from typing import Optional


class ActivityAction:
    LOGIN = "login"
    LOGOUT = "logout"
