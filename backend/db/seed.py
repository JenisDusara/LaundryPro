
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from passlib.hash import bcrypt
from database import SessionLocal
from models import Admin, Service

db = SessionLocal()

# ── Admin user ─────────────────────────────────────────
if not db.query(Admin).first():
    admin = Admin(
        username="admin",
        password_hash=bcrypt.hash("admin123"),
        name="Owner",
    )
    db.add(admin)
    print("✅ Admin user created (username: admin, password: admin123)")

# ── Services ───────────────────────────────────────────
if not db.query(Service).first():
    # Simple services (direct price)
    simple = [
        ("Steam Iron", 15),
        ("Press", 10),
        ("Petrol-Wash", None),
        ("Roll Polish", None),
        ("Clothes Color", None),
        ("Thread Removal", None),
        ("Vulcanizing", None),
    ]
    for name, price in simple:
        db.add(Service(name=name, price=price))

    # Dry-Clean parent + sub-items
    dry_clean = Service(name="Dry-Clean", price=None)
    db.add(dry_clean)
    db.flush()  # get dry_clean.id

    sub_items = [
        ("Choli", 350),
        ("Pair", 250),
        ("Sadi", 350),
        ("Indowestern", 500),
        ("Shervani", 700),
    ]
    for name, price in sub_items:
        db.add(Service(name=name, parent_id=dry_clean.id, price=price))

    print("✅ Services seeded")

db.commit()
db.close()
print("🎉 Seed complete!")