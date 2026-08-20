# Detail Page Layout Guidelines

> ⚠️ **This doc was written for a different app** — the `/courses/[code]` canonical example below is a React + shadcn/ui LMS backoffice, not this repo. This is a Nuxt 4 + Nuxt UI 3 CRM (`pages/crm/*/[id].vue`, `pages/admin/users/[id].vue`); none of the component names below exist here. Read this only for the underlying layout principle, not the literal markup — `design-system.md` §5.4-adjacent conventions (back-arrow + inline `<h2>` header, consistent across all detail pages) reflect what's actually built.

อ้างอิงจากหน้า `/courses/[code]` เป็น canonical example  
ใช้เป็น guideline สำหรับทุกหน้า detail ในระบบ backoffice นี้

---

## 1. โครงสร้างหน้า

หน้า detail ทุกหน้าแบ่งเป็น 3 ส่วนหลักจากบนลงล่าง:

```
┌─────────────────────────────────────────────────┐
│  [← Back]  Title + Badge + Tags   [Action Btn]  │  ← Page Header
├─────────────────────────────────────────────────┤
│  [Tab A]  [Tab B]  [Tab C]                      │  ← Tab Bar (ถ้ามี)
├──────────────────────────┬──────────────────────┤
│                          │                      │
│   Main Content           │   Sidebar            │  ← เนื้อหาหลัก (ถ้ามี Sidebar)
│   (กว้างกว่า ~60%)       │   (~40%, ติดหน้าจอ) │
│                          │                      │
└──────────────────────────┴──────────────────────┘
```

---

## 2. Page Header

ส่วนหัวของทุกหน้า detail ประกอบด้วยองค์ประกอบเดียวกัน จัดเรียงซ้ายไปขวา:

```
[← กลับ]   [ชื่อรายการ]   [Status Badge]   [Tags]   ···   [ปุ่ม แก้ไข]
```

### กฎแต่ละองค์ประกอบ

| องค์ประกอบ | กฎ |
|---|---|
| ปุ่มกลับ | ไอคอนลูกศรซ้าย, กดแล้วกลับไปหน้า list เสมอ — ใช้ `variant="ghost"` + `className="p-0 hover:bg-transparent group cursor-pointer"` และ icon ใช้ `className="size-5 group-hover:text-primary transition-colors"` (ไม่มี background hover, ลูกศรเปลี่ยนสี primary เมื่อ hover) |
| ชื่อ (Title) | แสดง รหัส + ชื่อ เช่น "PHY-001 ฟิสิกส์ ม.ปลาย", ตัวอักษรใหญ่ |
| Status Badge | แสดงสถานะทันทีหลังชื่อ ใช้สี badge มาตรฐาน ไม่ออกแบบเอง |
| Tags | แสดงเมื่อมีข้อมูล วางหลัง Badge, มีไอคอน tag นำหน้า |
| ปุ่ม Action | ชิดขวาสุดของ header, ปุ่มหลักคือ "แก้ไข" (outline style + ไอคอนดินสอ) |

> **หมายเหตุ:** Header ของ detail page สร้างแบบ inline เอง ไม่ใช้ PageHeader component (PageHeader ใช้กับหน้า list เท่านั้น)

---

## 3. Tab Bar

ใช้เมื่อ detail page มีเนื้อหา **2 ประเภทขึ้นไปที่แตกต่างกันชัดเจน** เช่น รายละเอียด + รายชื่อสมาชิก

### ลักษณะ Tab

- Tab ที่เลือกอยู่: มีเส้นขีดเด่นด้านล่าง + ตัวอักษรสีเข้ม
- Tab ที่ไม่ได้เลือก: ตัวอักษรสีจาง
- วางแนวนอน แตะกับเส้นขอบด้านบนของเนื้อหา

### เมื่อไม่ต้องใช้ Tab

- หน้าที่มีเนื้อหาประเภทเดียว — ใช้ Section Divider (เส้นแบ่ง) แทน
- ถ้ามี tab เดียว — ไม่ต้องใส่ tab เลย

---

## 4. Two-Column Layout (เนื้อหาหลัก + Sidebar)

ใช้เมื่อมี **ข้อมูลเสริมที่ผู้ใช้ต้องการเห็นตลอดเวลา** ขณะที่ scroll ดูเนื้อหาหลัก

### โครงสร้าง

| Column | สัดส่วน | พฤติกรรม |
|---|---|---|
| เนื้อหาหลัก (Main) | ~60% | scroll ตามปกติ |
| Sidebar | ~40% | ติดหน้าจอ (sticky) ไม่ขยับตาม scroll |

### เมื่อไม่ต้องใช้ Two-Column

