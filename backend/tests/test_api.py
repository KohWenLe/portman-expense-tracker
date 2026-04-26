import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Test DB setup (isolated in-memory SQLite) 
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

@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)



# PROJECTS


def create_project(**kwargs) -> dict:
    payload = {"name": "Test Project", "status": "active", **kwargs}
    r = client.post("/projects/", json=payload)
    assert r.status_code == 201
    return r.json()

def test_create_project():
    p = create_project(
        name="Client A Website",
        description="Build website for Client A",
        start_date="2026-01-01",
        end_date="2026-06-30",
        total_budget=50000.00,
        status="active"
    )
    assert p["name"] == "Client A Website"
    assert p["status"] == "active"
    assert p["total_budget"] == 50000.00

def test_list_projects():
    create_project(name="Project Alpha")
    create_project(name="Project Beta")
    r = client.get("/projects/")
    assert r.status_code == 200
    assert len(r.json()) == 2

def test_get_project():
    p = create_project(name="Solo Project")
    r = client.get(f"/projects/{p['id']}")
    assert r.status_code == 200
    assert r.json()["name"] == "Solo Project"

def test_get_project_not_found():
    r = client.get("/projects/999")
    assert r.status_code == 404

def test_update_project():
    p = create_project(name="Old Name")
    r = client.put(f"/projects/{p['id']}", json={"name": "New Name", "status": "on_hold"})
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"
    assert r.json()["status"] == "on_hold"

def test_delete_project():
    p = create_project(name="To Delete")
    r = client.delete(f"/projects/{p['id']}")
    assert r.status_code == 204
    assert client.get(f"/projects/{p['id']}").status_code == 404



# EXPENSES


def create_expense(project_id: int, **kwargs) -> dict:
    payload = {
        "date": "2026-03-03",
        "description": "Grab Ride KL",
        "amount": 22.40,
        "currency": "MYR",
        "amount_rm": 22.40,
        "category": "Transport",
        **kwargs
    }
    r = client.post(f"/projects/{project_id}/expenses", json=payload)
    assert r.status_code == 201
    return r.json()

def test_create_expense():
    p = create_project()
    e = create_expense(p["id"], description="Starbucks", amount=28.50, amount_rm=28.50)
    assert e["description"] == "Starbucks"
    assert e["amount_rm"] == 28.50
    assert e["is_claimed"] == False

def test_create_expense_project_not_found():
    r = client.post("/projects/999/expenses", json={
        "date": "2026-03-03",
        "description": "Test",
        "amount": 10.00,
        "currency": "MYR",
        "amount_rm": 10.00,
    })
    assert r.status_code == 404

def test_create_overseas_expense():
    p = create_project()
    e = create_expense(
        p["id"],
        date="2026-03-19",
        description="Amazon Web Services",
        amount=95.20,
        currency="USD",
        amount_rm=449.72,
        original_currency="USD",
        original_amount=95.20,
        exchange_rate=4.723,
        source_reference="march_2026_statement.pdf"
    )
    assert e["currency"] == "USD"
    assert e["amount_rm"] == 449.72
    assert e["exchange_rate"] == 4.723
    assert e["source_reference"] == "march_2026_statement.pdf"

def test_list_expenses():
    p = create_project()
    create_expense(p["id"], description="Grab")
    create_expense(p["id"], description="Shopee")
    r = client.get(f"/projects/{p['id']}/expenses")
    assert r.status_code == 200
    assert len(r.json()) == 2

def test_list_expenses_filter_by_claimed():
    p = create_project()
    e1 = create_expense(p["id"], description="Grab")
    create_expense(p["id"], description="Shopee")
    # Claim the first one
    client.patch(f"/projects/expenses/{e1['id']}/claim?is_claimed=true")
    r = client.get(f"/projects/{p['id']}/expenses?is_claimed=true")
    assert all(e["is_claimed"] for e in r.json())

def test_list_expenses_filter_by_category():
    p = create_project()
    create_expense(p["id"], description="Grab", category="Transport")
    create_expense(p["id"], description="Starbucks", category="Food")
    r = client.get(f"/projects/{p['id']}/expenses?category=Transport")
    assert r.status_code == 200
    assert all(e["category"] == "Transport" for e in r.json())

def test_update_expense():
    p = create_project()
    e = create_expense(p["id"])
    r = client.put(f"/projects/expenses/{e['id']}", json={"category": "Food", "notes": "Team lunch"})
    assert r.status_code == 200
    assert r.json()["category"] == "Food"
    assert r.json()["notes"] == "Team lunch"

