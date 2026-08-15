export const ACTIVITY_TYPE_OPTIONS: Select[] = [
  { label: 'All Types', value: 'all' },
  { label: 'User', value: 'user' },
  { label: 'Order', value: 'order' },
  { label: 'System', value: 'system' },
  { label: 'Payment', value: 'payment' },
  { label: 'Report', value: 'report' },
]

export const ACTIVITY_TYPE_ICON: Record<ActivityItemType, string> = {
  user: 'material-symbols:person-add-outline',
  order: 'material-symbols:package-2',
  system: 'material-symbols:dns-outline',
  payment: 'material-symbols:credit-card-outline',
  report: 'material-symbols:insert-chart-outline',
}

export const RECENT_ACTIVITY: ActivityItem[] = [
  { title: 'New user registered', description: 'john.doe@example.com signed up', datetime: '2025-03-06T10:30:00', icon: ACTIVITY_TYPE_ICON.user, type: 'user' },
  { title: 'Order completed', description: 'Order #1234 was delivered successfully', datetime: '2025-03-06T09:15:00', icon: ACTIVITY_TYPE_ICON.order, type: 'order' },
  { title: 'System update', description: 'Server maintenance completed', datetime: '2025-03-05T22:00:00', icon: ACTIVITY_TYPE_ICON.system, type: 'system' },
  { title: 'Payment received', description: '$1,250.00 from Premium plan subscription', datetime: '2025-03-05T16:45:00', icon: ACTIVITY_TYPE_ICON.payment, type: 'payment' },
  { title: 'Report generated', description: 'Monthly analytics report is ready', datetime: '2025-03-05T14:00:00', icon: ACTIVITY_TYPE_ICON.report, type: 'report' },
  { title: 'New user registered', description: 'nattaya.wong@example.com signed up', datetime: '2025-03-05T11:20:00', icon: ACTIVITY_TYPE_ICON.user, type: 'user' },
  { title: 'Order cancelled', description: 'Order #1230 was cancelled by customer', datetime: '2025-03-04T17:40:00', icon: ACTIVITY_TYPE_ICON.order, type: 'order' },
  { title: 'Scheduled backup completed', description: 'Nightly database backup finished successfully', datetime: '2025-03-04T02:00:00', icon: ACTIVITY_TYPE_ICON.system, type: 'system' },
  { title: 'Payment failed', description: 'Card declined for invoice #4821', datetime: '2025-03-03T13:05:00', icon: ACTIVITY_TYPE_ICON.payment, type: 'payment' },
  { title: 'Weekly report generated', description: 'Weekly sales summary is ready', datetime: '2025-03-03T09:00:00', icon: ACTIVITY_TYPE_ICON.report, type: 'report' },
  { title: 'User role updated', description: 'Bob Wilson was promoted to Sales Manager', datetime: '2025-03-02T15:30:00', icon: ACTIVITY_TYPE_ICON.user, type: 'user' },
  { title: 'Order completed', description: 'Order #1228 was delivered successfully', datetime: '2025-03-01T10:10:00', icon: ACTIVITY_TYPE_ICON.order, type: 'order' },
]