- Tab ที่แสดงตาราง (table) ขนาดใหญ่ — ใช้ full-width แทน เพื่อให้ตารางมีที่แสดงเยอะ
- หน้าที่เน้น form หรือมีตารางเดียว — ใช้ single column

---

## 5. เนื้อหาหลัก — Section Pattern

เนื้อหาหลักแบ่งเป็น section ย่อย แต่ละ section มีโครงสร้างเดียวกัน:

- **หัว section:** ชื่อ section ตัวอักษรกึ่งหนา
- **เนื้อหา section:** ตามประเภทข้อมูล (ดูตารางด้านล่าง)
- **เส้นแบ่ง (divider):** ขีดเส้นบางๆ ระหว่าง section

### ประเภทเนื้อหาใน Section

| ประเภท | ลักษณะ |
|---|---|
| รูปภาพ / Cover | อัตราส่วน 16:9, มุมโค้ง, มีรูป fallback เมื่อไม่มีรูป |
| ข้อความ / Description | ขนาดตัวอักษรปกติ, รักษา line break ตามต้นฉบับ |
| Card กลุ่มข้อมูล | กรอบขอบโค้ง, padding สม่ำเสมอ |
| Grid ข้อมูล | 2 คอลัมน์, label-value คู่กัน |
| ตารางขนาดเล็กใน section | กรอบขอบ + เส้นแบ่งแถว (ไม่ใช้ TableCard) |

### Fallback (เมื่อไม่มีข้อมูล)

- ทุก section ต้องมีข้อความ fallback สีจาง เมื่อไม่มีข้อมูล
- ห้ามแสดง section เปล่าๆ โดยไม่มีข้อความบอก

---

## 6. Sidebar

Sidebar แสดงข้อมูลสรุปหรือข้อมูลอ้างอิงที่ผู้ใช้ต้องการดูตลอดเวลา เช่น เนื้อหาคอร์ส, สถิติ, ลิงก์ด่วน

### โครงสร้าง Card ใน Sidebar

- กรอบโค้ง + padding ด้านใน
- หัว card: ชื่อ (ซ้าย) + ข้อมูลสรุป เช่น จำนวน (ขวา)
- รายการ item: ไอคอน + ข้อความ, เว้นระยะสม่ำเสมอ
- ถ้ารายการยาว: ซ่อน/แสดงด้วย expand-collapse (ไอคอน chevron)

### กฎ

- ไม่ใช้ TableCard ใน Sidebar
- Sidebar ติดหน้าจอ (sticky) มีความสูงสูงสุดเท่าหน้าจอ และ scroll ในตัวเองได้

---

## 7. Table Tab

Tab ที่แสดงรายการข้อมูล (เช่น รายชื่อสมาชิก, รายการคำสั่งซื้อ) ใช้ full-width และมีโครงสร้างแน่นอน:

```
[Search Input]                     [ปุ่ม Action (disable เมื่อไม่มี selection)]
┌──────────────────────────────────────────────────────────────────────────┐
│  ☐  │  ชื่อ  │  วันที่  │  สถานะ  │  ...  │  จัดการ                    │
├──────────────────────────────────────────────────────────────────────────┤
│  ☐  │  ...                                                               │
└──────────────────────────────────────────────────────────────────────────┘
                                                          [Pagination]
```

- Search ชิดซ้าย, ปุ่ม action ชิดขวา, ปุ่ม disable เมื่อยังไม่มีการเลือก row
- ตาราง full-width (ไม่ใช้ two-column ใน tab ที่มีตาราง)

> **กฎตาราง, Checkbox, Column width, Actions dropdown, Status Badge, Pagination** → ดูที่ [table.md](table.md) ทั้งหมด ใช้ระบบเดียวกัน ไม่มีข้อยกเว้นสำหรับ detail page

---

## 8. Status Badge

> ดูกฎทั้งหมดที่ [table.md — ข้อ 9](table.md) ใช้ระบบเดียวกันทั้ง list page และ detail page ไม่มีข้อยกเว้น

---

## 9. Progress Bar

ใช้สำหรับแสดง % ความคืบหน้า (เช่น progress การเรียน)

| % | สีแถบ |
|---|---|
| 80% ขึ้นไป | เขียว |
| 50–79% | ส้ม |
| น้อยกว่า 50% | เทาเข้ม |

โครงสร้าง: แถบยาว (full width) + ตัวเลข % ชิดขวา

---

## 10. ไอคอน

ใช้จาก `lucide-react` เท่านั้น

