
import uuid
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import (
    String, Text, Boolean, Integer, Date, DateTime,
    ForeignKey, Numeric, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.database import Base


# ── Admin ──────────────────────────────────────────────
class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ── Customer ───────────────────────────────────────────
class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(15), unique=True, index=True)
    flat_number: Mapped[str] = mapped_column(String(50), default="")
    society_name: Mapped[str] = mapped_column(String(150), default="")
    address: Mapped[str] = mapped_column(Text, default="")
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    entries: Mapped[list["LaundryEntry"]] = relationship(back_populates="customer")


# ── Service ────────────────────────────────────────────
class Service(Base):
    __tablename__ = "services"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100))
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("services.id"), nullable=True
    )
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Self-referential: parent ↔ children
    parent: Mapped["Service | None"] = relationship(
        "Service", remote_side="Service.id", back_populates="children"
    )
    children: Mapped[list["Service"]] = relationship("Service", back_populates="parent")


# ── Laundry Entry ──────────────────────────────────────
class LaundryEntry(Base):
    __tablename__ = "laundry_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"))
    entry_date: Mapped[date] = mapped_column(Date, server_default=func.current_date(), index=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    delivery_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending / in_delivery / delivered
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    customer: Mapped["Customer"] = relationship(back_populates="entries")
    items: Mapped[list["EntryItem"]] = relationship(back_populates="entry", cascade="all, delete-orphan")


# ── Entry Item ─────────────────────────────────────────
class EntryItem(Base):
    __tablename__ = "entry_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("laundry_entries.id"))
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("services.id"))
    service_name: Mapped[str] = mapped_column(String(100))  # snapshot
    price_per_unit: Mapped[Decimal] = mapped_column(Numeric(10, 2))  # snapshot
    quantity: Mapped[int] = mapped_column(Integer)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    item_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending / completed
    entry: Mapped["LaundryEntry"] = relationship(back_populates="items")


# ── Labour ──────────────────────────────────────────────────
class Labour(Base):
    __tablename__ = "labours"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ── Labour Daily Work ────────────────────────────────────────
class LabourWork(Base):
    __tablename__ = "labour_work"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    labour_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("labours.id"))
    work_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    press_count: Mapped[int] = mapped_column(Integer, default=0)
    rate_per_piece: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=2)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    labour: Mapped["Labour"] = relationship()