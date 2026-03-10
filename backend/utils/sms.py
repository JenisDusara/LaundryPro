import requests
from config import settings


def send_sms(to_phone: str, message: str) -> bool:
    if not settings.FAST2SMS_API_KEY or not to_phone:
        return False
    try:
        phone = to_phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("+91"):
            phone = phone[3:]
        elif phone.startswith("91") and len(phone) == 12:
            phone = phone[2:]
        print(f"Sending SMS to: {phone}")
        response = requests.post(
            "https://www.fast2sms.com/dev/bulkV2",
            headers={"authorization": settings.FAST2SMS_API_KEY},
            json={
                "route": "q",
                "message": message,
                "language": "english",
                "flash": 0,
                "numbers": phone,
            },
            timeout=10,
        )
        data = response.json()
        if data.get("return"):
            print(f"✅ SMS sent to {phone}")
            return True
        print(f"SMS error: {data}")
        return False
    except Exception as e:
        print(f"SMS error: {e}")
        return False


def _fmt_date(d: str) -> str:
    from datetime import datetime
    try:
        return datetime.strptime(d, "%Y-%m-%d").strftime("%d %b %Y")
    except Exception:
        return d


def pickup_sms_msg(customer_name: str, entry_date: str, items: list[dict]) -> str:
    item_lines = "\n".join(f"- {i['service_name']} : {i['quantity']}" for i in items)
    return (
        f"Chamunda Laundry\n"
        f"Hello {customer_name}!\n"
        f"Pickup: {_fmt_date(entry_date)}\n"
        f"Items:\n{item_lines}\n"
        f"Thank you Chamunda Laundry!"
    )


def delivery_sms_msg(customer_name: str, pickup_date: str, delivery_date: str, items: list[dict]) -> str:
    item_lines = "\n".join(f"- {i['service_name']} : {i['quantity']}" for i in items)
    return (
        f"Chamunda Laundry\n"
        f"Hello {customer_name}!\n"
        f"Delivery: {_fmt_date(delivery_date)}\n"
        f"Items:\n{item_lines}\n"
        f"Pickup was: {_fmt_date(pickup_date)}\n"
        f"Thank you Chamunda Laundry!"
    )