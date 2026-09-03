export default {
  title: 'คู่มือการใช้งาน',
  subtitle: 'แนวทางการใช้งานระบบของแต่ละบทบาท ตั้งแต่รับ Lead ไปจนถึงการต่ออายุและ Upsell',
  legendHint: 'คำที่ถูกไฮไลต์คือประเภทข้อมูลที่คุณจะสร้างหรืออัปเดต ป้ายด้านบนของแต่ละขั้นตอนจะบอกตำแหน่งเมนูใน Sidebar',
  searchPlaceholder: 'ค้นหาคู่มือ เช่น "ต่ออายุ", "ชำระเงิน", "lead"...',
  clearSearch: 'ล้างการค้นหา',
  noResultsTitle: 'ไม่พบคู่มือที่ตรงกัน',
  roleTabs: {
    salesRep: 'Sales Rep',
    salesManager: 'Sales Manager',
    admin: 'Admin',
    marketing: 'Marketing',
    production: 'Production',
  },
  topics: {
    leadToDeal: {
      title: 'รับ Lead → ส่งต่อเป็น Deal',
      description: 'บันทึกข้อมูล Lead ใหม่ทันทีที่ได้รับ แล้วส่งต่อให้ทีมขายดำเนินการเป็น Deal',
      flow: ['Lead', 'Deal', 'Won'],
      steps: [
        {
          nav: 'leads',
          text: 'สร้าง Lead พร้อมระบุแหล่งที่มา บริษัท และข้อมูลผู้ติดต่อให้ครบ ข้อมูลนี้ Sales Manager จะใช้ประเมินคุณภาพ Lead ในภายหลัง หากทราบแล้วว่าสนใจ Project หรือ Product ใด ให้ระบุผ่านช่องหน่วยธุรกิจ ข้อมูลนี้จะถูกส่งต่อไปยัง Deal โดยอัตโนมัติเมื่อแปลง Lead',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'leads',
          text: 'ประเมินคุณภาพ Lead ด้วย Lead Score เมื่อพร้อมขายแล้วให้แปลงเป็น Deal เพื่อเข้าสู่ Pipeline',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'deals',
          text: 'มอบหมาย Deal ให้ Sales Rep ที่รับผิดชอบและกำหนด Stage ใน Pipeline — จุดนี้คือจุดส่งต่ออย่างเป็นทางการ',
          restriction: 'Sales Manager และ Admin เป็นผู้มอบหมาย/โยกย้าย; Sales Rep ดำเนินการ Deal ที่ได้รับมอบหมาย',
        },
        {
          nav: 'deals',
          text: 'อัปเดต Stage มูลค่า และ Activity ถัดไปของ Deal อย่างต่อเนื่องจนกว่าจะปิดเป็น Won หรือ Lost',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
      ],
    },
    subscriptionFollowup: {
      title: 'ติดตามการต่ออายุสมาชิก (รายเดือน / รายปี)',
      description: 'ติดตาม Subscription ของสินค้าที่ลูกค้าสมัครใช้ และติดตามก่อนหมดอายุ',
      flow: ['Subscription', 'Reminder Task', 'Renewed'],
      steps: [
        {
          nav: 'deals',
          text: 'บันทึกสินค้าและรอบการเรียกเก็บเงิน (รายเดือน/รายปี) ไว้ในข้อมูล Deal หรือ Project ของลูกค้า',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'tasks',
          text: 'สร้าง Task เพื่อกำหนด Activity ติดตามล่วงหน้าก่อนถึงวันต่ออายุ เพื่อไม่ให้พลาดการติดตาม',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'deals',
          text: 'ติดต่อลูกค้าก่อนวันต่ออายุเพื่อตรวจสอบการใช้งานและความพึงพอใจ แล้วบันทึกผลเป็น Activity บน Deal',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'deals',
          text: 'หาก Subscription ต่ออายุ ให้อัปเดตรอบวันที่ใหม่ หากไม่ต่อ ให้บันทึกเหตุผลไว้สำหรับทำรายงาน',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
      ],
    },
    projectMilestones: {
      title: 'การส่งมอบงานและ Milestone การชำระเงิน',
      description: 'บริหารงานส่งมอบและ Milestone การชำระเงินที่เกี่ยวข้อง',
      flow: ['Project', 'Milestone', 'Payment'],
      steps: [
        {
          nav: 'projects',
          text: 'สร้าง Project จาก Deal ที่ปิดสำเร็จ และแบ่งงานส่งมอบเป็น Milestone',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'projects',
          text: 'อัปเดตสถานะ Milestone ตามความคืบหน้า',
          restriction: 'Sales Rep, Sales Manager, Admin และ Production — Production อัปเดตได้เฉพาะสถานะ/ข้อมูลอ้างอิง',
        },
        {
          nav: 'deals',
          text: 'เปิดแท็บ Contract, Quote และ Payment ของ Deal เพื่อออกแผนการชำระเงินที่ตกลงกัน แล้วติดตาม Payment Milestone แต่ละงวดตั้งแต่ออกใบแจ้งหนี้จนเก็บเงินได้',
          restriction: 'Sales Rep, Sales Manager, Admin — ไม่รวม Production',
        },
        {
          nav: 'projects',
          text: 'ตั้งสถานะแจ้งเตือน Milestone ที่ล่าช้าทั้งด้านการส่งมอบและการชำระเงิน เพื่อให้ปรากฏในรายงาน',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
      ],
    },
    loyaltyUpsell: {
      title: 'การรักษาลูกค้าและ Upsell',
      description: 'เปลี่ยนลูกค้าเดิมให้กลับมาซื้อซ้ำ',
      flow: ['Company History', 'Touchpoint', 'Upsell Deal'],
      steps: [
        {
          nav: 'companies',
          text: 'ตรวจสอบประวัติ Deal และ Subscription ของ Company หรือ Contact เพื่อหาโอกาสต่ออายุหรือขยายการขาย',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'contacts',
          text: 'บันทึกการติดต่อดูแลลูกค้า (เช็คอิน บันทึกความพึงพอใจ) เป็น Activity เพื่อให้ทั้งทีมเห็นประวัติความสัมพันธ์',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'deals',
          text: 'เมื่อพบโอกาส Upsell ให้สร้าง Deal ใหม่ผูกกับ Company/Contact เดิม แทนการเริ่มจาก Lead ใหม่',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
        {
          nav: 'tags',
          text: 'ติด Tag ลูกค้าที่มีมูลค่าสูงหรือใช้งานมานาน เพื่อให้ Sales Manager จัดลำดับความสำคัญในการดูแลบัญชีลูกค้า',
          restriction: 'Sales Rep, Sales Manager, Admin',
        },
      ],
    },
    prospectIntake: {
      title: 'รับ Prospect → ส่งต่อเป็น Lead',
      description: 'ช่องทางการตลาดของทีม Marketing ก่อนเข้าสู่ขั้นตอน Lead — ดูแล Prospect ใหม่จนพร้อมขาย แล้วแปลงเป็น Lead เพื่อให้ทีมขายรับช่วงต่อได้ทันที',
      flow: ['Prospect', 'Lead'],
      steps: [
        {
          nav: 'prospects',
          text: 'สร้าง Prospect พร้อมระบุแหล่งที่มา บริษัท และข้อมูลผู้ติดต่อให้ครบ หากทราบแล้วว่าสนใจ Project หรือ Product ใด ให้ระบุผ่านช่องหน่วยธุรกิจ ข้อมูลนี้จะถูกส่งต่อไปยัง Lead โดยอัตโนมัติ',
          restriction: 'Marketing, Sales Manager, Admin',
        },
        {
          nav: 'prospects',
          text: 'ดูแล Prospect ผ่านสถานะ New → Engaging → Nurturing พร้อมบันทึกงานติดตามระหว่างทางเพื่อไม่ให้ตกหล่น',
          restriction: 'Marketing, Sales Manager, Admin',
        },
        {
          nav: 'prospects',
          text: 'เมื่อพร้อมส่งต่อให้ทีมขาย ให้กด "แปลงเป็น Lead" ไม่ต้องมีสถานะเฉพาะก่อน ขอแค่ไม่ใช่ Disqualified ระบบจะสร้าง Lead (พร้อมบริษัท/ผู้ติดต่อถ้ายังไม่มี) และย้ายไฟล์แนบให้อัตโนมัติ',
          restriction: 'Marketing, Sales Manager, Admin',
        },
        {
          nav: 'tasks',
          text: 'ติดตามงานของคุณจากทุก Prospect ได้ในที่เดียวผ่านหน้ารายการงานทั้งหมด ไม่ต้องไล่ดูทีละ Prospect',
          restriction: 'Marketing, Sales Manager, Admin',
        },
      ],
    },
  },
  roleFocus: {
    salesRep: 'ดูแล Lead, Deal, Subscription และ Project ที่ได้รับมอบหมาย — นี่คือขั้นตอนการทำงานประจำวันของคุณ',
    salesManager: 'ทำได้ทุกอย่างเหมือน Sales Rep เพิ่มเติมด้วยมุมมอง Pipeline ของทั้งทีม การมอบหมาย Deal ใหม่ และตรวจสอบการต่ออายุ/Upsell',
    admin: 'มองเห็นทุกขั้นตอนการทำงานทั้งหมด พร้อมตั้งค่า Pipeline Stage ฟิลด์ข้อมูล และ Product Catalog ที่ขั้นตอนด้านล่างต้องใช้',
    marketing: 'ดูแลช่องทาง Prospect ก่อนเข้าสู่ขั้นตอน Lead — ทำงานกับ Prospect จนพร้อมขาย แล้วแปลงเป็น Lead ไม่มีสิทธิ์เข้าถึง Lead/Deal/Quote/Contract/Payment',
    production: 'ดูเฉพาะขั้นตอนการส่งมอบงานด้านล่าง — อัปเดตสถานะและข้อมูลอ้างอิงของ Project ที่ได้รับมอบหมาย',
  },
}
