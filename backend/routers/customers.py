from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from models import Customer
from routers.auth import get_current_admin
from schemas import CustomerCreate, CustomerUpdate, CustomerOut

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.post("", response_model=CustomerOut)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    if db.query(Customer).filter(Customer.phone == data.phone).first():
        raise HTTPException(400, "Phone number already exists")
    c = Customer(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("", response_model=list[CustomerOut])
def list_customers(
    search: str | None = Query(None, description="Search by phone or name"),
    db: Session = Depends(get_db),
):
    q = db.query(Customer)
    if search:
        q = q.filter(
            Customer.phone.ilike(f"%{search}%") | Customer.name.ilike(f"%{search}%")
        )
    return q.order_by(Customer.name).all()


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: UUID, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    return c


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: UUID, data: CustomerUpdate, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{customer_id}")
def delete_customer(customer_id: UUID, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    db.delete(c)
    db.commit()
    return {"detail": "Deleted"}