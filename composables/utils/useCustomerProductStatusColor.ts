// Badge coloring for CustomerProduct status.
const CUSTOMER_PRODUCT_STATUS_COLOR: Partial<Record<CustomerProductStatus, BadgeColor>> = {
  Trial: 'info',
  Active: 'success',
  Churned: 'error',
}

export const useCustomerProductStatusColor = () => {
  const customerProductStatusBadgeColor = (status: CustomerProductStatus) => badgeColorFromMap(status, CUSTOMER_PRODUCT_STATUS_COLOR)

  return { customerProductStatusBadgeColor }
}
