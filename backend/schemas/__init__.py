from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


# ── Auth ───────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminOut(BaseModel):
    id: UUID
    username: str
    name: str
    model_config = {"from_attributes": True}


# ── Customer ───────────────────────────────────────────
class CustomerCreate(BaseModel):
    name: str
    phone: str
    flat_number: str = ""
    society_name: str = ""
    address: str = ""
    email: str | None = None


class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    flat_number: str | None = None
    society_name: str | None = None
    address: str | None = None
    email: str | None = None


class CustomerOut(BaseModel):
    id: UUID
    name: str
    phone: str
    flat_number: str
    society_name: str
    address: str
    email: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Service ────────────────────────────────────────────
class ServiceCreate(BaseModel):
    name: str
    parent_id: UUID | None = None
    price: Decimal | None = None


class ServiceUpdate(BaseModel):
    name: str | None = None
    price: Decimal | None = None
    is_active: bool | None = None


class ServiceOut(BaseModel):
    id: UUID
    name: str
    parent_id: UUID | None
    price: Decimal | None
    is_active: bool
    children: list["ServiceOut"] = []
    model_config = {"from_attributes": True}


# ── Entry ──────────────────────────────────────────────
class EntryItemCreate(BaseModel):
    service_id: UUID
    quantity: int
    price_per_unit: Decimal | None = None
    service_name: str | None = None

class EntryCreate(BaseModel):
    customer_id: UUID
    items: list[EntryItemCreate]
    notes: str = ""


class EntryItemOut(BaseModel):
    id: UUID
    service_name: str
    price_per_unit: Decimal
    quantity: int
    subtotal: Decimal
    model_config = {"from_attributes": True}


class EntryOut(BaseModel):
    id: UUID
    customer_id: UUID
    entry_date: date
    total_amount: Decimal
    delivery_status: str
    notes: str
    items: list[EntryItemOut] = []
    customer: CustomerOut | None = None
    created_at: datetime
    model_config = {"from_attributes": True}