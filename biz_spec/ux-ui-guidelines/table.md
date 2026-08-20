# UX/UI Guideline สำหรับ Table

> ⚠️ **This doc was written for a different app** (React + shadcn/ui `TableRow`/`DropdownMenuItem`, `table-fixed` + per-column `w-[...]`) — this repo's shared table is `components/Table/Data.vue` (Nuxt UI `UDropdownMenu`, plain `<table>`). Read for the underlying principle only. Note: §12.2 and the later "แยกให้ชัดว่า" section below both ask for a differentiated "no data yet" vs. "no search/filter results" empty state — this directly contradicts `bof-layout.md`'s own explicit "use the same message for both" rule, and this app's actual implementation follows the single-message rule (`global.noData`, `components/Table/Data.vue`). Until product actually wants two distinct messages, treat `bof-layout.md`'s rule as the one in effect here.

# DESKTOP #
## 1. วัตถุประสงค์
Table ใช้สำหรับแสดงข้อมูลที่มีโครงสร้างเป็นแถวและคอลัมน์ เพื่อช่วยให้ผู้ใช้เรียงลำดับ อ่านค่า ค้นหา และดำเนินการกับข้อมูลได้อย่างรวดเร็ว โดยควรออกแบบให้รองรับทั้งการอ่านตามแนวสายตา (scan), การตัดสินใจ, และการทำงานต่อเนื่องกัน

---

## 2. หลักการออกแบบ

### 2.1 Clarity First
- แสดงเฉพาะข้อมูลที่จำเป็นต่อการตัดสินใจ
- ชื่อคอลัมน์ต้องสั้น ชัด และสื่อความหมายตรง
- หลีกเลี่ยงข้อมูลที่ซ้ำกันในหลายคอลัมน์

### 2.2 Scanability
- ผู้ใช้ต้องสามารถสแกนอ่านข้อมูลได้เร็ว
- จัดเรียงข้อมูลให้เหมาะกับประเภทข้อมูล
- ใช้ spacing, divider, zebra row หรือ hover state เพื่อช่วยแยกแต่ละแถว

### 2.3 Actionability
- หาก table มี action เช่น View, Edit, Delete, Download ควรวางไว้ที่คอลัมน์ขวาสุด
- Action สำคัญควรให้เห็นได้ทันทีโดยไม่ต้อง hover เสมอ
- Action รองสามารถรวมไว้ในเมนู More ได้

### 2.4 Consistency
- รูปแบบคอลัมน์, spacing, alignment, icon, button และสถานะ ต้องสม่ำเสมอทั้งระบบ
- รูปแบบวันเวลา ตัวเลข ราคา และสถานะ ควรใช้มาตรฐานเดียวกัน

### 2.5 Responsive by Priority
- บนหน้าจอแคบ ต้องจัดลำดับความสำคัญของคอลัมน์
- ซ่อนคอลัมน์รองได้ แต่ห้ามซ่อนข้อมูลหลักที่จำเป็นต่อ task
- รองรับการเลื่อนในแนวนอนเมื่อหลีกเลี่ยงไม่ได้

---

## 3. โครงสร้างของ Table

Table ควรประกอบด้วยองค์ประกอบดังนี้:

1. **Table Title / Section Header**
   ระบุว่าตารางนี้คือข้อมูลอะไร

2. **Toolbar / Utility Area**
   ใช้สำหรับ Search, Filter, Sort, Bulk Action, Export หรือ Create

3. **Column Header**
   ชื่อคอลัมน์ที่เข้าใจง่าย และบอกให้รู้ว่าคอลัมน์ไหน sort ได้

4. **Row Data**
   ข้อมูลแต่ละรายการ โดยต้องมี visual hierarchy ที่ชัดเจน

5. **Row Action**
   ปุ่มหรือเมนูสำหรับจัดการรายการ

6. **Pagination / Load More / Infinite Scroll**
   เลือกใช้ตามลักษณะข้อมูลและบริบทของงาน

7. **Empty / Loading / Error State**
   ต้องออกแบบรองรับทุกสถานะ ไม่ใช่เฉพาะตอนมีข้อมูล

---

## 4. การจัดวางข้อมูลในคอลัมน์

### 4.1 Alignment
- **ข้อความทั่วไป**: ชิดซ้าย
- **ตัวเลข / จำนวน / ราคา / เปอร์เซ็นต์**: ชิดขวา
- **เบอร์โทรศัพท์**: แสดงในรูปแบบ `xxx-xxx-xxxx` เสมอ — ใช้ `phoneFormat()` จาก `useFormatter()` ห้ามแสดงตัวเลขดิบ
- **วันที่**: แสดงรูปแบบ `วว/ดด/ปป` (พ.ศ. 2 หลัก) เสมอ — ใช้ `dateFormat()` จาก `useFormatter()` (format: `DD/MM/BB`) ชิดซ้าย
- **วันที่ + เวลา**: ใช้ `dateTimeFormat()` จาก `useFormatter()` ชิดซ้าย
- **Status / Tag / Badge**: จัดให้อ่านง่ายและมีระยะห่างเหมาะสม
- **Action**: อยู่ในคอลัมน์สุดท้ายเสมอ — **header และ cell content จัดกลาง (`text-center`)** ห้ามใช้ชิดขวา
  - หัวคอลัมน์ใช้ `tc('actions')` (ภาษาไทย: "จัดการ", EN: "Actions") — ห้ามเว้นว่าง

### 4.2 Column Width

**ใช้ `table-fixed` + กำหนดความกว้าง `w-[...]` ทุกคอลัมน์โดยไม่มีข้อยกเว้น**

