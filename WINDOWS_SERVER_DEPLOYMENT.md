# Windows Server Deployment Guide

## ปัญหา Image Upload บน Windows Server

### สาเหตุหลัก
1. **Sharp dependency issues** - Sharp library มีปัญหากับ Windows Server บางเวอร์ชัน
2. **File path handling** - Windows path separator แตกต่างจาก Linux
3. **Permission issues** - Windows Server security restrictions

### การแก้ไขที่ทำไปแล้ว
- **Fallback image processing** - ถ้า Sharp ไม่ทำงาน จะใช้รูปแบบเดิม
- **Better error handling** - แสดงข้อความ error ที่ชัดเจนขึ้น
- **Windows compatible paths** - ใช้ `path.join()` สำหรับทุก platform

### ขั้นตอนการติดตั้งบน Windows Server

#### 1. เตรียม Environment
```bash
# ติดตั้ง Node.js (LTS version)
# ติดตั้ง npm
# ตรวจสอบ version
node --version
npm --version
```

#### 2. ติดตั้ง Dependencies
```bash
npm install
```

#### 3. ติดตั้ง Sharp สำหรับ Windows (ถ้าต้องการ)
```bash
# ถ้า Sharp ไม่ทำงาน ให้ลองติดตั้งใหม่
npm uninstall sharp
npm install sharp --platform=win32 --arch=x64
```

#### 4. ตั้งค่า Permissions
- ให้ write permission ที่โฟลเดอร์ `public/images`
- ให้ write permission ที่โฟลเดอร์ `backups`
- ให้ write permission ที่โฟลเดอร์ที่มี database file

#### 5. สร้างโฟลเดอร์ที่จำเป็น
```bash
mkdir public\images
mkdir backups
```

#### 6. ตั้งค่า Environment Variables
```bash
# สำหรับ production
set NODE_ENV=production
set PORT=7044
```

#### 7. Build และ Start
```bash
npm run build
npm start
```

### การตรวจสอบการทำงาน

#### ทดสอบ Image Upload
1. เปิด browser ไปที่ `http://localhost:7044`
2. ลองเพิ่ม stock item ใหม่
3. อัปโหลดรูปภาพ
4. ตรวจสอบว่ารูปปรากฏใน `public/images`

#### ตรวจสอบ Logs
```bash
# ดู console logs ของ application
# ตรวจสอบว่ามี error messages เกี่ยวกับ Sharp หรือไม่
```

### การแก้ปัญหาเฉพาะเคส

#### Case 1: Sharp ไม่ทำงาน
- Application จะ fallback ไปใช้รูปแบบเดิม (jpg, png, etc.)
- ไม่ต้องติดตั้ง Sharp ก็ได้

#### Case 2: Permission Denied
```bash
# ให้ permission แก่ user ที่ run application
icacls "C:\path\to\project\public\images" /grant Users:(OI)(CI)F
icacls "C:\path\to\project\backups" /grant Users:(OI)(CI)F
```

#### Case 3: Path Issues
- ใช้ `path.join()` แทน string concatenation
- หลีกเลี่ยงการใช้ hardcoded paths

### การ Deploy ด้วย PM2 (แนะนำ)
```bash
# ติดตั้ง PM2
npm install -g pm2

# Start application
pm2 start npm --name "it-stock" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### การตรวจสอบสถานะ
```bash
# ตรวจสอบ process
pm2 status

# ดู logs
pm2 logs it-stock

# Restart
pm2 restart it-stock
```

### Firewall Configuration
- เปิด port 7044 บน Windows Firewall
- หรือใช้ port อื่นตามที่ตั้งค่าไว้

### IIS Configuration (ถ้าใช้ IIS)
- ติดตั้ง iisnode
- ตั้งค่า web.config สำหรับ Node.js
- ตั้งค่า reverse proxy

### การ Backup
- Backup database file ที่ `database.sqlite`
- Backup folder `public/images`
- Backup folder `backups`

### Monitoring
- ตรวจสอบ disk space สำหรับรูปภาพ
- ตรวจสอบ database size
- ตรวจสอบ application logs บ้างๆ