export const MOCK_USERS: AdminUser[] = [
  { id: 1, first_name: 'John', last_name: 'Doe', username: 'johndoe', email: 'john.doe@example.com', tel: '0812345678', role: 'Admin', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2024-01-15'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 0, updated_by: 1, deleted_by: 0 },
  { id: 2, first_name: 'Jane', last_name: 'Smith', username: 'janesmith', email: 'jane.smith@example.com', tel: '0823456789', role: 'Sales Rep', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-05'), created_at: new Date('2024-02-20'), updated_at: new Date('2025-03-05'), deleted_at: null, created_by: 1, updated_by: 2, deleted_by: 0 },
  { id: 3, first_name: 'Bob', last_name: 'Wilson', username: 'bobwilson', email: 'bob.wilson@example.com', tel: '0834567890', role: 'Production', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-04'), created_at: new Date('2024-03-10'), updated_at: new Date('2025-03-04'), deleted_at: null, created_by: 1, updated_by: 3, deleted_by: 0 },
  { id: 4, first_name: 'Alice', last_name: 'Johnson', username: 'alicej', email: 'alice.j@example.com', tel: '0845678901', role: 'Sales Manager', is_active: false, accepted_consent_id: 1, latest_login: new Date('2025-02-28'), created_at: new Date('2024-04-05'), updated_at: new Date('2025-02-28'), deleted_at: null, created_by: 1, updated_by: 4, deleted_by: 0 },
  { id: 5, first_name: 'Charlie', last_name: 'Brown', username: 'charlieb', email: 'charlie.b@example.com', tel: '0856789012', role: 'Sales Rep', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2024-05-12'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 2, updated_by: 5, deleted_by: 0 },
  { id: 6, first_name: 'Diana', last_name: 'Lee', username: 'dianlee', email: 'diana.lee@example.com', tel: '0867890123', role: 'Admin', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2024-06-01'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 1, updated_by: 6, deleted_by: 0 },
  { id: 7, first_name: 'Edward', last_name: 'Kim', username: 'edwardk', email: 'edward.kim@example.com', tel: '0878901234', role: 'Sales Manager', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-03'), created_at: new Date('2024-07-18'), updated_at: new Date('2025-03-03'), deleted_at: null, created_by: 1, updated_by: 7, deleted_by: 0 },
  { id: 8, first_name: 'Fiona', last_name: 'Chen', username: 'fionac', email: 'fiona.chen@example.com', tel: '0889012345', role: 'Production', is_active: false, accepted_consent_id: 1, latest_login: new Date('2025-02-15'), created_at: new Date('2024-08-22'), updated_at: new Date('2025-02-15'), deleted_at: null, created_by: 2, updated_by: 8, deleted_by: 0 },
  { id: 9, first_name: 'George', last_name: 'Taylor', username: 'georget', email: 'george.t@example.com', tel: '0890123456', role: 'Sales Rep', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-05'), created_at: new Date('2024-09-30'), updated_at: new Date('2025-03-05'), deleted_at: null, created_by: 1, updated_by: 9, deleted_by: 0 },
  { id: 10, first_name: 'Hannah', last_name: 'Park', username: 'hannahp', email: 'hannah.park@example.com', tel: '0801234567', role: 'Sales Manager', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2024-10-14'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 6, updated_by: 10, deleted_by: 0 },
  { id: 11, first_name: 'Ivan', last_name: 'Wong', username: 'ivanw', email: 'ivan.wong@example.com', tel: '0812345679', role: 'Production', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-04'), created_at: new Date('2024-11-05'), updated_at: new Date('2025-03-04'), deleted_at: null, created_by: 1, updated_by: 11, deleted_by: 0 },
  { id: 12, first_name: 'Julia', last_name: 'Martinez', username: 'juliam', email: 'julia.m@example.com', tel: '0823456780', role: 'Sales Rep', is_active: false, accepted_consent_id: 1, latest_login: new Date('2025-01-20'), created_at: new Date('2024-12-01'), updated_at: new Date('2025-01-20'), deleted_at: null, created_by: 2, updated_by: 12, deleted_by: 0 },
  { id: 13, first_name: 'Kevin', last_name: 'Nguyen', username: 'kevinn', email: 'kevin.n@example.com', tel: '0834567891', role: 'Admin', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2025-01-10'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 1, updated_by: 13, deleted_by: 0 },
  { id: 14, first_name: 'Laura', last_name: 'Anderson', username: 'lauraa', email: 'laura.a@example.com', tel: '0845678902', role: 'Sales Manager', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-05'), created_at: new Date('2025-02-01'), updated_at: new Date('2025-03-05'), deleted_at: null, created_by: 6, updated_by: 14, deleted_by: 0 },
  { id: 15, first_name: 'Michael', last_name: 'Davis', username: 'michaeld', email: 'michael.d@example.com', tel: '0856789013', role: 'Production', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2025-02-20'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 1, updated_by: 15, deleted_by: 0 },
]

export const ROLE_OPTIONS = [
  { label: 'All Roles', value: 'all' },
  { label: 'Admin', value: 'Admin' },
  { label: 'Sales Rep', value: 'Sales Rep' },
  { label: 'Sales Manager', value: 'Sales Manager' },
  { label: 'Production', value: 'Production' },
]

export const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]
