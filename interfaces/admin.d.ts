interface AdminUser extends User {
  id: number
  role: 'Admin' | 'Sales Rep' | 'Sales Manager' | 'Production'
}

type ActivityItemType = 'user' | 'order' | 'system' | 'payment' | 'report'

interface ActivityItem {
  title: string
  description: string
  datetime: string
  icon: string
  type: ActivityItemType
}
