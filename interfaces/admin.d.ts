interface AdminUser extends User {
  id: number
  role: 'Admin' | 'Editor' | 'Viewer'
}

type ActivityItemType = 'user' | 'order' | 'system' | 'payment' | 'report'

interface ActivityItem {
  title: string
  description: string
  datetime: string
  icon: string
  type: ActivityItemType
}
