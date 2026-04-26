import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def create_project(**kwargs) -> dict:
    payload = {"name": "Test Project", "status": "active", **kwargs}
    r = client.post("/projects/", json=payload)
    assert r.status_code == 201
    return r.json()


def create_expense(project_id: int, **kwargs) -> dict:
    payload = {
        "date": "2026-03-03",
        "description": "Grab Ride KL",
        "amount": 22.40,
        "currency": "MYR",
        "amount_rm": 22.40,
        "category": "Transport",
        **kwargs,
    }
    r = client.post(f"/projects/{project_id}/expenses", json=payload)
    assert r.status_code == 201
    return r.json()


def test_breakdown_groups_claimed_and_unclaimed_by_category():
    p = create_project(name="Breakdown Project")
    e1 = create_expense(p["id"], category="Transport", amount_rm=100.00, amount=100.00)
    create_expense(p["id"], category="Transport", amount_rm=50.00, amount=50.00)
    create_expense(p["id"], category="Food", amount_rm=20.00, amount=20.00)
    client.patch(f"/projects/expenses/{e1['id']}/claim?is_claimed=true")

    r = client.get(f"/projects/{p['id']}/breakdown")
    assert r.status_code == 200
    data = r.json()

    assert data["Transport"]["claimed"] == 100.00
    assert data["Transport"]["unclaimed"] == 50.00
    assert data["Food"]["claimed"] == 0.00
    assert data["Food"]["unclaimed"] == 20.00


def test_breakdown_returns_404_for_missing_project():
    r = client.get("/projects/99999/breakdown")
    assert r.status_code == 404
