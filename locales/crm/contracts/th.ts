export default {
  detail: {
    title: 'สัญญา',
    createContract: 'สร้างสัญญา',
    createSuccess: 'สร้างสัญญาสำเร็จ',
    noContracts: 'ยังไม่มีสัญญาที่สร้างสำหรับ Deal นี้',
    uploadSignedDocument: 'อัปโหลดเอกสารที่ลงนามแล้ว',
    uploadSuccess: 'อัปโหลดเอกสารที่ลงนามแล้วสำเร็จ',
    invalidFileType: 'กรุณาอัปโหลดไฟล์ PDF',
    fileTooLarge: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10 MB)',
    uploadedOn: 'อัปโหลดเมื่อ {date}',
    viewDocument: 'ดูเอกสาร',
    downloadPdf: 'ดาวน์โหลดเป็น PDF',
    linkedQuote: 'เชื่อมโยงกับใบเสนอราคา #{id}',
    noLinkedQuote: 'ไม่มีใบเสนอราคาที่เชื่อมโยง',
  },
  components: {
    addContractModal: {
      title: 'สร้างสัญญา',
      quote: 'ใบเสนอราคาที่เชื่อมโยง (ไม่บังคับ)',
      quotePlaceholder: 'เลือกใบเสนอราคาที่จะเชื่อมโยง',
      noQuote: 'ไม่มีใบเสนอราคา',
      status: 'สถานะ',
      cancel: 'ยกเลิก',
      save: 'สร้าง',
    },
  },
}
