# Modal (Dialog) — กฎการออกแบบ

## โครงสร้างหลัก

Modal ทุกหน้าแบ่งออกเป็น **3 ส่วนชัดเจน** คั่นด้วยเส้น:

```
┌──────────────────────┐
│  หัวข้อ              │  ← Header
├──────────────────────┤  เส้นแบ่งชิดขอบซ้าย-ขวา
│  เนื้อหา / ฟอร์ม     │  ← Body
├──────────────────────┤  เส้นแบ่งชิดขอบซ้าย-ขวา
│  ปุ่ม CTA            │  ← Footer
└──────────────────────┘
```

---

## Header (ส่วนหัว)

- หัวข้อ **ชิดซ้าย** เสมอ
- ปุ่มปิด (×) อยู่ **ชิดขวา** และอยู่ระดับเดียวกับหัวข้อ
- มีเส้นแบ่งด้านล่างชิดขอบ modal

---

## ความสูงของ Modal

- Modal ที่มี field เยอะ (เช่น ฟอร์มที่มีมากกว่า 4 field) ให้กำหนด **ความสูงสูงสุดที่ 80vh** (`max-h-[80vh]`)
- ใช้ `flex flex-col` บน `DialogContent` เพื่อให้ header/footer fixed และ body scroll ได้
- **Header และ Footer ต้องไม่เลื่อน** — ใช้ `shrink-0` บนทั้งสองส่วน
- **Body scroll ภายใน** — ใช้ `overflow-y-auto overflow-x-hidden flex-1 min-h-0` บน body wrapper
- Modal ที่มี field น้อย (≤ 4 field) ไม่จำเป็นต้องกำหนด max-h เพราะ content ไม่เกิน viewport

```tsx
// โครงสร้าง implementation
<DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
  <DialogHeader className="shrink-0 ...">...</DialogHeader>
  <form className="flex flex-col flex-1 min-h-0">
    <div className="flex-1 overflow-y-auto overflow-x-hidden ...">
      {/* fields */}
    </div>
    <DialogFooter className="shrink-0 ...">...</DialogFooter>
  </form>
</DialogContent>
```

---

## Body (เนื้อหา / ฟอร์ม)

- มี padding รอบด้าน 20px
- ระยะห่างระหว่าง field แต่ละช่องเท่ากัน

---

## Footer (ปุ่ม CTA)

- มีเส้นแบ่งด้านบนชิดขอบ modal
- ปุ่มกว้างเต็ม **แบ่งครึ่งเท่ากัน** เสมอ
- ลำดับปุ่ม: **ยกเลิก อยู่ซ้าย** — **action หลัก อยู่ขวา**
- ปุ่ม action หลักใช้คำว่า **"บันทึก"** เสมอ ทั้งในโหมดสร้างใหม่และแก้ไข — ห้ามใช้ "สร้าง" หรือ "อัปเดต"

---

## สถานะ: สร้างใหม่ vs แก้ไข

| | สร้างใหม่ | แก้ไข |
|---|---|---|
| หัวข้อ Modal | "เพิ่ม..." | "แก้ไข..." |
| ข้อมูลใน field | **ว่างทั้งหมด** | โหลดข้อมูลเดิมมาแสดง |
| ปุ่ม action | "บันทึก" | "บันทึก" |

---

## Dropdown ใน Form

- แสดงรายการด้านล่างกล่องเสมอ ไม่ขึ้นด้านบน
- ถ้ารายการเยอะ กำหนดความสูงสูงสุดไว้แล้ว scroll ภายใน
- เมื่อยังไม่ได้เลือก ให้แสดง placeholder เช่น "เลือกแผนก", "เลือกตำแหน่ง"
- ห้ามมีช่องค้นหาใน dropdown (ยกเว้นเมนูหลัก)

---

## Toggle (สวิตช์เปิด-ปิด)

- สีเขียว = เปิดใช้งาน
- สีเทา = ปิดใช้งาน
- แสดง label ชิดซ้าย, toggle ชิดขวา ในแถวเดียวกัน (`flex items-center justify-between`)
- **ไม่มี border** รอบแถว toggle — ใช้แค่ `py-3` เพื่อให้ระยะห่างกับ field อื่นสม่ำเสมอ
- ❌ ห้ามใส่ `border` หรือ `bg` รอบแถว toggle เพราะทำให้ดูเหมือน input field และสร้างความสับสน

---

## ระหว่างกำลังบันทึก

- ปุ่ม action หลักจะ **กดไม่ได้** ระหว่างรอผล
- แสดงไอคอน loading หมุนบนปุ่ม

---

## ความโค้งมน

- มุมโค้งของ modal **เท่ากับมุมโค้งของปุ่ม** ทุก modal

------------------------------------------------

## Modal ยืนยันการลบ (Confirm Delete)

ใช้โครงสร้างเดียวกับ modal ฟอร์มทุกอย่าง แต่มี body เป็นข้อความเตือนแทนฟอร์ม

| | ค่า |
|---|---|
| ขนาด | เล็กกว่าปกติ (`sm:max-w-sm`) |
| หัวข้อ | "ยืนยันการลบ" (หรือกำหนดเองได้) |
| เนื้อหา | ดูรูปแบบข้อความด้านล่าง |
| ปุ่มซ้าย | "ยกเลิก" (outline) |
| ปุ่มขวา | **"ยืนยัน"** เป็น default — กำหนดเองได้ — ใช้สี **primary ปกติ ไม่ใช้สีแดง** |