- เพิ่ม `className="table-fixed"` บน `<Table>` เสมอ เพื่อล็อก layout ไม่ให้ขยับเมื่อเปลี่ยนหน้า
- **ทุกคอลัมน์ต้องกำหนด `w-[...]`** — ห้ามทิ้งคอลัมน์ใดไว้โดยไม่กำหนดความกว้าง
  - เหตุผล: กับ `table-fixed` คอลัมน์ที่ไม่มีความกว้างจะกินพื้นที่ที่เหลือทั้งหมด ทำให้ layout พัง
  - เมื่อทุกคอลัมน์มีความกว้าง browser จะ scale ตามสัดส่วนที่กำหนด ทำให้ตารางดูสมดุลในทุกขนาดจอ
- คอลัมน์ชื่อ/รายละเอียดหลัก — ให้ค่า `w-[...]` ที่ใหญ่กว่าคอลัมน์รอง เพื่อให้ได้พื้นที่มากขึ้นตามสัดส่วน
- คอลัมน์รองทุกตัวกำหนดความกว้างตามเนื้อหาจริง (เช่น status, จำนวน, วันที่)
- หลีกเลี่ยงการตั้งคอลัมน์ทั้งหมดกว้างเท่ากันโดยไม่มีเหตุผล
- **ใช้ `w-[X%]` แทน `w-[Xpx]` เมื่อต้องการให้ตารางปรับสัดส่วนตามความกว้างหน้าจอ** — เหมาะกับตารางที่มีหลายคอลัมน์และต้องการให้ดูสมดุลในทุกขนาดจอ ส่วน `w-[Xpx]` ใช้เฉพาะคอลัมน์ที่มีเนื้อหาขนาดคงที่เท่านั้น เช่น Actions, Toggle
- **ทุกแถวต้องเป็น 1 บรรทัดเสมอ** — เซลล์ที่เนื้อหาอาจยาวต้องใส่ `truncate` เพื่อตัดข้อความแทนการ wrap

**คอลัมน์ที่มีขนาดตายตัวทั้งระบบ (System-wide fixed widths)**

คอลัมน์เหล่านี้มีเนื้อหาขนาดคงที่ทุกตาราง ต้องใช้ขนาดเดียวกันทั้งระบบ:

| คอลัมน์ | ขนาด | หมายเหตุ |
|---|---|---|
| จัดการ (Actions) | `w-[72px]` | meatball menu (`MoreHorizontal`) — จัดกลาง |
| Toggle (แสดงบนเว็บ) | `w-[90px]` | `<Switch>` — จัดกลาง |

> **เหตุผล:** หากไม่ lock column width ตาราง layout จะยืดหดตามเนื้อหาของแต่ละหน้า ทำให้สายตาผู้ใช้ต้องปรับตัวใหม่ทุกครั้งที่เปลี่ยนหน้า คอลัมน์จัดการและ toggle ใช้ขนาดเดียวกันทั้งระบบเพราะเนื้อหาไม่เปลี่ยน

### 4.3 Content Priority
- คอลัมน์สำคัญควรอยู่ด้านซ้าย เพราะตาเริ่มอ่านจากนั้น
- คอลัมน์ action และ metadata รองควรอยู่ด้านขวา
- คอลัมน์ที่ผู้ใช้ต้องเรียงลำดับบ่อยควรอยู่ใกล้กัน
- **คอลัมน์สถานะ (Status) ต้องอยู่ก่อนคอลัมน์จัดการ (Action) เสมอ** — ห้ามวางคอลัมน์ toggle หรือ meatball icon ก่อนสถานะ

---

## 5. Typography และ Visual Style

### 5.1 Typography

**ขนาดตัวอักษร (Font Size)**
- Header: `14px` (`text-sm`)
- Body: `14px` (`text-sm`)
- ใช้ขนาดเดียวกันระหว่าง header และ body เพื่อให้ table อ่านสะอาดตา
- หลีกเลี่ยงการใช้หลายขนาดใน table เดียว เช่น ไม่ควรมีทั้ง 12px และ 14px ผสมกันในตารางเดียวกัน

**น้ำหนักตัวอักษร (Font Weight)**

| ส่วน | Weight | Tailwind | หมายเหตุ |
|------|--------|----------|----------|
| Column Header | 500 | `font-medium` | หนักกว่า body เล็กน้อย เพื่อแยก header ออกจากข้อมูล |
| Body — ทั่วไป | 400 | `font-normal` | ใช้เป็น default สำหรับทุกเซลล์ |
| Body — Totals / Summary row | 500 | `font-medium` | เน้นแถวสรุปให้เด่นกว่า body ปกติ |

**แนวทางปฏิบัติ**
- ไม่ใช้ `font-semibold` (600) หรือ `font-bold` (700) ใน body cell ทั่วไป เพราะทำให้ visual weight ของ table หนักเกินไป
- ไม่ใช้ `font-mono` กับข้อมูลใน cell เพราะทำให้ font family ไม่สม่ำเสมอกับส่วนอื่นของระบบ ซึ่งใช้ Prompt เป็นฟอนต์หลัก
- ข้อมูลตัวเลข (ราคา, จำนวน, เปอร์เซ็นต์) ให้เพิ่ม `tabular-nums` เพื่อให้ digit แต่ละตัวกว้างเท่ากัน อ่านง่ายเมื่อเรียงกันในคอลัมน์

### 5.2 Row Height
- Dense table: 40–44 px
- Default table: 48–56 px
- หากมีหลายบรรทัดหรือ component ภายใน row อาจเพิ่มความสูงได้

