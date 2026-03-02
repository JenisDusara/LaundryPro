from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models import Service
from routers.auth import get_current_admin
from schemas import ServiceCreate, ServiceUpdate, ServiceOut

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    # Return top-level services (parent_id is None) with children loaded
    return db.query(Service).filter(Service.parent_id.is_(None), Service.is_active.is_(True)).all()


@router.post("", response_model=ServiceOut)
def create_service(data: ServiceCreate, db: Session = Depends(get_db)):
    s = Service(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.put("/{service_id}", response_model=ServiceOut)
def update_service(service_id: UUID, data: ServiceUpdate, db: Session = Depends(get_db)):
    s = db.query(Service).filter(Service.id == service_id).first()
    if not s:
        raise HTTPException(404, "Service not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{service_id}")
def delete_service(service_id: UUID, db: Session = Depends(get_db)):
    s = db.query(Service).filter(Service.id == service_id).first()
    if not s:
        raise HTTPException(404, "Service not found")
    s.is_active = False  # soft delete
    db.commit()
    return {"detail": "Service deactivated"}