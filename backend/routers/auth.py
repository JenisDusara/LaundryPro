from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.hash import bcrypt
from sqlalchemy.orm import Session

from config import settings
from db.database import get_db
from models import Admin
from schemas import LoginRequest, TokenResponse, AdminOut

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_token(admin_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": admin_id, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Admin:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        admin = db.query(Admin).filter(Admin.id == payload["sub"]).first()
        if not admin:
            raise HTTPException(401, "Invalid token")
        return admin
    except JWTError:
        raise HTTPException(401, "Invalid token")


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == req.username).first()
    if not admin or not bcrypt.verify(req.password, admin.password_hash):
        raise HTTPException(401, "Invalid username or password")
    return TokenResponse(access_token=create_token(str(admin.id)))


@router.get("/me", response_model=AdminOut)
def me(admin: Admin = Depends(get_current_admin)):
    return admin