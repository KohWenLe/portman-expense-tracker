import pdfplumber
import re
import io
from datetime import date, datetime
from typing import Optional
from dataclasses import dataclass


@dataclass
class ParsedTransaction:
    post_date:         date
    trans_date:        Optional[date]
    description:       str
    amount:            float
    currency:          str   = "MYR"
    amount_rm:         float = 0.0
    original_currency: Optional[str]   = None
    original_amount:   Optional[float] = None
    exchange_rate:     Optional[float] = None

    def to_dict(self) -> dict:
        return {
            "post_date":         self.post_date.isoformat(),
            "trans_date":        self.trans_date.isoformat() if self.trans_date else None,
            "description":       self.description,
            "amount":            self.amount,
            "currency":          self.currency,
            "amount_rm":         self.amount_rm,
            "original_currency": self.original_currency,
            "original_amount":   self.original_amount,
            "exchange_rate":     self.exchange_rate,
        }


# ── Patterns ──────────────────────────────────────────────────────────────────

# pdfplumber collapses PDF whitespace to single spaces — use \s+ not \s{2,}
# CR flag captured as group 5 so we can filter in one pass
TRANSACTION_RE = re.compile(
    r"^(\d{2}/\d{2})\s+(\d{2}/\d{2})\s+(.+?)\s+([\d,]+\.\d{2})(\s+CR)?$"
)

SKIP_PREFIXES = (
    "Post Date",
    "Sub-Total",
    "Account Summary",
    "Previous Statement",
    "Payments / Credits",
    "New Purchases",
    "Cash Advance",
    "Fees & Charges",
    "Finance Charges",
    "Total Outstanding",
    "Minimum Payment",
    "Important Notes",
    "Transaction Details",
    "Overseas Transaction Details",
    "Date ",
)

# Not sure whether to exclude the transactions or not

# SKIP_SUBSTRINGS = (
#     "TRANSACTION FEE",
#     "ANNUAL FEE",
#     "SERVICE TAX",
#     "FINANCE CHARGES",
#     "LATE PAYMENT",
# )

SKIP_SUBSTRINGS = ()

OVERSEAS_DETAIL_RE = re.compile(
    r"(\d{2}/\d{2})\s+(.+?)\s+([A-Z]{3})\s+([\d.]+)\s+1\s+[A-Z]{3}\s+=\s+RM\s+([\d.]+)\s+([\d,]+\.\d{2})"
)

PERIOD_RE = re.compile(r"Statement Period:.*?(\d{4})", re.IGNORECASE)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_year(pages: list) -> int:
    for page in pages:
        text = page.extract_text() or ""
        m = PERIOD_RE.search(text)
        if m:
            return int(m.group(1))
    return datetime.today().year


def _parse_date(dd_mm: str, year: int) -> date:
    return datetime.strptime(f"{dd_mm}/{year}", "%d/%m/%Y").date()


def _clean_amount(raw: str) -> float:
    return float(raw.replace(",", ""))


def _should_skip(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return True
    if stripped.startswith(SKIP_PREFIXES):
        return True
    if any(s in stripped.upper() for s in SKIP_SUBSTRINGS):
        return True
    return False


def _parse_overseas_details(pages: list) -> dict:
    overseas = {}
    in_overseas_section = False

    for page in pages:
        lines = (page.extract_text() or "").splitlines()
        for line in lines:
            if "Overseas Transaction Details" in line:
                in_overseas_section = True
                continue
            if "Important Notes" in line:
                in_overseas_section = False
                continue
            if not in_overseas_section:
                continue
            m = OVERSEAS_DETAIL_RE.search(line)
            if m:
                _, description, currency, orig_amt, rate, _ = m.groups()
                overseas[description.strip()] = {
                    "original_currency": currency,
                    "original_amount":   float(orig_amt),
                    "exchange_rate":     float(rate),
                }

    return overseas


# ── Main parser ───────────────────────────────────────────────────────────────

def parse_statement(pdf_bytes: bytes) -> list[dict]:
    """
    Parse a credit card PDF and return cleaned transaction dicts.
    Rules:
      - Skip Account Summary block, header rows, Sub-Total rows
      - Skip CR rows (payments/credits) via regex capture group
      - Skip rows with fee/charge keywords
      - Skip zero-amount rows
      - Enrich overseas transactions with FX metadata
    """
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages = pdf.pages
        year            = _extract_year(pages)
        overseas_details = _parse_overseas_details(pages)
        transactions    = []
        in_transaction_section = False

        for page in pages:
            lines = (page.extract_text() or "").splitlines()

            for line in lines:
                # Section gating
                if "Transaction Details" in line and "Overseas" not in line:
                    in_transaction_section = True
                    continue
                if "Overseas Transaction Details" in line or "Important Notes" in line:
                    in_transaction_section = False
                    continue
                if not in_transaction_section:
                    continue

                if _should_skip(line):
                    continue

                m = TRANSACTION_RE.match(line.strip())
                if not m:
                    continue

                post_dd_mm, trans_dd_mm, description, raw_amount, cr_flag = m.groups()

                # Skip CR rows (payments/credits)
                if cr_flag:
                    continue

                amount_rm = _clean_amount(raw_amount)

                # Skip zero-amount rows (e.g. waived fees)
                if amount_rm == 0.0:
                    continue

                txn = ParsedTransaction(
                    post_date=_parse_date(post_dd_mm, year),
                    trans_date=_parse_date(trans_dd_mm, year),
                    description=description.strip(),
                    amount=amount_rm,
                    currency="MYR",
                    amount_rm=amount_rm,
                )

                # Enrich overseas transactions
                for key, fx in overseas_details.items():
                    if key in txn.description:
                        txn.original_currency = fx["original_currency"]
                        txn.original_amount   = fx["original_amount"]
                        txn.exchange_rate     = fx["exchange_rate"]
                        txn.currency          = fx["original_currency"]
                        txn.amount            = fx["original_amount"]
                        break

                transactions.append(txn.to_dict())

    return transactions