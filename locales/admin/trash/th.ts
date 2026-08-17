export default {
  title: 'ถังขยะ',
  subtitle: 'รายการที่ถูกลบหรือย้ายไปถังขยะ — กู้คืนได้ที่นี่ก่อนที่จะหายไปถาวร',
  tabs: {
    deals: 'Deal',
    leads: 'Lead',
    companies: 'บริษัท',
    contacts: 'ผู้ติดต่อ',
  },
  columns: {
    deals: {
      title: 'ชื่อ Deal',
      company: 'บริษัท',
      value: 'มูลค่า',
      deletedAt: 'ลบเมื่อ',
      action: 'การดำเนินการ',
    },
    leads: {
      name: 'ชื่อ',
      company: 'บริษัท',
      source: 'แหล่งที่มา',
      deletedAt: 'ลบเมื่อ',
      action: 'การดำเนินการ',
    },
    companies: {
      name: 'ชื่อ',
      industry: 'อุตสาหกรรม',
      deletedAt: 'ลบเมื่อ',
      action: 'การดำเนินการ',
    },
    contacts: {
      name: 'ชื่อ',
      company: 'บริษัท',
      email: 'อีเมล',
      deletedAt: 'ลบเมื่อ',
      action: 'การดำเนินการ',
    },
  },
  actions: {
    restore: 'กู้คืน',
  },
  noAccess: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
  restoreSuccess: 'กู้คืน{entity}สำเร็จ',
  restoreError: 'ไม่สามารถกู้คืนรายการนี้ได้',
}