### 5.3 Color Usage

**กฎหลัก: ใช้สีจาก `color-tokens.css` เท่านั้น — ห้ามใช้ shadcn alias**

| ส่วน | Token | Tailwind | ค่า |
|------|-------|----------|-----|
| Body cell (ทั่วไป) | `--color-black` | inherit / `text-foreground` | `#333C47` |
| Column Header | `--color-dark-gray` | `text-dark-gray` | `#666B75` |

- **ห้ามใช้ `text-muted-foreground`** — เป็น shadcn alias ไม่ใช่ชื่อ token โดยตรง ให้ใช้ `text-dark-gray` แทน
- **Body cell ทุก cell ต้องใช้สีดำ (`--color-black`) เสมอ** — ห้ามใช้ `text-gray` หรือสีเทาจางกว่านี้กับข้อมูลใน cell ไม่ว่าจะเป็นคอลัมน์หลักหรือรอง เพราะทำให้อ่านยากและ contrast ต่ำเกินไป
- Body cell ไม่ต้องระบุสีเพิ่มเติม — `TableCell` inherit สีจาก `body` ซึ่งใช้ `--color-black` อยู่แล้ว
- ข้อมูลรอง (secondary info) เช่น รหัส, sub-label ใช้ได้สูงสุดถึง `text-dark-gray` (`#666B75`) — ห้ามจางกว่านี้
- ใช้สีเน้นเฉพาะข้อมูลที่สำคัญ เช่น `text-error`, `text-success`, `text-warning`
- หลีกเลี่ยง table ที่มีสีมากเกินไปจนอ่านยาก
- Header background หรือ row hover ควร subtle และไม่ลดความชัดเจนของข้อมูล

### 5.4 Dividers and Surfaces
- ใช้เส้นหรือ spacing เพื่อแยกข้อมูลอย่างเบาๆ
- ไม่จำเป็นต้องใส่เส้นทุก cell หาก spacing ที่ดียังพอ
- ตาราง card ควรมี padding รอบนอกอย่างสมดุล

---

## 5.5 Row Reordering (Drag-and-Drop)

ตารางที่รองรับการเรียงลำดับแถวด้วยมือ ต้องใช้รูปแบบนี้เป็นมาตรฐาน:

- **ใช้ drag handle เท่านั้น** — แสดง `GripVertical` icon ที่คอลัมน์ซ้ายสุดก่อน content ทุกอย่าง
- ใช้ native HTML5 drag-drop events (`draggable`, `onDragStart`, `onDragEnter`, `onDragOver`, `onDrop`) — ไม่ใช้ third-party drag library เพิ่มเติม
- แสดง visual feedback ขณะลาก: `border-t-2 border-primary` บน row ที่เป็น drop target
- สี handle: `text-gray` ปกติ, `cursor-grab` / `active:cursor-grabbing`

**คอลัมน์ที่มีขนาดตายตัว (เพิ่มเติม)**

| คอลัมน์ | ขนาด | หมายเหตุ |
|---|---|---|
| Drag handle | `w-[24px]` | `GripVertical` icon — ไม่มี header label |

---

## 6. Sorting

- รองรับ sorting เฉพาะคอลัมน์ที่มีประโยชน์จริง
- แสดงสัญลักษณ์ sort ให้เห็นเมื่อ active
- ค่า default sort ต้องสอดคล้องกับ use case เช่น ล่าสุดก่อน
- หากใช้ multi-sort ต้องสื่อให้ผู้ใช้เข้าใจลำดับการ sort

**กฎการเรียงลำดับคอลัมน์สถานะ**

หลักการ: **รายการที่พร้อมใช้งานหรือเผยแพร่อยู่ต้องขึ้นมาก่อนเสมอ** — ผู้ใช้สนใจสิ่งที่ active อยู่มากที่สุด ไม่ควรต้องเลื่อนหาเอง

| ประเภทสถานะ | ลำดับ (บน → ล่าง) |
|---|---|
| เปิด / ปิด | active → inactive |
| เผยแพร่ / ร่าง / เก็บถาวร | active → draft → archived |

- ใช้กฎนี้เป็น **default sort** ทุกครั้งที่ไม่มีการ sort จาก user
- เมื่อ status เท่ากัน ให้เรียงตามเกณฑ์รอง เช่น วันที่สร้าง หรือ id

**คำแนะนำ**
- ควรใช้ sorting สำหรับวันที่, จำนวน, ราคา, ชื่อ, สถานะตามประเภท
- ไม่ควรทำให้ทุกคอลัมน์ sort ได้หากไม่มีประโยชน์

---

## 7. Filtering และ Search

### 7.1 Search
- ใช้เมื่อผู้ใช้มักค้นหาจาก keyword เช่น ชื่อ, รหัส, อีเมล
- Search box ควรวางเหนือ table และให้เห็นได้ง่าย
- ระบุ placeholder ให้ชัด เช่น `ค้นหาชื่อ, อีเมล หรือรหัสรายการ`

### 7.2 Filter
- ใช้สำหรับกรองข้อมูลตามสถานะ วันที่ ประเภท ช่วงเวลา หรือหมวดหมู่
- **ป้าย "ทั้งหมด" ใน dropdown filter** ให้ใช้รูปแบบ **"[ชื่อ field]ทั้งหมด"** เสมอ — ไม่ใช้ "ทุก[ชื่อ field]"
- **ข้อยกเว้น — Status Pill Buttons:** ตัวเลือก "ทั้งหมด" ใน pill ให้ใช้แค่ **"ทั้งหมด"** เพียงอย่างเดียว เพราะ label "สถานะ" กำกับอยู่เหนือ pill group แล้ว ไม่จำเป็นต้องซ้ำชื่อ field
- รูปแบบ UI, พฤติกรรม และกฎการออกแบบ filter ทั้งหมด → ดูที่ [filter.md](filter.md)

