// Badge coloring and display labels for CustomerProduct status.
const CUSTOMER_PRODUCT_STATUS_COLOR: Partial<Record<CustomerProductStatus, BadgeColor>> = {
  Trial: 'info',
  Active: 'success',
  Churned: 'error',
}

const CUSTOMER_PRODUCT_STATUS_KEY: Record<CustomerProductStatus, string> = {
  Interested: 'interested',
  Trial: 'trial',
  Active: 'active',
  Churned: 'churned',
}

const CUSTOMER_PRODUCT_STATUSES = Object.keys(CUSTOMER_PRODUCT_STATUS_KEY) as CustomerProductStatus[]

export const useCustomerProductStatusColor = () => {
  const customerProductStatusBadgeColor = (status: CustomerProductStatus) => badgeColorFromMap(status, CUSTOMER_PRODUCT_STATUS_COLOR)
  const customerProductStatusLabel = (status: CustomerProductStatus) =>
    statusLabelFromGroup('customerProduct', status, CUSTOMER_PRODUCT_STATUS_KEY)
  const customerProductStatusOptions = computed<Select[]>(() =>
    CUSTOMER_PRODUCT_STATUSES.map(value => ({ value, label: customerProductStatusLabel(value) })))

  return { customerProductStatusBadgeColor, customerProductStatusLabel, customerProductStatusOptions }
}
