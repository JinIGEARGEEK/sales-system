# Filter — กฎการออกแบบ

> ⚠️ **This doc was written for a different app** (React + shadcn/ui Popover-based filter chrome) — this repo's list-page filters are plain `UCard` + `InputText`/`InputSelect`/`CrmStatusPill` (see `design-system.md` §5.3-5.4). Read for the underlying principle (filters near the trigger, results visible without closing anything) only.

## หลักการ

Filter ควรอยู่ **ใกล้กับปุ่มที่กด** ที่สุด เพื่อให้ผู้ใช้ไม่ต้องย้ายสายตาหรือมือไกลจากจุดที่เริ่มต้น และควรเห็น **ผลลัพธ์บนตารางได้ทันที** โดยไม่ต้องปิดหน้าต่างใดก่อน

---

## รูปแบบที่ใช้: Popover (กล่องโผล่ข้างล่างปุ่ม)

กดปุ่ม "ตัวกรอง" แล้วกล่องเลือกจะโผล่ลงมาใต้ปุ่มนั้นเลย ไม่ใช่เปิด panel ด้านข้าง (Sheet) หรือ modal กลางจอ

**ทำไมถึงดีกว่า Sheet หรือ Modal**

| | Popover (ปัจจุบัน) | Sheet / Modal |
|---|---|---|
| ระยะสายตา | สั้น อยู่ใกล้ปุ่ม | ไกล ต้องมองไปอีกด้าน |
| เห็นตารางด้านหลัง | ได้ตลอด | ถูกบังหมด |
| จำนวน step | กด 1 ครั้งได้ผลทันที | กด → เลือก → ปิด |
| ความรู้สึก | เบา เร็ว | หนัก เหมือนเข้าหน้าใหม่ |

---

## ลำดับ Filter ใน Popover

เรียงจาก **ใช้บ่อยที่สุด → น้อยที่สุด** และ **ช่วย narrow ผลลัพธ์ได้เร็วที่สุดก่อน**

**สถานะ** — ตัวกรองที่ใช้บ่อยที่สุด แสดงเป็นปุ่มทันที 

---

## รูปแบบ Filter แต่ละประเภท

### สถานะ → ปุ่ม (Pill Buttons)

ใช้ **เฉพาะ filter "สถานะ"** เท่านั้น เพราะตัวเลือกมีจำกัดและคงที่ (2–3 ค่า) กด 1 ครั้งได้เลยไม่ต้องเปิด dropdown

- ความสูง: 32px (`h-8`)
- ความโค้ง: เท่ากับปุ่มทั่วไปในระบบ (`rounded-[var(--radius)]`)
- ตัวเลือกแรก: **"ทั้งหมด"** เสมอ (pill button ไม่ต้องระบุชื่อ field ซ้ำ เพราะ label กำกับอยู่ด้านบนแล้ว)
- ค่าเริ่มต้น: "ทั้งหมด" active ไว้ก่อน
- **แสดงบรรทัดเดียวเสมอ** (`flex` โดยไม่มี `flex-wrap`) — status pills เป็นตัวกำหนดความกว้าง popover

**สี Active** (`var(--color-secondary)` = `#12243A` navy):
- พื้นหลัง: `bg-[var(--color-secondary-bg)]`
- border + text: `border-[var(--color-secondary)] text-[var(--color-secondary)]`

**สี Inactive:**
- border: `border-border`
- พื้นหลัง: `bg-white`

### Filter อื่นๆ → Dropdown (Select) ใน Popover

Filter ที่ไม่ใช่สถานะ (เช่น ประเภท, หมวดหมู่, แผนก, ตำแหน่ง) ให้ใช้ `<Select>` เสมอ ไม่ว่าจะมีตัวเลือกกี่รายการ

- ใช้ `<Select>` วางใน Popover ร่วมกับ filter อื่น
- ความกว้าง: `w-full` (ขยายเต็ม Popover)
- ค่าเริ่มต้น: `"[ชื่อ field]ทั้งหมด"` เช่น "ประเภททั้งหมด", "หมวดหมู่ทั้งหมด"

### Dropdown (Select) — วางตรงใน Toolbar (กรณีพิเศษ)

ใช้เมื่อหน้านั้นมี **filter ตัวเดียวเท่านั้น** และไม่ใช่สถานะ

- วาง `<Select>` ตรงใน toolbar ข้างช่อง Search — **ไม่ต้องใช้ Popover**
- ความกว้าง: `w-[160px]`

**เหตุผล:** เมื่อมี filter เพียงตัวเดียว การใช้ Popover เพิ่ม step โดยไม่จำเป็น

### Scope Switch (แถวบนสุด แยกจาก "สถานะ") — added 2026-09-15, revised 2026-09-15

ใช้เมื่อ record ในตารางมีสอง "โหมดการดู" ที่ไม่ใช่แค่ narrow ผลลัพธ์ แต่เปลี่ยนความหมายของ filter อื่นทั้งหมดข้างล่าง — เช่น หน้า Leads (`pages/crm/leads/index.vue`) แยก **"Active Leads"** กับ **"Converted"** ไว้เป็นแถวสวิตช์แยกต่างหาก เหนือ card ตัวกรองที่มี pill "สถานะ" (New/Contacted/Qualified/Disqualified) อยู่ข้างใน