### 7.3 Applied Filter Visibility
- ผู้ใช้ต้องรู้ได้ทันทีว่าทำไมข้อมูลใน table จึงถูกกรอง

---

## 8. Row Interaction

### 8.1 Hover
- ใช้ hover state เพื่อช่วยระบุแถวที่กำลังโฟกัส
- สี hover ต้อง subtle และไม่ทำให้ content contrast ลดลง

### 8.2 Clickable Row
- ใช้เมื่อทั้ง row สามารถนำไปสู่ detail ได้
- หาก row clickable ต้องสื่อสัญญาณ เช่น cursor, hover, chevron หรือ link style
- หลีกเลี่ยงการทำให้ทั้ง row clickable พร้อมมีหลาย action ที่แทรกอยู่โดยไม่ตั้งใจ

### 8.3 Selected Row
- แสดง selected state ให้เห็นเมื่อรองรับ bulk action
- Checkbox ควรอยู่ด้านซ้ายและมี select-all ที่ header

---

## 9. Actions ใน Table

### 9.0 กฎหลัก: จำนวน Action ในคอลัมน์จัดการ
- **หาก action มีเพียง 1 รายการ** ให้แสดงเป็น icon button inline ได้
- **หาก action มีมากกว่า 1 รายการ** ต้องรวมทุก action ไว้ใน **meatball menu** (`⋯` — ไอคอน `MoreHorizontal`) เสมอ ห้ามวาง icon button หลายตัวเรียงกัน
  - ใช้ `DropdownMenu` + `DropdownMenuTrigger` + `DropdownMenuContent` + `DropdownMenuItem` จาก `@/components/ui/dropdown-menu`
  - Trigger เป็น `Button variant="ghost" size="icon"` ขนาด `size-8` พร้อม `MoreHorizontal` icon
  - `DropdownMenuContent` ให้ใช้ `align="end"`
  - แต่ละ item ใช้ icon + label text (ภาษาไทย) ร่วมกัน เช่น `<Pencil className="size-4" /> แก้ไข`
- กฎนี้ใช้ทั้ง **desktop table** และ **mobile card view**

### 9.0.1 ลำดับและ Separator ใน Meatball Menu (บังคับ)

เมื่อ menu มี "ดูรายละเอียด" ให้วางลำดับดังนี้เสมอ:

```
ดูรายละเอียด
─────────────  ← <DropdownMenuSeparator />
แก้ไข
ลบ            (ถ้ามี)
```

- **ดูรายละเอียด** ต้องอยู่บนสุดเสมอ — เป็น read-only action ที่ไม่เปลี่ยนแปลงข้อมูล
- **`<DropdownMenuSeparator />`** คั่นระหว่าง "ดูรายละเอียด" กับ action ที่เปลี่ยนแปลงข้อมูล (แก้ไข, ลบ) ทุกครั้ง
- **แก้ไข** และ **ลบ** อยู่ถัดจาก separator โดยไม่มี separator คั่นกันอีก
- กฎนี้ใช้กับทุก meatball menu ในระบบที่มี "ดูรายละเอียด" เป็นหนึ่งใน action

### 9.1 Inline Actions
เหมาะกับ action ที่ถูกใช้บ่อย เช่น:
- View
- Edit
- Approve
- Retry

### 9.2 Overflow Menu
เหมาะกับ action รอง เช่น:
- Duplicate
- Archive
- Export
- Delete

### 9.3 Destructive Action
- Action ที่เสี่ยง เช่น Delete ต้องไม่วางกลางทาง
- ควรมี confirmation เมื่อกดและย้อนกลับไม่ได้
- ไม่ควรวางปุ่มลบไว้เป็น primary action หลัก

**สีของตัวเลือกใน Overflow Menu (meatball menu)**
- ทุก action ใช้**สีดำ (text ปกติ)** เหมือนกันหมด รวมถึง "ลบ"
- **ห้ามใช้สีแดงสำหรับ "ลบ"** ใน dropdown menu
- เหตุผล: สีแดงใน dropdown สร้างความกังวลโดยไม่จำเป็น การ confirm ก่อนลบจริงคือกลไกป้องกันหลัก ไม่ใช่สีของตัวเลือก

---

## 10. Selection และ Bulk Actions

- ใช้เมื่อผู้ใช้ต้องการจัดการหลายรายการพร้อมกัน
- Checkbox ต้องมี 3 state:
  - Unchecked
  - Checked
  - Indeterminate
- เมื่อมีการเลือก row แล้ว ควรแสดง bulk action bar หรือ sticky toolbar
- ต้องระบุจำนวนรายการที่ถูกเลือกไว้ด้วย

ตัวอย่างข้อความ:
- `เลือกแล้ว 5 รายการ`
- `Delete 5 items`
- `Export selected`

---

## 11. Pagination, Load More, Infinite Scroll

### 11.1 Pagination
เหมาะกับข้อมูลธุรกิจทั่วไป เพราะ:
- ควบคุมจำนวนข้อมูลต่อหน้าได้
- อ้างอิงตำแหน่งข้อมูลได้ง่าย
- ช่วยเรื่อง performance

