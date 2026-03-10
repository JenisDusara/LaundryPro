import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import settings


def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.EMAIL_USER or not to:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"LaundryPro <{settings.EMAIL_USER}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(settings.EMAIL_USER, settings.EMAIL_PASS)
            s.sendmail(settings.EMAIL_USER, to, msg.as_string())
        print(f"✅ Email sent to {to}")
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False


def pickup_email_html(customer_name: str, entry_date: str, items: list[dict], total: float) -> str:
    rows = "".join(
        f"<tr><td style='padding:8px 12px;border-bottom:1px solid #f1f5f9'>{i['service_name']}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center'>{i['quantity']}</td></tr>"
        for i in items
    )
    return f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:24px;text-align:center">
        <h2 style="color:#fff;margin:8px 0 0;font-size:20px">LaundryPro</h2>
      </div>
      <div style="padding:24px">
        <h3 style="color:#1e293b;margin:0 0 4px">Hello {customer_name}!</h3>
        <p style="color:#64748b;margin:0 0 20px;font-size:14px">Your laundry has been picked up on <strong>{entry_date}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:600">Item</th>
              <th style="padding:8px 12px;text-align:center;color:#64748b;font-weight:600">Qty</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;text-align:center">We will notify you when your laundry is ready for delivery.</p>
      </div>
    </div>
    """


def delivery_email_html(customer_name: str, pickup_date: str, delivery_date: str, items: list[dict], total: float) -> str:
    rows = "".join(
        f"<tr><td style='padding:8px 12px;border-bottom:1px solid #f1f5f9'>{i['service_name']}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center'>{i['quantity']}</td></tr>"
        for i in items
    )
    return f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#065f46,#10b981);padding:24px;text-align:center">
        <h2 style="color:#fff;margin:8px 0 0;font-size:20px">Delivery Complete!</h2>
      </div>
      <div style="padding:24px">
        <h3 style="color:#1e293b;margin:0 0 4px">Hello {customer_name}!</h3>
        <p style="color:#64748b;margin:0 0 20px;font-size:14px">Your laundry has been delivered successfully.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="color:#64748b">Pickup Date</span>
            <span style="font-weight:600;color:#1e293b">{pickup_date}</span>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span style="color:#64748b">Delivery Date</span>
            <span style="font-weight:600;color:#16a34a">{delivery_date}</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:600">Item</th>
              <th style="padding:8px 12px;text-align:center;color:#64748b;font-weight:600">Qty</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;text-align:center">Thank you for choosing LaundryPro! 🙏</p>
      </div>
    </div>
    """ 


from email.mime.base import MIMEBase
from email import encoders


def send_email_with_pdf(to: str, subject: str, html: str, pdf_bytes: bytes, filename: str) -> bool:
    if not settings.EMAIL_USER or not to:
        return False
    try:
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"] = f"Chamunda Laundry <{settings.EMAIL_USER}>"
        msg["To"] = to

        msg.attach(MIMEText(html, "html"))

        part = MIMEBase("application", "pdf")
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f"attachment; filename={filename}")
        msg.attach(part)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(settings.EMAIL_USER, settings.EMAIL_PASS)
            s.sendmail(settings.EMAIL_USER, to, msg.as_string())
        print(f"✅ Invoice email sent to {to}")
        return True
    except Exception as e:
        print(f"Invoice email error: {e}")
        return False


def invoice_email_html(customer_name: str, month_name: str, year: int, total: float) -> str:
    return f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#1a6fa8,#f4a460);padding:24px;text-align:center">
        <h2 style="color:#fff;margin:8px 0 0;font-size:20px">Chamunda Laundry</h2>
        <p style="color:#fff;opacity:0.9;margin:4px 0 0;font-size:14px">Invoice for {month_name} {year}</p>
      </div>
      <div style="padding:24px">
        <h3 style="color:#1e293b;margin:0 0 4px">Hello {customer_name}!</h3>
        <p style="color:#64748b;margin:0 0 20px;font-size:14px">
          Please find attached your laundry invoice for <strong>{month_name} {year}</strong>.
        </p>
        <div style="background:#fef3e8;border-radius:8px;padding:14px;text-align:center;margin-bottom:16px">
          <div style="color:#64748b;font-size:13px">Total Amount</div>
          <div style="color:#1a4f7a;font-size:22px;font-weight:800">Rs.{total:.0f}</div>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;text-align:center">
          Thank you for choosing Chamunda Laundry! 🙏
        </p>
      </div>
    </div>
    """