from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from pydantic import BaseModel
from decimal import Decimal
from datetime import date
import uuid

from db.database import get_db
from models import Labour, LabourWork
from routers.auth import get_current_admin

router = APIRouter(prefix="/api/labour", tags=["labour"])


class LabourCreate(BaseModel):
    name: str


class LabourUpdate(BaseModel):
    name: str


class WorkEntry(BaseModel):
    labour_id: str
    work_date: date
    press_count: int
    rate_per_piece: float


@router.get("/")
def get_labours(db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    return db.query(Labour).filter(Labour.is_active == True).all()


@router.post("/")
def create_labour(data: LabourCreate, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    labour = Labour(name=data.name)
    db.add(labour)
    db.commit()
    db.refresh(labour)
    return labour


@router.put("/{labour_id}")
def update_labour(labour_id: str, data: LabourUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    labour = db.query(Labour).filter(Labour.id == labour_id).first()
    if not labour:
        raise HTTPException(404, "Labour not found")
    labour.name = data.name
    db.commit()
    return labour


@router.delete("/{labour_id}")
def delete_labour(labour_id: str, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    labour = db.query(Labour).filter(Labour.id == labour_id).first()
    if not labour:
        raise HTTPException(404, "Labour not found")
    labour.is_active = False
    db.commit()
    return {"message": "Labour removed"}


@router.get("/work")
def get_work(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    works = (
        db.query(LabourWork)
        .filter(
            extract("month", LabourWork.work_date) == month,
            extract("year", LabourWork.work_date) == year,
        )
        .all()
    )
    return [
        {
            "id": str(w.id),
            "labour_id": str(w.labour_id),
            "labour_name": w.labour.name,
            "work_date": str(w.work_date),
            "press_count": w.press_count,
            "rate_per_piece": float(w.rate_per_piece),
            "total": w.press_count * float(w.rate_per_piece),
        }
        for w in works
    ]


@router.post("/work")
def save_work(data: WorkEntry, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    # Check if entry exists for this labour + date
    existing = (
        db.query(LabourWork)
        .filter(
            LabourWork.labour_id == data.labour_id,
            LabourWork.work_date == data.work_date,
        )
        .first()
    )
    if existing:
        existing.press_count = data.press_count
        existing.rate_per_piece = Decimal(str(data.rate_per_piece))
    else:
        work = LabourWork(
            labour_id=uuid.UUID(data.labour_id),
            work_date=data.work_date,
            press_count=data.press_count,
            rate_per_piece=Decimal(str(data.rate_per_piece)),
        )
        db.add(work)
    db.commit()
    return {"message": "Saved"}


@router.delete("/work/{work_id}")
def delete_work(work_id: str, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    work = db.query(LabourWork).filter(LabourWork.id == work_id).first()
    if not work:
        raise HTTPException(404, "Not found")
    db.delete(work)
    db.commit()
    return {"message": "Deleted"}