ควรมี:
- จำนวนรายการทั้งหมด
- จำนวนหน้า
- current page
- ปุ่ม previous / next

### 11.2 Load More
เหมาะเมื่อผู้ใช้ต้องการดูต่อเนื่อง แต่ไม่ต้องการรู้หมายเลขหน้า

### 11.3 Infinite Scroll
ควรใช้เฉพาะกรณีที่มีเหตุผลชัดเจน เช่น browsing data จำนวนมากใน feed

**ข้อควรระวัง**
- infinite scroll ไม่เหมาะกับ task ที่ต้อง compare, jump back, หรือ select หลายรายการต่างๆ

---

## 12. Empty, Loading, Error State

### 12.1 Loading State
- ใช้ skeleton row หรือ progress indicator
- ควรรักษาโครงสร้าง table เดิมไว้ เพื่อไม่ให้ layout กระแทก

### 12.2 Empty State
แยกให้ชัดระหว่าง:
- ยังไม่มีข้อมูลเลย
- ไม่มีผลลัพธ์จาก search/filter

ควรมี:
- ข้อความอธิบายสั้นๆ
- แนวทางถัดไป เช่น Clear filter หรือ Create item

### 12.3 Error State
- แสดงปัญหาให้เห็นได้ง่าย
- มีปุ่ม retry หากเหมาะสม
- หลีกเลี่ยงข้อความเทคนิคที่ผู้ใช้ทั่วไปไม่เข้าใจ

---

## 13. Responsive Design

### 13.1 Tablet / Mobile Strategy
เมื่อพื้นที่ไม่พอ ให้จัดการตามลำดับนี้:
1. ลดคอลัมน์รอง
2. ย่อข้อความด้วย truncation
3. ใช้ horizontal scroll
4. เปลี่ยนเป็น card/list view แทน table หากจำเป็นเกิน

### 13.2 Column Priority
ควรกำหนดระดับความสำคัญ เช่น:
- **High priority**: ชื่อรายการ, สถานะ, วันที่สำคัญ
- **Medium priority**: owner, category, count
- **Low priority**: metadata, created by, updated by

### 13.3 Mobile Alternative
บน mobile หากมีหลายคอลัมน์มาก ควรเปลี่ยนเป็น stacked data card แทน table แบบเต็มรูปแบบ

---

## 14. Accessibility

- รองรับการใช้งานด้วย keyboard
- Focus state ต้องมองเห็นได้
- ใช้ semantic table เมื่อข้อมูลเป็นตารางจริง
- Header ต้องสัมพันธ์กับ cell อย่างถูกต้อง
- หลีกเลี่ยงการสื่อสารด้วยสีอย่างเดียว
- Contrast ต้องผ่านมาตรฐานการอ่าน
- icon-only action ต้องมี tooltip หรือ aria-label

---

## 15. Content Guidelines

### 15.1 การตั้งชื่อคอลัมน์
- ใช้คำที่คุ้นเคยใน domain ของผู้ใช้
- หลีกเลี่ยงศัพท์ภายในที่ผู้ใช้ทั่วไปไม่เข้าใจ
- ไม่ควรยาวเกินไปจนทำให้คอลัมน์แคบเกิน

### 15.2 รูปแบบข้อมูล
- วันที่ควรใช้รูปแบบเดียวกัน เช่น `12 Mar 2026` หรือ `12/03/2026`
- เวลา ควรระบุ timezone หากข้อมูลเกี่ยวข้องหลายพื้นที่
- ตัวเลขควรมี comma separator เมื่อจำเป็น
- ราคา/สกุลเงิน ต้องแสดงหน่วยกำกับไว้ด้วย

### 15.3 Truncation
- ใช้เมื่อข้อความยาวเกินพื้นที่
- ควรมีวิธีดูข้อความเต็ม เช่น tooltip, detail panel หรือ expandable cell

---

## 16. พฤติกรรมที่ควรหลีกเลี่ยง

- แสดงข้อมูลมากเกินไปใน row เดียว
- ใช้หลายสี หลาย icon บน table เดียวกัน
- ซ่อน action สำคัญทั้งหมดไว้หลัง hover
- ใช้ infinite scroll กับข้อมูลที่ต้องเรียงลำดับหรือจัดการตำแหน่ง
- ทำ header ไม่ sticky ทั้งที่ข้อมูลยาวมากจนผู้ใช้หลงคอลัมน์
- ใช้คำย่อที่ผู้ใช้ไม่เข้าใจ
- ทำ mobile table โดยบีบทุกคอลัมน์จนอ่านไม่ได้

---

## 17. Recommendation สำหรับ Design System

### 17.1 Component ที่ควรมีในระบบ
- Table container
- Table header cell
- Table row
- Table cell
- Sort label
- Checkbox cell
- Status badge
- Row action menu
- Pagination
- Empty state
- Loading skeleton

### 17.2 Variants ที่ควรกำหนด
- Dense / Default / Comfortable
- Read-only / Selectable / Actionable
- Static header / Sticky header
- With border / Borderless

### 17.3 Token ที่ควรกำหนด
- Row height
- Cell padding
- Header background
- Hover background
- Selected background
- Border color
- Text color levels
- Badge colors

---

## 18. ตัวอย่างแนวทางการจัดลำดับคอลัมน์

ตัวอย่างสำหรับตารางรายการคำสั่งซื้อ:
1. Order ID
2. Customer Name
3. Order Date
4. Status
5. Total Amount
6. Payment Status
7. Last Updated
8. Action

