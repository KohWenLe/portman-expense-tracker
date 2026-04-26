import pytest
from app.services.parser import parse_statement
import io, os

SAMPLE_PDF = os.path.join(os.path.dirname(__file__), "sample_credit_card_statement.pdf")


@pytest.fixture
def pdf_bytes():
    with open(SAMPLE_PDF, "rb") as f:
        return f.read()


def test_returns_list(pdf_bytes):
    result = parse_statement(pdf_bytes)
    assert isinstance(result, list)
    assert len(result) > 0


def test_no_cr_rows(pdf_bytes):
    """Payment rows (CR suffix) must never appear in output."""
    result = parse_statement(pdf_bytes)
    descriptions = [t["description"] for t in result]
    # Check the specific CR row 
    assert not any("JOMPAY" in d for d in descriptions)
    assert not any(d == "PAYMENT - JOMPAY THANK YOU" for d in descriptions)


def test_no_zero_amount_rows(pdf_bytes):
    """Zero-amount rows like waived annual fee must be excluded."""
    result = parse_statement(pdf_bytes)
    assert all(t["amount_rm"] > 0 for t in result)


def test_no_subtotal_rows(pdf_bytes):
    """Sub-Total rows must not appear as transactions."""
    result = parse_statement(pdf_bytes)
    descriptions = [t["description"].upper() for t in result]
    assert not any("SUB-TOTAL" in d for d in descriptions)



def test_overseas_transaction_enriched(pdf_bytes):
    """Amazon AWS row must have FX metadata populated."""
    result = parse_statement(pdf_bytes)
    aws = next((t for t in result if "AMAZON" in t["description"].upper()), None)
    assert aws is not None, "AWS transaction not found"
    assert aws["original_currency"] == "USD"
    assert aws["original_amount"]   == 95.20
    assert aws["exchange_rate"]     == 4.723
    assert aws["amount_rm"]         == 449.72
    assert aws["currency"]          == "USD"


def test_all_rows_have_required_fields(pdf_bytes):
    """Every parsed transaction must have the minimum required fields."""
    result = parse_statement(pdf_bytes)
    required = {"post_date", "trans_date", "description", "amount", "currency", "amount_rm"}
    for txn in result:
        assert required.issubset(txn.keys()), f"Missing fields in: {txn}"


def test_dates_are_strings(pdf_bytes):
    """Dates must be ISO strings (YYYY-MM-DD) for JSON serialisation."""
    result = parse_statement(pdf_bytes)
    for txn in result:
        assert isinstance(txn["post_date"], str)
        assert len(txn["post_date"]) == 10   # YYYY-MM-DD


def test_known_transactions_present(pdf_bytes):
    """Spot-check a few known rows from the sample statement."""
    result = parse_statement(pdf_bytes)
    descriptions = [t["description"] for t in result]
    assert any("GRAB" in d for d in descriptions)
    assert any("NETFLIX" in d for d in descriptions)
    assert any("HOTEL EQUATORIAL" in d for d in descriptions)


def test_transaction_count(pdf_bytes):
    """
    30 total rows matched.
    Excluded: 1 CR (JOMPAY payment), 2 zero-amount (ANNUAL FEE WAIVED, SERVICE TAX WAIVED).
    Valid rows passed: 27.
    """
    result = parse_statement(pdf_bytes)
    assert len(result) == 27