const ORDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PRODUCTION: 'in_production',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

const USER_ROLES = {
  BUYER: 'buyer',
  MANAGER: 'manager',
  ADMIN: 'admin'
};

const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended'
};

const PRODUCT_CATEGORIES = [
  'Shirt',
  'Pant',
  'Jacket',
  'Suits',
  'Accessories',
  'Other'
];

const PAYMENT_METHODS = [
  'Cash on Delivery',
  'Stripe'
];

const TRACKING_STATUS = [
  'Order Placed',
  'Cutting Started',
  'Cutting Completed',
  'Sewing Started',
  'Sewing Completed',
  'Finishing Started',
  'Finishing Completed',
  'QC Checked',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  USER_ROLES,
  USER_STATUS,
  PRODUCT_CATEGORIES,
  PAYMENT_METHODS,
  TRACKING_STATUS
};