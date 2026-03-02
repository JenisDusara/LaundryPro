from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
import json
from passlib.hash import bcrypt
from pydantic import BaseModel

from db.database import get_db
from models import Admin, Customer, Service, LaundryEntry, EntryItem
from routers.auth import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


class ShopSettings(BaseModel):
    shop_name: str
    contact: str
    address: str


class NewAdmin(BaseModel):
    username: str
    password: str


class ChangePassword(BaseModel):
    old_password: str
    new_password: str


# In-memory shop settings (simple approach)
shop_settings = {
    "shop_name": "Chamunda Laundry",
    "contact": "+91 1234567890",
    "address": "Ahmedabad, India",
}


@router.get("/settings")
def get_settings(_: dict = Depends(get_current_admin)):
    return shop_settings


@router.put("/settings")
def update_settings(data: ShopSettings, _: dict = Depends(get_current_admin)):
    shop_settings["shop_name"] = data.shop_name
    shop_settings["contact"] = data.contact
    shop_settings["address"] = data.address
    return {"message": "Settings updated"}


@router.get("/users")
def get_admins(db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    admins = db.query(Admin).all()
    return [{"id": str(a.id), "username": a.username, "created_at": str(a.created_at)} for a in admins]


@router.post("/users")
def create_admin(data: NewAdmin, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    existing = db.query(Admin).filter(Admin.username == data.username).first()
    if existing:
        raise HTTPException(400, "Username already exists")
    admin = Admin(username=data.username, password_hash=bcrypt.hash(data.password))
    db.add(admin)
    db.commit()
    return {"message": "Admin created"}


@router.delete("/users/{admin_id}")
def delete_admin(admin_id: str, db: Session = Depends(get_db), current: dict = Depends(get_current_admin)):
    if str(current["id"]) == admin_id:
        raise HTTPException(400, "Cannot delete yourself")
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(404, "Admin not found")
    db.delete(admin)
    db.commit()
    return {"message": "Admin deleted"}


@router.post("/change-password")
def change_password(data: ChangePassword, db: Session = Depends(get_db), current: dict = Depends(get_current_admin)):
    admin = db.query(Admin).filter(Admin.id == current["id"]).first()
    if not bcrypt.verify(data.old_password, admin.password_hash):
        raise HTTPException(400, "Old password is incorrect")
    admin.password_hash = bcrypt.hash(data.new_password)
    db.commit()
    return {"message": "Password changed"}


@router.get("/backup")
def backup(db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    customers = db.query(Customer).all()
    entries = db.query(LaundryEntry).all()
    services = db.query(Service).all()

    data = {
        "customers": [{"name": c.name, "phone": c.phone, "flat_number": c.flat_number,
                        "society_name": c.society_name, "address": c.address} for c in customers],
        "services": [{"name": s.name, "price": float(s.price), "parent_id": str(s.parent_id) if s.parent_id else None} for s in services],
        "entries": [
            {
                "customer_phone": e.customer.phone,
                "entry_date": str(e.entry_date),
                "total_amount": float(e.total_amount),
                "delivery_status": e.delivery_status,
                "items": [{"service_name": i.service_name, "quantity": i.quantity,
                           "price_per_unit": float(i.price_per_unit), "subtotal": float(i.subtotal)} for i in e.items],
            }
            for e in entries
        ],
    }

    buf = BytesIO(json.dumps(data, indent=2).encode())
    return StreamingResponse(buf, media_type="application/json",
                             headers={"Content-Disposition": "attachment; filename=laundrypro_backup.json"})