เหตุผล:
- ข้อมูลระบุตัวรายการและข้อมูลหลักอยู่ซ้าย
- สถานะและยอดรวมเรียงลำดับเข้าถึงได้เร็ว
- action อยู่ขวาสุดตามความคาดหวังของผู้ใช้

> **กฎลำดับคอลัมน์ที่บังคับใช้ทั้งระบบ:** คอลัมน์ **สถานะ (Status)** ต้องอยู่ก่อนคอลัมน์ **จัดการ (Action)** เสมอ ไม่ว่าจะเป็น toggle switch หรือ meatball icon ก็ตาม

---

## 19. Checklist ก่อนปล่อยใช้งาน

- ชื่อคอลัมน์เข้าใจง่ายหรือไม่
- คอลัมน์สำคัญอยู่ลำดับต้นหรือไม่
- รองรับ loading / empty / error ครบหรือไม่
- sort และ filter ใช้งานได้จริงหรือไม่
- action สำคัญมองเห็นได้หรือไม่
- อ่านง่ายบนหน้าจอแคบหรือไม่
- รองรับ keyboard และ accessibility หรือไม่
- ข้อมูลแต่ละประเภทใช้ format สม่ำเสมอหรือไม่
- performance ดีเมื่อข้อมูลเยอะหรือไม่

---

## 20. สรุป
Table ที่ดีไม่ใช่แค่เรียงข้อมูลต่อกัน แต่ต้องช่วยให้ผู้ใช้ **หาเจอเร็ว อ่านง่าย ตัดสินใจได้เร็ว และลงมือทำต่อได้ทันที** การออกแบบจึงควรใช้ความชัดเจน ความสม่ำเสมอ การจัดลำดับความสำคัญของข้อมูล และรองรับทุกสถานะการใช้งานอย่างครบถ้วน

