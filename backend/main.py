from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from generateImage import router as generateImage_router
from removeBG import router as removeBG_router
from vectorizeImage import router as vectorize_router
from test import testinApp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register ALL routers
app.include_router(generateImage_router)
app.include_router(removeBG_router)
app.include_router(vectorize_router)
@app.get("/test")
def test_route():
    return testinApp()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)