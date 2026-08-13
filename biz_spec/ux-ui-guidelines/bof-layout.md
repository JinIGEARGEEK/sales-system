# BOF Layout Guidelines

## Cursor / Pointer

- **ทุก element ที่กดได้** (ปุ่ม, ลิงก์, dropdown trigger, row ที่ clickable, icon action) ต้องแสดง `cursor: pointer` เสมอ
- ใช้ Tailwind class `cursor-pointer` บน element นั้นโดยตรง หรือให้แน่ใจว่า component นั้นมี cursor-pointer อยู่แล้วโดย default (เช่น `<Button variant="default">`, `<Button variant="link">`, `<Link>`)
- **`<Button variant="ghost">`** ต้องเพิ่ม `cursor-pointer` ด้วยเสมอ เนื่องจาก ghost variant ไม่มี cursor-pointer ใน base class โดย default
- **`<button type="button">`** (native HTML button ที่ใช้เป็น icon action เช่น ดินสอ, chevron) ต้องเพิ่ม `cursor-pointer` ด้วยเสมอ เนื่องจาก browser default ไม่ได้ set cursor-pointer ให้เสมอไป
- ข้อยกเว้น: element ที่ `disabled` ให้ใช้ `cursor-not-allowed`

---

## หน้าที่มีปุ่มย้อนกลับ (Detail / Sub-page)

หน้าที่เป็น sub-page หรือ detail page ให้ใช้โครงสร้าง header ดังนี้

- **ซ้าย**: ปุ่มลูกศรย้อนกลับ + ชื่อหน้า
- ปุ่มย้อนกลับ: ไม่มีพื้นหลัง, cursor-pointer, hover เปลี่ยนสีไอคอนเป็น primary เท่านั้น
- ชื่อหน้า: ขนาด title-3 (20px / semibold)
- **ไม่มี** subtitle หรือคำอธิบายในแถว header — ถ้ามีคำอธิบายให้วางไว้ใต้ชื่อ section ในส่วน content

---

## หน้าสร้าง / แก้ไข (Create / Edit Form)

ตัวอย่างอ้างอิง: หน้าเพิ่มสมาชิก / แก้ไขสมาชิก

### Header

แถว header แบ่งเป็น 2 ฝั่ง:

- **ซ้าย**: ปุ่มย้อนกลับ + ชื่อหน้า (เหมือน sub-page ทั่วไป)
- **ขวา**: Dropdown สถานะ (ใช้งาน / ปิดใช้งาน) + ปุ่ม "บันทึก"

### Form Card

Form ทั้งหมดอยู่ในกล่องขาว มีขอบโค้ง มีเงาอ่อนๆ

### Section (กลุ่ม field)

ภายใน form แบ่งเป็น section ย่อย แต่ละ section มีโครงสร้างดังนี้:

- **ซ้าย (30%)**: ชื่อกลุ่ม field (semibold) + คำอธิบายสั้นๆ (สีเทา)
- **ขวา (70%)**: กลุ่ม input field จัดเป็น grid 2 คอลัมน์
- แต่ละ section คั่นด้วยเส้นแนวนอน section สุดท้ายไม่มีเส้น

> **หมายเหตุ:** ชื่อ section **ห้ามใช้** `text-static-body` เนื่องจาก class นั้น set `font-weight: var(--font-body-weight)` (400) ทำให้ `font-semibold` ถูก override เสมอ — ให้ใช้ `text-base font-semibold` แทน

---

## Tab Strip

- **ความกว้างของ Tab**: ทุก tab ต้องกว้างเท่ากัน โดยยึดความกว้างขั้นต่ำจาก token `--tab-min-width` (160px) เพื่อให้ tab ที่สั้นที่สุดไม่แคบกว่า tab ที่ยาวที่สุด
- ใช้ `min-width: var(--tab-min-width)` และ `text-align: center` บนทุก tab button
- ข้อความใน tab จัดกึ่งกลางเสมอ

---

## Dropdown Menu — สีของรายการ Action

- รายการใน Dropdown Menu ทุกประเภท (แก้ไข, ลบ, จัดการ ฯลฯ) ใช้สีตัวอักษรปกติ (สีดำ / foreground) เหมือนกันทั้งหมด
- **ห้าม** ใส่สีแดง (`text-error`) บนรายการ "ลบ" หรือ action ที่เป็น destructive ใน dropdown
- ความเป็น destructive จะสื่อสารผ่าน `ConfirmDeleteDialog` ที่เปิดขึ้นมาหลังจากกดแทน

---

## Empty State ในตาราง (Table Empty State)

- เมื่อตารางไม่มีข้อมูล (ไม่ว่าจะเพราะยังไม่มีข้อมูล หรือ search/filter ไม่พบผลลัพธ์) ให้แสดง **row เดียว** ที่มีข้อความกลาง สีเทา (`text-muted-foreground`) เท่านั้น
- **ห้าม** เพิ่มไอคอน, คำอธิบายเพิ่มเติม, หรือปุ่ม action ใน empty state ของตาราง
- ไม่ต้องแยก UI ระหว่างเคส "ยังไม่มีข้อมูล" กับ "filter ไม่เจอ" — ใช้ข้อความ `noResults` เดียวกัน

```tsx
{paginatedItems.length === 0 && (
  <TableRow>
    <TableCell colSpan={N} className="text-center py-8 text-muted-foreground">
      {t('noResults')}
    </TableCell>
  </TableRow>
)}
```

Mobile card view ใช้ pattern เดียวกัน:

```tsx
{sorted.length === 0 && (
  <div className="rounded-2xl border bg-card px-4 py-8 text-center text-muted-foreground">
    {t('noResults')}
  </div>
)}
```

---

## Format ความยาววิดีโอ (Video Duration)

- แสดงความยาววิดีโอในรูปแบบ `HH:MM:SS น.` เสมอ (zero-padded 2 หลัก)
- input เก็บเป็นนาที (`videoLengthMin: number`) แล้วแปลงเมื่อแสดงผล

```ts
const h = Math.floor(min / 60)
const m = Math.floor(min % 60)
const display = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00 น.`
```

---

### กฎการจัด Field

**Label**
- ทุก field มี label อยู่เหนือ input เสมอ
- Field ที่บังคับกรอก ให้มีเครื่องหมาย `*` สีแดงต่อท้าย label

**Placeholder**
- ใช้รูปแบบ `กรอก + ชื่อ field` เสมอ เช่น "กรอกชื่อ", "กรอกเบอร์โทร"
- ไม่ใช้ตัวอย่างข้อมูลจริง เช่น "0812345678" หรือ "example@email.com"
- Dropdown ที่ให้เลือก ใช้ "เลือก + ชื่อ field" เช่น "เลือกจังหวัด"

**ความกว้าง Field**
- ปกติ: field จับคู่กัน 2 คอลัมน์ (50/50)
- Field ที่อยู่คนเดียวในแถว: ให้ยืดเต็มแถว (100%) ไม่ปล่อยว่างครึ่งแถว
- ถ้าตั้งใจให้ field อยู่ครึ่งแถว (เช่น field ที่ไม่จำเป็นต้องกว้าง): ปล่อยด้านขวาว่างได้
