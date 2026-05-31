from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base
from .routers import products, customers, orders, dashboard


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

allow_origins = []
allow_origin_regex = None
regex_parts = []

for origin in origins:
    if "*" in origin:
        # Convert wildcard origin (e.g. "https://*.vercel.app") to regex pattern
        pattern = ""
        for char in origin:
            if char == "*":
                pattern += ".*"
            elif char in ".+?^${}()|[]\\":
                pattern += "\\" + char
            else:
                pattern += char
        regex_parts.append(f"^{pattern}$")
    else:
        allow_origins.append(origin)

if regex_parts:
    allow_origin_regex = "|".join(regex_parts)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "ethara-api"}