**รูปแบบข้อความใน Body**

- จัด **กึ่งกลาง** เสมอ
- รูปแบบ: คุณต้องการจะลบ **"ชื่อรายการ"** ใช่หรือไม่ การดำเนินการนี้ไม่สามารถย้อนกลับได้
- **ชื่อรายการ** แสดงเป็น **ตัวหนา** เพื่อให้ผู้ใช้มั่นใจว่ากำลังลบรายการที่ถูกต้อง
- ส่งชื่อผ่าน `name` prop — ถ้าไม่มีให้แสดงข้อความ fallback ทั่วไปแทน

**เหตุผลที่ปุ่มใช้คำว่า "ยืนยัน" ไม่ใช่ "ลบ"**
คำว่า "ลบ" สื่อถึง action ที่เกิดขึ้นแล้ว และสร้างความรู้สึกกดดัน ในขณะที่ "ยืนยัน" สื่อว่าผู้ใช้กำลัง confirm การตัดสินใจ ซึ่งเป็น pattern ที่ neutral และเป็นมิตรกว่า

**เหตุผลที่ปุ่มไม่ใช้สีแดง**
สีแดงสื่อถึงอันตรายหรือ error ทำให้ผู้ใช้กังวลเกินจำเป็น การ confirm dialog คือกลไกป้องกันหลักอยู่แล้ว ไม่จำเป็นต้องใช้สีเพิ่มความกดดัน

**กรณีที่ชื่อปุ่ม action แตกต่างออกไป**
- ลบข้อมูล → "ยืนยัน" (default)
- ยกเลิกคำสั่ง → "ยืนยันการยกเลิก"
- ปิดใช้งาน → "ปิดใช้งาน"
- แปลง (Convert to Lead / Convert to Deal) → "แปลง" (`confirm-color="primary"`, ไม่ใช้สีแดงเช่นกัน เพราะไม่ใช่ action ทำลายข้อมูล)
- ใช้ `confirmLabel` prop เพื่อกำหนดชื่อปุ่มตาม context

**Confirm ก่อน action บนหน้า Detail ของ record เดียว (ไม่ใช่ list row)**
Prospect Detail (`crm.prospects.detail.convertToLead`) และ Lead Detail (`crm.leads.detail.convertToDeal`) ใช้ `CrmConfirmDeleteModal` ตัวเดียวกันนี้ยืนยันก่อนเรียก Convert เพราะเป็น action ที่ย้อนกลับไม่ได้ (เปลี่ยนสถานะ record ปัจจุบันและสร้างเรคคอร์ดใหม่) เช่นเดียวกับการลบ — component และ copy pattern เหมือนกันทุกอย่าง ต่างกันแค่ trigger: หน้า list ใช้ `useDeleteConfirm` composable (เก็บ target ของแถวที่เลือก) ส่วนหน้า Detail ที่ record อยู่ใน scope แล้วใช้ `useConfirmGate` composable (`composables/utils/useConfirmGate.ts`) ซึ่งเป็นแค่ boolean gate ไม่ต้องเก็บ target แยก

------------------------------------------------

## Modal ดูรายละเอียดแบบย่อ (Quick-View / Preview)

ใช้เมื่อหน้า Detail หนึ่งมีลิงก์ไปยัง record อื่นที่อยู่นอก entity หลักของหน้า (เช่น "ดูบริษัท" บน Prospect/Contact Detail) แต่ไม่อยากพาผู้ใช้ออกจากฟอร์มที่กำลังกรอกอยู่ด้วยการเปลี่ยนหน้าเต็ม — ให้เปิด modal แสดงข้อมูลอ่านอย่างเดียว (read-only) แทนการ navigate ตรง ๆ

| | ค่า |
|---|---|
| โครงสร้าง | เหมือน modal ฟอร์มทั่วไป (Header / Body / Footer คั่นด้วยเส้นแบ่ง) แต่ Body เป็นข้อมูลอ่านอย่างเดียว ไม่ใช่ฟอร์ม |
| หัวข้อ | ชื่อ record (เช่นชื่อบริษัท) |
| Footer | ปุ่ม "ปิด" (outline/cancel) และปุ่ม "ดูหน้าเต็ม" ที่พาไปหน้ารายละเอียดจริงของ record นั้น |

ตัวอย่างแรก: `components/Crm/CompanyPreviewModal.vue` — ใช้แทน `TableCardLink` เดิมที่ "ดูบริษัท" บน Prospect Detail (`pages/crm/prospects/[id].vue`) และ Contact Detail (`pages/crm/contacts/[id].vue`) เคยแค่ `NuxtLink` ไปหน้า Company Detail เต็ม รับ `company-id` prop, fetch ผ่าน `companiesStore.fetchOne` ถ้ายังไม่มีใน `items` (record อาจอยู่นอก cache 200 แถวของ `fetchAll`), และแสดงสถานะ/tags/industry/size/revenue size/website/address/notes อย่างย่อ — ไม่ทำ tabs ครบเหมือนหน้าเต็ม (Contacts/Deals/Products/Projects/Activity/Tasks/Attachments tabs ยังต้องกดปุ่ม "ดูหน้าเต็ม" เพื่อเข้าไปดู)