| บทบาท | ไอคอน |
|---|---|
| กลับ (Back) | ArrowLeft |
| แก้ไข | Pencil |
| ลบ | Trash2 |
| เพิ่ม | Plus |
| เมนู actions | MoreHorizontal |
| ขยาย / ยุบ | ChevronDown / ChevronRight |
| ดูรายละเอียด | Eye |
| Tags | Tags |
| คอร์ส / บทเรียน | BookOpen |
| วิดีโอ | Video |
| เอกสาร | FileText |
| เวลา / ชั่วโมง | Clock |

---

## 11. Navigation

| การกระทำ | ปลายทาง |
|---|---|
| กดปุ่ม "กลับ" | หน้าก่อนหน้าจริงใน in-app history (เช่น มาจาก Deal detail → กลับไป Deal detail) ถ้าไม่มี history ใน app (เปิดลิงก์ตรง, refresh หน้า) → fallback ไปหน้า list ของ menu นั้น (`/[menu]`) — ใช้ `useBackNavigation('/[menu]')` |
| กดปุ่ม "แก้ไข" | หน้า edit (`/[menu]/[id]/edit`) |
| กด "ดูรายละเอียด" ใน dropdown (cross-link) | หน้า detail ของ menu อื่น (`/[other-menu]/[id]`) |

> **เหตุผลของการเปลี่ยนจาก "กลับ = list เสมอ":** เมื่อ record หนึ่งลิงก์ไปยัง record อื่น cross-menu (เช่น Deal detail → Company detail), ปุ่ม "กลับ" ที่ไป list เสมอจะทำให้ผู้ใช้หลุดจาก context เดิม (ต้องหา Deal นั้นใหม่ในหน้า list) ปุ่ม "ยกเลิก" ในหน้า create/edit ก็ใช้ pattern เดียวกัน

---

## 12. การปรับ Layout ตาม Menu

Layout หลักเหมือนกันทุก menu แต่ปรับ composition ให้เหมาะสมกับเนื้อหา:

| Menu | Two-Column | Tabs | Sidebar ประเภท | หมายเหตุ |
|---|---|---|---|---|
| **Courses** | ✅ (60:40) | ✅ รายละเอียด + สมาชิก | Lesson tree (expand/collapse) | ต้นแบบหลัก |
| **Members** | ❌ | ✅ ข้อมูล + ประวัติ | — | เน้น profile + ประวัติ order/คอร์ส |
| **Orders** | ✅ (60:40) | ❌ | สรุปยอด + payment | Sidebar แสดงสรุปการชำระเงิน |
| **Teachers** | ✅ (60:40) | ✅ profile + คอร์ส | สรุปรายได้ / รายชื่อคอร์ส | |
| **Promotions** | ❌ | ❌ | — | เนื้อหาไม่ซับซ้อน ใช้ single column |
| **Learning Plans** | ✅ (67:33) | ❌ | สรุปแผน / schedule | |
| **Articles / CMS** | ❌ | ❌ | — | Full-width preview + meta |

### หลักการตัดสินใจ Layout

```
มีข้อมูลที่ต้องเห็นตลอดขณะ scroll?
  → ใช่ → Two-column (main + sticky sidebar)
  → ไม่  → Single column

เนื้อหาแบ่งเป็น 2 ประเภทชัดเจนขึ้นไป?
  → ใช่ → เพิ่ม Tab Bar
  → ไม่  → ใช้ section divider แทน

Tab นั้นมีตารางขนาดใหญ่?
  → ใช่ → Full-width (ไม่ two-column ใน tab นั้น)
  → ไม่  → สามารถใช้ two-column ภายใน tab ได้
```

---

## 13. Spacing

| ตำแหน่ง | ระยะห่าง |
|---|---|
| Padding รอบหน้า | 24px (p-6) |
| ระหว่าง section หลัก | 24px (gap-6) |
| ภายใน card / section | 16px (gap-4) หรือ 12px (gap-3) |
| ภายใน list item | 8px (gap-2) |
| ระหว่างสอง column | 24px (gap-6) |

---

## 14. สิ่งที่ห้ามทำ

- ❌ ห้ามสร้าง badge สีหรือ style เองแทน badge มาตรฐาน
- ❌ ห้าม hardcode สีตรงๆ เช่น `green`, `red-100` — ใช้ design token เสมอ
- ❌ ห้ามมี tab เดียว — ถ้ามีแค่ 1 view ให้ใช้ section layout
- ❌ ห้าม tab ซ้อน tab (nested tabs)
- ❌ ห้ามใช้ two-column เมื่อ sidebar ไม่มีข้อมูลที่จำเป็นต้องเห็นตลอด
- ❌ ห้าม render section เปล่าโดยไม่มี fallback text
