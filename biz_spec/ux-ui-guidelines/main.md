# UI/UX Guidelines

## General UX Best Practices
- Consistency
  - ใช้ design tokens เดียวกันทั่วทั้งระบบ
  - รักษา interaction patterns ให้เหมือนกันในทุกหน้าจอ
- Clarity
  - ใช้ข้อความที่เข้าใจง่าย ไม่กำกวม
  - แสดง labels และ instructions ที่ชัดเจน
- User Control
  - ให้ผู้ใช้สามารถ undo/redo actions ได้
  - หลีกเลี่ยงการบังคับ flow ที่ไม่จำเป็น
- Error Prevention & Recovery
  - ใช้ inline validation เพื่อลดข้อผิดพลาด
  - แสดง error messages ที่ช่วยแก้ปัญหาได้จริง
- Feedback
  - ให้ feedback ทันทีเมื่อผู้ใช้ทำ action
  - ใช้ visual cues เช่น loading indicators, success toasts
- Performance
  - ลดเวลาโหลดด้วยการ optimize assets
  - ใช้ skeleton screens เพื่อให้ perceived performance ดีขึ้น
- Simplicity
  - ลดจำนวน clicks ที่ไม่จำเป็น
  - ใช้ progressive disclosure สำหรับข้อมูลซับซ้อน
- Learnability
  - ใช้ familiar patterns ที่ผู้ใช้คุ้นเคย
  - มี onboarding หรือ tooltips สำหรับผู้ใช้ใหม่
- Delight
  - ใช้ microinteractions เพื่อสร้างความรู้สึกสนุก
  - เพิ่ม animations ที่ subtle และไม่รบกวน
- Cross-platform Consistency
  - รักษาประสบการณ์ที่ใกล้เคียงกันบน web, mobile, tablet
  - ปรับ UI ให้เหมาะสมกับแต่ละอุปกรณ์
- Security & Privacy
  - แจ้งผู้ใช้เมื่อมีการเก็บข้อมูลส่วนตัว
  - ใช้ secure patterns เช่น masked input สำหรับ sensitive data
- Accessibility
  - รองรับ keyboard navigation และ screen readers
  - Contrast ratio ที่เหมาะสมตาม WCAG



## Mobile-first Principles
- Responsive Layout
  - ใช้ fluid grids และ flexible containers ที่ปรับตามหน้าจอ
  - เริ่มจาก mobile viewport (≤ 375px) แล้วค่อยขยายไป tablet และ desktop
- Touch-friendly Design
  - ขนาดปุ่มและ interactive elements ≥ 44px
  - ระยะห่างระหว่าง elements เพื่อลดการกดผิด
- Progressive enhancementOptimization
  - โหลด assets ที่จำเป็นก่อน (critical CSS, JS)
  - ใช้ image optimization (WebP, responsive images)
  - ลด network requests ด้วย bundling และ caching

## Interaction Patterns
- Navigation:
  - Breadcrumbs: ใช้ breadcrumbs สำหรับ multi-level navigation เพื่อช่วยผู้ใช้เข้าใจตำแหน่งปัจจุบัน Sticky Navigation: ทำให้เมนูหลักติดอยู่ด้านบนเมื่อ scroll เพื่อการเข้าถึงที่รวดเร็ว
  - Sticky Navigation: ทำให้เมนูหลักติดอยู่ด้านบนเมื่อ scroll เพื่อการเข้าถึงที่รวดเร็ว
- Form:
  - Inline Validation: แสดง error message ทันทีเมื่อผู้ใช้กรอกข้อมูลผิด
  - Progressive Disclosure: ซ่อน fields ที่ไม่จำเป็นจนกว่าจะมีการเลือก option ที่เกี่ยวข้อง
  - Autosave: บันทึกข้อมูลอัตโนมัติใน background เพื่อลดการสูญหาย
- Modal dialogs: accessible focus management
- Feedback & Status
  - Loading Indicators: ใช้ skeleton screens หรือ spinners เพื่อบอกสถานะการโหลด
  - Success/Failure Toasts: แจ้งผลการทำงานด้วย toast notifications ที่ไม่รบกวน flow
  - Undo Option: ให้ผู้ใช้สามารถย้อนกลับ action ได้ เช่น delete
- Content Display
  - Accordion/Expandable Sections: สำหรับข้อมูลที่ยาวหรือซับซ้อน
  - Infinite Scroll vs Pagination: เลือกตาม use case (content feed → infinite scroll, data table → pagination)
  - Empty States: แสดงข้อความ/illustration ที่ชัดเจนเมื่อไม่มีข้อมูล
- Hover/focus states: visible and consistent
- Accessibility-Oriented Patterns
  - Skip to Content: ปุ่มลัดสำหรับ screen reader users
  - Keyboard Shortcuts: รองรับ navigation ด้วย keyboard
  - Focus Management: ย้าย focus ไปยัง element ที่เกี่ยวข้องหลัง action เช่นเปิด modal
- Mobile Interaction
  - Swipe Gestures: ใช้ swipe สำหรับ actions เช่น delete, archive
  - Bottom Navigation: สำหรับ mobile apps ที่มี ≤5 main destinations
  - Pull-to-Refresh: ใช้ gesture ที่ผู้ใช้คุ้นเคยในการโหลดข้อมูลใหม่
- Advanced Patterns
  - Progress Indicators: สำหรับ multi-step processes เช่น checkout flow
  - Contextual Help: tooltips หรือ inline help สำหรับ fields ที่ซับซ้อน
  - Microinteractions: animation เล็ก ๆ ที่ช่วยสื่อสาร state เช่น toggle switch