from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import projects, expenses, income, statements
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router,  prefix="/projects",  tags=["projects"])
app.include_router(expenses.router,  prefix="/projects",  tags=["expenses"])   # ← /projects/{id}/expenses
app.include_router(income.router,    prefix="/projects",  tags=["income"])     # ← /projects/{id}/income
app.include_router(statements.router, prefix="/statements", tags=["statements"])

@app.get("/")
def root():
    return {"status": "ok"}