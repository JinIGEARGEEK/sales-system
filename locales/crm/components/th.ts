export default {
  pipelineBoard: {
    noItems: 'ไม่มีรายการ',
  },
  activityTimeline: {
    noActivity: 'ยังไม่มีกิจกรรมที่บันทึกไว้',
    by: 'โดย',
  },
  confirmDeleteModal: {
    title: 'ยืนยันการลบ',
    confirmQuestion: 'คุณแน่ใจหรือไม่ว่าต้องการลบ',
    cannotBeUndone: 'การดำเนินการนี้ไม่สามารถย้อนกลับได้',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
  },
  lastContact: {
    never: 'ยังไม่เคยติดต่อ',
    today: 'ติดต่อวันนี้',
    daysAgo: '{days} วันที่แล้ว',
  },
  teamMemberSelect: {
    label: 'ผู้รับผิดชอบ',
    placeholder: 'เลือกผู้รับผิดชอบ',
  },
  importModal: {
    title: 'นำเข้าจาก FlowAccount',
    description: 'อัปโหลดไฟล์สมุดรายชื่อที่ export จาก FlowAccount เพื่อสร้างบริษัทและผู้ติดต่อพร้อม Tag ผู้จำหน่าย/ลูกค้าโดยอัตโนมัติ',
    chooseFile: 'คลิกเพื่อเลือกไฟล์',
    acceptedFormats: 'CSV, XLS หรือ XLSX',
    previewSummary: 'พบข้อมูล {rows} แถว',
    previewCompanies: 'จะสร้างบริษัทใหม่ {count} รายการ (มีอยู่แล้ว {existing} รายการ จะข้ามไป)',
    previewContacts: 'จะสร้างผู้ติดต่อ {count} รายการ',
    previewSkipped: 'ข้าม {count} แถว (ไม่มีชื่อบริษัท)',
    errorNoHeader: 'ไม่พบหัวตารางที่ถูกต้อง (ชื่อธุรกิจ/ชื่อบุคคล) กรุณาตรวจสอบรูปแบบไฟล์',
    errorNoRows: 'ไม่พบข้อมูลที่ใช้งานได้ในไฟล์นี้',
    errorParseFailed: 'ไม่สามารถอ่านไฟล์นี้ได้ กรุณาตรวจสอบว่าเป็นไฟล์ CSV, XLS หรือ XLSX ที่ถูกต้อง',
    cancel: 'ยกเลิก',
    confirmImport: 'นำเข้าข้อมูล',
  },
}
