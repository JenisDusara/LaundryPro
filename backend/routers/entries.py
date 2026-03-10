from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from db.database import get_db
from models import LaundryEntry, EntryItem, Service, Customer
from routers.auth import get_current_admin
from schemas import EntryCreate, EntryOut
from utils.email import send_email, pickup_email_html, delivery_email_html
from utils.sms import send_sms, pickup_sms_msg, delivery_sms_msg

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.post("", response_model=EntryOut)
def create_entry(data: EntryCreate, db: Session = Depends(get_db)):
    if not db.query(Customer).filter(Customer.id == data.customer_id).first():
        raise HTTPException(404, "Customer not found")

    entry = LaundryEntry(customer_id=data.customer_id, notes=data.notes)
    total = 0

    for item in data.items:
        svc = db.query(Service).filter(Service.id == item.service_id).first()
        if not svc:
            raise HTTPException(400, f"Service not found: {item.service_id}")
        price = item.price_per_unit if item.price_per_unit is not None else svc.price
        if price is None:
            raise HTTPException(400, f"No price for service: {svc.name}")
        subtotal = price * item.quantity
        total += subtotal
        entry.items.append(
            EntryItem(
                service_id=svc.id,
                service_name=item.service_name or svc.name,
                price_per_unit=price,
                quantity=item.quantity,
                subtotal=subtotal,
            )
        )

    entry.total_amount = total
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Reload with relationships
    entry = db.query(LaundryEntry).options(
        joinedload(LaundryEntry.items),
        joinedload(LaundryEntry.customer),
    ).filter(LaundryEntry.id == entry.id).first()

    if entry and entry.customer:
        items_data = [
            {"service_name": i.service_name, "quantity": i.quantity, "subtotal": float(i.subtotal)}
            for i in entry.items
        ]
        if entry.customer.email:
            html = pickup_email_html(
                entry.customer.name,
                str(entry.entry_date),
                items_data,
                float(entry.total_amount),
            )
            send_email(entry.customer.email, "LaundryPro - Pickup Confirmation 👔", html)
        if entry.customer.phone:
            sms = pickup_sms_msg(entry.customer.name, str(entry.entry_date), items_data)
            send_sms(entry.customer.phone, sms)

    return entry


@router.get("", response_model=list[EntryOut])
def list_entries(
    entry_date: date | None = Query(None),
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    customer_id: UUID | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(LaundryEntry).options(
        joinedload(LaundryEntry.items),
        joinedload(LaundryEntry.customer),
    )
    if entry_date:
        q = q.filter(LaundryEntry.entry_date == entry_date)
    if month and year:
        from sqlalchemy import extract
        q = q.filter(
            extract("month", LaundryEntry.entry_date) == month,
            extract("year", LaundryEntry.entry_date) == year,
        )
    if customer_id:
        q = q.filter(LaundryEntry.customer_id == customer_id)

    return q.order_by(LaundryEntry.entry_date.desc()).all()


@router.get("/{entry_id}", response_model=EntryOut)
def get_entry(entry_id: UUID, db: Session = Depends(get_db)):
    e = db.query(LaundryEntry).options(
        joinedload(LaundryEntry.items),
        joinedload(LaundryEntry.customer),
    ).filter(LaundryEntry.id == entry_id).first()
    if not e:
        raise HTTPException(404, "Entry not found")
    return e


@router.delete("/{entry_id}")
def delete_entry(entry_id: UUID, db: Session = Depends(get_db)):
    e = db.query(LaundryEntry).filter(LaundryEntry.id == entry_id).first()
    if not e:
        raise HTTPException(404, "Entry not found")
    db.delete(e)
    db.commit()
    return {"detail": "Deleted"}


@router.patch("/{entry_id}/status")
def update_status(entry_id: UUID, status: str = Query(...), db: Session = Depends(get_db)):
    if status not in ("pending", "in_delivery", "delivered"):
        raise HTTPException(400, "Invalid status")
    e = db.query(LaundryEntry).filter(LaundryEntry.id == entry_id).first()
    if not e:
        raise HTTPException(404, "Entry not found")
    e.delivery_status = status
    db.commit()

    if status == "delivered":
        e = db.query(LaundryEntry).options(
            joinedload(LaundryEntry.items),
            joinedload(LaundryEntry.customer),
        ).filter(LaundryEntry.id == entry_id).first()
        if e and e.customer:
            items_data = [
                {"service_name": i.service_name, "quantity": i.quantity, "subtotal": float(i.subtotal)}
                for i in e.items
            ]
            if e.customer.email:
                html = delivery_email_html(
                    e.customer.name,
                    str(e.entry_date),
                    str(date.today()),
                    items_data,
                    float(e.total_amount),
                )
                send_email(e.customer.email, "LaundryPro - Delivery Complete ✅", html)
            if e.customer.phone:
                sms = delivery_sms_msg(e.customer.name, str(e.entry_date), str(date.today()), items_data)
                send_sms(e.customer.phone, sms)

    return {"detail": f"Status updated to {status}"}


@router.patch("/{entry_id}/items/{item_id}/status")
def update_item_status(entry_id: UUID, item_id: UUID, status: str = Query(...), db: Session = Depends(get_db)):
    if status not in ("pending", "in_delivery", "delivered"):
        raise HTTPException(400, "Invalid status")
    item = db.query(EntryItem).filter(EntryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    item.item_status = status
    db.commit()
    return {"detail": f"Item status updated to {status}"}