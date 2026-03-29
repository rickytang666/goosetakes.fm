from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import reddit, debate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reddit.router)
app.include_router(debate.router)


@app.get("/ping")
def ping():
    return {"message": "pong"}