def test_claim_expense_sets_claimed_date():
    p = create_project()
    e = create_expense(p["id"])
    r = client.patch(f"/projects/expenses/{e['id']}/claim?is_claimed=true")
    assert r.status_code == 200
    assert r.json()["is_claimed"] == True
    assert r.json()["claimed_date"] is not None

def test_unclaim_expense_clears_claimed_date():
    p = create_project()
    e = create_expense(p["id"])
    client.patch(f"/projects/expenses/{e['id']}/claim?is_claimed=true")
    r = client.patch(f"/projects/expenses/{e['id']}/claim?is_claimed=false")
    assert r.json()["is_claimed"] == False
    assert r.json()["claimed_date"] is None

def test_bulk_claim():
    p = create_project()
    e1 = create_expense(p["id"], description="Grab")
    e2 = create_expense(p["id"], description="Shopee")
    e3 = create_expense(p["id"], description="Lazada")
    r = client.patch("/projects/expenses/bulk-claim", json={
        "expense_ids": [e1["id"], e2["id"]],
        "is_claimed": True
    })
    assert r.status_code == 200
    assert all(e["is_claimed"] for e in r.json())
    # e3 should still be unclaimed
    e3_r = client.get(f"/projects/{p['id']}/expenses?is_claimed=false")
    assert any(e["id"] == e3["id"] for e in e3_r.json())

def test_delete_expense():
    p = create_project()
    e = create_expense(p["id"])
    r = client.delete(f"/projects/expenses/{e['id']}")
    assert r.status_code == 204



# INCOME


def create_income(project_id: int, **kwargs) -> dict:
    payload = {
        "date": "2026-03-15",
        "source": "Client Invoice",
        "description": "Phase 1 payment",
        "amount": 5000.00,
        "currency": "MYR",
        "amount_rm": 5000.00,
        **kwargs
    }
    r = client.post(f"/projects/{project_id}/income", json=payload)
    assert r.status_code == 201
    return r.json()

def test_create_income():
    p = create_project()
    i = create_income(p["id"], source="Client A", amount=8000.00, amount_rm=8000.00)
    assert i["source"] == "Client A"
    assert i["amount_rm"] == 8000.00

def test_create_income_project_not_found():
    r = client.post("/projects/999/income", json={
        "date": "2026-03-15",
        "source": "Test",
        "amount": 100.00,
        "currency": "MYR",
        "amount_rm": 100.00
    })
    assert r.status_code == 404

def test_list_income():
    p = create_project()
    create_income(p["id"], source="Invoice 1")
    create_income(p["id"], source="Invoice 2")
    r = client.get(f"/projects/{p['id']}/income")
    assert r.status_code == 200
    assert len(r.json()) == 2

def test_update_income():
    p = create_project()
    i = create_income(p["id"])
    r = client.put(f"/projects/income/{i['id']}", json={"amount": 9999.00, "amount_rm": 9999.00})
    assert r.status_code == 200
    assert r.json()["amount_rm"] == 9999.00

def test_delete_income():
    p = create_project()
    i = create_income(p["id"])
    r = client.delete(f"/projects/income/{i['id']}")
    assert r.status_code == 204



# PROJECT SUMMARY


def test_summary_correct_totals():
    p = create_project(total_budget=10000.00)
    create_expense(p["id"], amount=500.00,  amount_rm=500.00)
    create_expense(p["id"], amount=1200.00, amount_rm=1200.00)
    create_income(p["id"],  amount=5000.00, amount_rm=5000.00)
    r = client.get(f"/projects/{p['id']}/summary")
    assert r.status_code == 200
    s = r.json()
    assert s["total_expenses"]    == 1700.00
    assert s["total_income"]      == 5000.00
    assert s["net_position"]      == 3300.00
    assert s["total_claimed"]     == 0.00
    assert s["total_outstanding"] == 1700.00
    assert s["budget_remaining"]  == 8300.00

def test_summary_claimed_vs_outstanding():
    p = create_project()
    e1 = create_expense(p["id"], amount=300.00, amount_rm=300.00)
    e2 = create_expense(p["id"], amount=700.00, amount_rm=700.00)
    client.patch(f"/projects/expenses/{e1['id']}/claim?is_claimed=true")
    r = client.get(f"/projects/{p['id']}/summary")
    s = r.json()
    assert s["total_claimed"]     == 300.00
    assert s["total_outstanding"] == 700.00

def test_summary_no_budget_returns_none():
    p = create_project()  # no total_budget set
    r = client.get(f"/projects/{p['id']}/summary")
    assert r.json()["budget_remaining"] is None

def test_summary_empty_project():
    p = create_project()
    r = client.get(f"/projects/{p['id']}/summary")
    s = r.json()
    assert s["total_income"]   == 0.0
    assert s["total_expenses"] == 0.0
    assert s["net_position"]   == 0.0