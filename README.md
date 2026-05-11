# หน้ายืมและเบิก — IT Stock Management

หน้า Next.js 14 (App Router) สำหรับจัดการการยืมและเบิกอุปกรณ์ IT

---

## โครงสร้างไฟล์

```
app/
  borrow/
    page.jsx                          ← หน้าหลัก (Client Component)
  api/
    borrows/
      route.js                        ← GET list / POST create
      [id]/
        route.js                      ← GET one / PATCH / DELETE
        return/
          route.js                    ← PATCH  /api/borrows/:id/return
    requisitions/
      route.js                        ← GET list / POST create
      [id]/
        route.js                      ← GET one / PATCH / DELETE
        approve/
          route.js                    ← PATCH  /api/requisitions/:id/approve
        reject/
          route.js                    ← PATCH  /api/requisitions/:id/reject
lib/
  db.js                               ← SQLite singleton + schema + seed
data/
  stock.db                            ← auto-created on first run (gitignore this)
```

---

## ติดตั้ง

```bash
# 1. ติดตั้ง dependencies
npm install better-sqlite3

# 2. สร้างโฟลเดอร์ data (ถ้ายังไม่มี)
mkdir -p data

# 3. รัน dev server
npm run dev
```

---

## API Reference

### Borrows

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/borrows` | ดึงรายการยืมทั้งหมด (รองรับ `?status=&dept=&search=`) |
| POST   | `/api/borrows` | สร้างรายการยืมใหม่ |
| GET    | `/api/borrows/:id` | ดึงรายการยืมชิ้นเดียว |
| PATCH  | `/api/borrows/:id` | แก้ไขข้อมูล |
| DELETE | `/api/borrows/:id` | ลบรายการ |
| PATCH  | `/api/borrows/:id/return` | บันทึกการคืน |

### Requisitions

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/requisitions` | ดึงรายการเบิกทั้งหมด (รองรับ `?status=&dept=&search=`) |
| POST   | `/api/requisitions` | สร้างคำขอเบิกใหม่ |
| GET    | `/api/requisitions/:id` | ดึงรายการเบิกชิ้นเดียว |
| PATCH  | `/api/requisitions/:id` | แก้ไขข้อมูล |
| DELETE | `/api/requisitions/:id` | ลบรายการ |
| PATCH  | `/api/requisitions/:id/approve` | อนุมัติ |
| PATCH  | `/api/requisitions/:id/reject` | ปฏิเสธ (ส่ง `{ reason }` ใน body ได้) |

---

## Body สำหรับ POST /api/borrows

```json
{
  "borrower":   "ชื่อ-นามสกุล",
  "dept":       "IT",
  "item":       "Laptop Dell XPS 13",
  "qty":        1,
  "borrowDate": "2025-05-07",
  "dueDate":    "2025-05-20",
  "note":       "หมายเหตุ"
}
```

## Body สำหรับ POST /api/requisitions

```json
{
  "requester":   "ชื่อ-นามสกุล",
  "dept":        "HR",
  "item":        "USB-C Hub",
  "qty":         3,
  "requestDate": "2025-05-07",
  "note":        "หมายเหตุ"
}
```

---

## หมายเหตุ

- ฐานข้อมูลใช้ **SQLite** ผ่าน `better-sqlite3` (sync, ไม่ต้องใช้ async)
- ข้อมูล seed จะถูกเพิ่มอัตโนมัติเมื่อตาราง borrows ว่างเปล่า
- `data/stock.db` ควรเพิ่มใน `.gitignore`
- Activity log ถูกบันทึกทุกครั้งที่มีการ return / approve / reject