content = """# Mobile Responsive Table UX/UI Guideline
อ้างอิงแนวทางจากตัวอย่างหน้าจอแบบ mobile ที่แสดงข้อมูลรายการในรูปแบบ **stacked card table** แทนตารางแนวนอนแบบ desktop เพื่อให้ใช้งานบนหน้าจอขนาดเล็กได้ง่าย อ่านเร็ว และกด action ได้สะดวก

---

# MOBILE #
## 1. วัตถุประสงค์
บน mobile ไม่ควรย่อ table desktop ลงมาตรง ๆ จนคอลัมน์แคบและอ่านยาก  
สำหรับข้อมูลที่มีหลาย field ต่อ 1 record ควรเปลี่ยนเป็น **card-based responsive table** โดยยังคง logic ของ table เดิม คือ:

- 1 card = 1 row ของข้อมูล
- แต่ละบรรทัดใน card = label + value ของแต่ละ column
- action สำคัญต้องเข้าถึงง่าย
- status ต้องเห็นได้ทันทีตั้งแต่แรกมอง

---

## 2. แนวคิดการออกแบบจากตัวอย่าง
จากภาพตัวอย่าง รูปแบบที่เหมาะสมคือ:

- ใช้ **list of cards** แทน grid table
- แสดง **ข้อมูลสำคัญที่สุดไว้ด้านบนของ card**
- ใช้ **status badge** เพื่อให้ผู้ใช้สแกนสถานะได้เร็ว
- ใช้ **label-value layout** สำหรับข้อมูลรอง
- มี **primary action** ชัดเจนในแต่ละ card
- รองรับการเรียงลำดับ (Sort) ด้านบนก่อนรายการ

แนวทางนี้เหมาะกับข้อมูลประเภท:
- Offer / Order / Request
- Loan / Payment / Policy
- Ticket / Case / Approval
- รายการธุรกรรมหรือเอกสารที่มีหลาย field แต่ต้องการดูทีละรายการ

---

## 3. เมื่อไหร่ควรใช้ Mobile Responsive Table แบบ Card
ควรใช้เมื่อ:

- จำนวนคอลัมน์บน desktop มากเกิน 3–4 คอลัมน์สำหรับ mobile
- ข้อมูลแต่ละ row มีความสำคัญพอที่จะต้องอ่านแบบแยกชัดเจน
- ผู้ใช้ต้องการดูรายละเอียดของแต่ละรายการมากกว่าการ compare หลายแถวพร้อมกัน
- มี status และ action ต่อรายการที่ชัดเจน

ไม่ควรใช้เมื่อ:

- ผู้ใช้ต้องเปรียบเทียบค่าหลายรายการพร้อมกันแบบ matrix
- ตารางมีตัวเลขจำนวนมากที่ต้องดูเป็น column alignment
- งานนั้นต้องการ spreadsheet-like interaction

---

## 4. โครงสร้างของ Mobile Table
ลำดับองค์ประกอบที่แนะนำ:

1. **Page Header**
2. **Back / Navigation**
3. **Toolbar สำหรับ Sort / Filter**
4. **List Container**
5. **Record Card**
6. **Primary Action ต่อ Card**
7. **Optional Secondary Action / Expand / Detail**

ตัวอย่างโครงสร้างต่อ 1 card:

- Key metric หรือข้อมูลหลัก
- Status badge
- Label-value pairs
- CTA button

---

## 5. Information Hierarchy
จากตัวอย่าง ข้อมูลควรถูกจัดลำดับดังนี้:

### 5.1 Primary Information
หลักการ:
- ใช้ตัวอักษรใหญ่กว่า field อื่น
- วางไว้บนสุดของ card
- เป็น anchor point ของการสแกนสายตา

### 5.2 Status
หลักการ:
- ต้องอยู่ใกล้ข้อมูลหลัก
- ใช้ badge/chip เพื่อแยกจากข้อความทั่วไป
- สีต้องสื่อสถานะ แต่ห้ามพึ่งสีอย่างเดียว

### 5.3 Secondary Information
หลักการ:
- แสดงในรูปแบบ label ซ้าย / value ขวา
- ใช้ spacing ชัดเจน
- เรียงตามความสำคัญหรือ flow ธุรกิจ

### 5.4 Action
หลักการ:
- หากมีมากกว่า 1 action ให้ใช้ meatball icon (แนวตั้ง)
- มีแค่ 1 action ใช้ icon สื่อความหมายให้ตรงกับ action ได้เลย

---

## 6. Card Layout Guideline

### 6.1 Card Container
- ใช้ card แยกรายการอย่างชัดเจน
- มี background contrast จากพื้นหลัง
- มี corner radius ระดับกลางถึงสูง
- มี shadow บาง ๆ หรือ border เบา ๆ เพื่อแยกชั้นข้อมูล

### 6.2 Internal Spacing
แนะนำ:
- padding card: 16–20 px
- spacing ระหว่าง section: 12–16 px
- spacing ระหว่างแต่ละ row: 10–12 px

หลักการ:
- อย่าอัดข้อมูลแน่นเกินไป
- ระยะห่างต้องช่วยให้สแกนง่าย
- ปุ่ม action ต้องมีพื้นที่หายใจเพียงพอ

### 6.3 Row Divider
- ใช้เส้นแบ่งบาง ๆ ระหว่าง label-value rows ได้
- ไม่จำเป็นต้องใช้ทุกจุด หาก spacing ชัดพอ
- divider ควร subtle ไม่เด่นกว่าข้อมูล

---

## 7. Label-Value Pattern
สำหรับข้อมูลรองใน mobile card ควรใช้รูปแบบ:

- label อยู่ซ้าย
- value อยู่ขวา
- 1 แถวต่อ 1 field

เหมาะกับ:
- ID
- วันที่
- สถานะย่อย
- จำนวนงวด
- ประเภท
- ผู้รับผิดชอบ

### 7.1 กฎการจัดวาง
- label ใช้น้ำหนักปกติ
- value ควรเด่นกว่าเล็กน้อย
- value ชิดขวาเพื่อให้สแกนเร็ว
- หาก value ยาวเกิน ให้พิจารณา wrap หรือย้ายลงบรรทัดใหม่

### 7.2 สิ่งที่ควรหลีกเลี่ยง
- label ยาวเกินไป
- value หลายบรรทัดใน row เดียวโดยไม่ควบคุม spacing
- ใช้ alignment ไม่สม่ำเสมอในแต่ละ card

---

## 8. Sorting และ Filtering บน Mobile

### 8.1 Sort
จากตัวอย่างมี `Sort By: Offer Date`

แนวทาง:
- วางไว้เหนือรายการ
- ใช้ dropdown, bottom sheet หรือ modal selection
- ค่า default sort ต้องตรง use case เช่น ล่าสุดก่อน หรือใกล้หมดอายุก่อน

### 8.2 Filter
ถ้ามี filter ควรวางร่วมกับ sort หรืออยู่ใน toolbar เดียวกัน

แนวทาง:
- ใช้ icon + badge จำนวน filter ที่เลือก
- เปิดผ่าน bottom sheet จะเหมาะกับ mobile
- ต้องมี clear filter ชัดเจน

### 8.3 Applied State
ผู้ใช้ต้องรู้ว่ารายการที่เห็นตอนนี้ถูก sort/filter อย่างไร

ตัวอย่าง:
- Sort by: Offer Date
- Filter: Awaiting + Accepted

---

## 9. Status Badge Guideline

### 9.0 กฎหลัก
- **ใช้ Badge/pill เฉพาะคอลัมน์สถานะ (Status) เท่านั้น**
- คอลัมน์อื่น ๆ เช่น บทบาท, ประเภท, หมวดหมู่, tag, รูปแบบ ให้แสดงเป็น**ข้อความปกติ** (plain text) — ไม่ใช้ Badge, pill, หรือ chip

### 9.1 หลักการ
status ต้องสแกนได้เร็วที่สุดภายใน card

### 9.2 องค์ประกอบที่ดี
- ข้อความสั้น
- padding ภายในพอดี
- มุมโค้ง
- contrast อ่านง่าย
- รองรับกรณีข้อความยาวปานกลาง

### 9.3 ตัวอย่าง mapping
- Awaiting Response = warning / pending tone
- Accepted = success tone
- Rejected = error tone
- Expired = neutral / muted tone

### 9.4 ข้อควรระวัง
- อย่าใช้สีอ่อนจน contrast ต่ำ
- อย่าแสดง badge ใหญ่เกินไปจนแย่งความสนใจจากข้อมูลหลัก
- อย่าพึ่งแค่สี ต้องมีข้อความชัดเจนด้วย

---

## 10. Typography
- ให้เช็คขนาดของ font ตามไฟล์ design-syste.md

### 10.1 Recommended Scale
- Primary amount/title: 24–32 px หรือเด่นกว่าข้อมูลทั่วไปชัดเจน
- Label/value: 14–16 px
- Badge text: 12–14 px
- Button text: 14–16 px

### 10.2 Weight
- Primary value: medium
- Label: regular
- Value: medium หรือ semibold ตามความสำคัญ

### 10.3 Principles
- ใช้ขนาดตัวอักษรไม่มากเกินไปหลายระดับ
- ควรมี hierarchy ชัดระหว่าง primary, secondary, action
- ต้องอ่านได้ง่ายในมือเดียวและกลางแจ้ง

---

## 11. Data Formatting

### 11.1 Amount / Currency
- ใช้ separator ให้ถูกต้อง
- แสดงสกุลเงินให้ชัดเจนตามบริบท
- หากระบบมีหลาย locale ต้องใช้ format เดียวกันทั้งระบบ

### 11.2 Date
- วันที่ควรใช้รูปแบบเดียวกันทั้งหมด
- หลีกเลี่ยง format ปนกัน เช่น `3/29/2021` กับ `29 Mar 2021` ในหน้าเดียวกัน
- หากเกี่ยวข้องกับการตัดสินใจ ควรแยก label ให้ชัด เช่น Expiration Date

### 11.3 Boolean / Short Status
เช่น Down Payment:
- ใช้ Yes / No หรือ Paid / Unpaid ให้สม่ำเสมอ
- ถ้าจำเป็นค่อยใช้ icon เสริม

---

## 12. Responsive Behavior Rules

### 12.1 Desktop to Mobile Transformation
เมื่อ table desktop ถูกแปลงลง mobile:
- ซ่อน header row แบบเดิม
- เปลี่ยน row ให้เป็น card
- เปลี่ยนแต่ละ column เป็น label-value pair
- ย้าย action จากท้ายแถวไปไว้ท้าย card
- ย้าย status จาก column แยกไปไว้ด้านบนร่วมกับ primary info

### 12.2 Priority Mapping
ลำดับการแปลงที่แนะนำ:

- Column สำคัญที่สุด → top summary
- Status → badge บนสุด
- Supporting columns → label-value list
- Actions → bottom CTA

### 12.3 Sticky Controls
หากรายการยาว:
- อาจทำ toolbar sort/filter แบบ sticky ได้
- แต่ต้องไม่กินพื้นที่จอมากเกินไป

---

## 13. Empty, Loading, Error State

### 13.1 Loading
- ใช้ skeleton card
- รักษาขนาด card ใกล้เคียงของจริง
- อย่าใช้ spinner อย่างเดียวถ้าหน้ารายการมีหลาย item

### 13.2 Empty
แยกให้ชัดว่า:
- ไม่มีรายการเลย
- ไม่มีผลลัพธ์เพราะ filter/search

ควรมี:
- headline สั้น
- คำอธิบาย
- action ที่เหมาะสม เช่น Clear Filters หรือ Create New

### 13.3 Error
- แจ้งด้วยภาษาที่เข้าใจง่าย
- มี retry action
- ถ้าบาง card โหลดไม่ได้ ควรจัดการให้ทั้ง list ยังใช้งานต่อได้เมื่อเหมาะสม

---

## 14. Accessibility

- touch target ทุกปุ่มอย่างน้อย 44x44 px
- contrast ของข้อความและ badge ต้องอ่านได้
- ปุ่มต้องมี label ชัด ไม่ใช้ icon อย่างเดียวถ้าเลี่ยงได้
- รองรับ screen reader โดย:
  - อ่านเป็นรายการทีละ card
  - ระบุชื่อ field และ value อย่างถูกต้อง
- focus state ต้องมองเห็นเมื่อใช้งานด้วย keyboard ภายนอกหรือ assistive tech
- อย่าสื่อสถานะด้วยสีอย่างเดียว

ตัวอย่างการอ่านที่ดี:
- Offer Amount, 406 dollars and 27 cents
- Status, Awaiting Response
- Offer ID, 4693691121

---

## 15. Do / Don't

### Do
- ใช้ card ต่อ 1 record
- วางข้อมูลสำคัญไว้บนสุด
- ใช้ status badge ให้สแกนเร็ว
- จัดข้อมูลรองเป็น label-value
- มี CTA ชัดเจนในทุก card
- รองรับ sort/filter อย่างเข้าใจง่าย

### Don't
- ย่อ desktop table ลงมาแบบเดิมทั้งคอลัมน์
- ใส่ข้อมูลมากเกินใน card เดียว
- ใช้ปุ่มเล็กหรือ spacing แคบเกินไป
- ใช้ badge สีอ่อนจนอ่านยาก
- วาง action หลายตัวจนล้น card
- ใช้ floating action ที่บังข้อมูลสำคัญโดยไม่จำเป็น

---

## 18. QA Checklist ก่อนปล่อยใช้งาน
- ผู้ใช้มองเห็นข้อมูลหลักของแต่ละรายการภายใน 1 วินาทีหรือไม่
- status ของแต่ละ card แยกได้ชัดหรือไม่
- label-value alignment สม่ำเสมอหรือไม่
- ปุ่มกดง่ายด้วยนิ้วหรือไม่
- sort/filter ใช้งานง่ายบน mobile หรือไม่
- card ไม่แน่นเกินไปหรือไม่
- ข้อมูลยาวยังไม่พัง layout หรือไม่
- empty/loading/error state ครบหรือไม่
- screen reader อ่านลำดับข้อมูลได้ถูกต้องหรือไม่

---

## 19. สรุป
Mobile responsive table ที่ดีควรเลิกคิดแบบ “ย่อ table desktop ลงมา” และเปลี่ยนเป็น “จัดข้อมูลใหม่เพื่อ mobile-first” โดยใช้ **card-based layout**, **status-first scanning**, **label-value structure**, และ **clear per-item action** เพื่อให้ผู้ใช้ดูรายการได้ง่าย ตัดสินใจได้เร็ว และใช้งานได้สะดวกบนหน้าจอขนาดเล็ก
