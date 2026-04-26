from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.utils.firebase import initialize_firebase
from app.routes import auth, users, classes, attendance, reviews, notifications, analytics, justifications, activity
import traceback

app = FastAPI(
    title="School Attendance Management API",
    description="REST API for School Attendance Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    )

PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(classes.router, prefix=PREFIX)
app.include_router(attendance.router, prefix=PREFIX)
app.include_router(reviews.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(analytics.router, prefix=PREFIX)
app.include_router(justifications.router, prefix=PREFIX)
app.include_router(activity.router, prefix=PREFIX)


@app.on_event("startup")
async def startup_event():
    initialize_firebase()


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