- **ใช้ `UTabs` แบบ page-level (นอก `UCard` ตัวกรอง) ไม่ใช่ `CrmStatusPill`** — เดิมทั้งสองแถวใช้ component เดียวกัน (`CrmStatusPill` ซ้อนกัน 2 แถว) ทำให้ดูเหมือน filter ประเภทเดียวกันซ้ำกัน แก้โดยแยกให้ scope ใช้ `UTabs` ส่วน pill "สถานะ" ยังอยู่ใน `CrmStatusPill` เหมือนเดิม — คนละ visual language ชัดเจนว่าคนละมิติ
  - **หมายเหตุความหมาย (ไม่ใช่แค่สไตล์):** ที่อื่นในแอปนี้ `UTabs` แปลว่า "สลับทั้งมุมมอง" จริง ๆ (เช่น ตัวสลับ Projects/Products บน `pages/crm/projects/index.vue` — คนละ `UCard` ฟิลเตอร์, คนละ `TableData`, คนละคอลัมน์, คนละ store กันไปเลย) ส่วน Leads scope ที่นี่ยังคง**เป็น query param ตัวเดียวที่ป้อนเข้า table/columns ชุดเดียวกัน** (`exclude_converted`/`only_converted` ใน `buildParams()`) เหมือน `statusFilter`/`sourceFilter` ทุกประการ — ที่ยืม `UTabs` มาใช้เป็นการยืม "หน้าตา" ที่ดูแยกจาก `CrmStatusPill` ชัดเจน ไม่ได้แปลว่ากรณีนี้เป็น view-switch แบบ Projects/Products จริง ๆ ถ้าจะเพิ่ม scope-toggle แบบนี้อีกที่อื่น ให้ตรวจสอบก่อนว่าเป็น filter param (แบบ Leads) หรือ view-switch จริง (แบบ Projects) — อย่าใช้ `UTabs` เป็นค่าเริ่มต้นสำหรับ toggle ทุกชนิดโดยไม่เช็คก่อน
- ใส่ `icon` ให้แต่ละ tab (เช่น person-search / handshake) ช่วยให้สแกนด้วยตาได้เร็วขึ้นโดยไม่ต้องอ่าน label
- เมื่อ scope เปลี่ยนไปเป็นโหมดที่ pill "สถานะ" เดิมใช้ไม่ได้อีกต่อไป (เช่น Lead ที่ convert แล้ว status จะ freeze ตายตัว ไม่ใช่ filter ที่มีประโยชน์อีก) ให้ **ซ่อน pill สถานะไปเลย** แทนที่จะปล่อยให้กดได้แต่ไม่มีผล
- ไม่ต้อง reset ค่า filter ที่ซ่อนไว้ — เก็บค่าเดิมไว้เผื่อผู้ใช้กลับมาที่ scope เดิม

---

## ปุ่มเปิด Filter

- แสดง **icon + ข้อความ "ตัวกรอง"** เสมอ — ไม่ใช่ icon อย่างเดียว
- ใช้ `variant="outline"` และ `gap-2` ระหว่าง icon กับข้อความ
- icon: `SlidersHorizontal` (lucide)

---

## Badge แจ้งจำนวน Filter ที่เปิดอยู่

บนปุ่ม "ตัวกรอง" จะมีวงกลมแสดงจำนวน filter ที่เลือกอยู่ (ไม่นับ "ทั้งหมด")

- แสดงเฉพาะเมื่อมี filter ที่เปิดอยู่อย่างน้อย 1 ตัว
- ซ่อนเมื่อทุกตัวกลับเป็น "ทั้งหมด"

---

## ปุ่มล้างตัวกรอง

- อยู่ด้านล่างสุดของ Popover
- กดแล้ว reset ทุก filter กลับเป็นค่าเริ่มต้น ("ทั้งหมด") ในครั้งเดียว **และปิด Popover ทันที**
- ใช้รูปแบบปุ่ม outline เพื่อให้ไม่ดูเด่นเกินไป

> **เหตุผล:** เมื่อล้างตัวกรองแล้ว ผู้ใช้ต้องการดูผลลัพธ์บนตารางทันที ไม่จำเป็นต้องเห็น Popover ค้างอยู่

---

## ขนาด Popover

- ความกว้าง **ขยายตาม status pills** (`w-auto min-w-[300px]`) — กว้างพอให้ status pills แสดงครบบรรทัดเดียวโดยไม่ต้อง scroll
- ความกว้างขั้นต่ำ **300px** (`min-w-[300px]`) — ป้องกัน Popover แคบเกินไปเมื่อตัวเลือกน้อย
- เนื้อหาอื่น เช่น tag chips ขยายเต็มความกว้าง Popover และตกบรรทัดได้เองเมื่อเนื้อหาเกินแนว
