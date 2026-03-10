from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, customers, services, entries, invoices, exports, admin, labour

app = FastAPI(title="LaundryPro API")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(entries.router, prefix="/api/entries", tags=["Entries"])
app.include_router(invoices.router)
app.include_router(exports.router)
app.include_router(admin.router)
app.include_router(labour.router)

@app.get("/")
def root():
    return {"message": "LaundryPro API is running!"}