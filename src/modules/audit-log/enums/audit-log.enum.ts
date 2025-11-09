export enum AuditLogAction {
  USER_CREATED = 'user_created',
  MERCHANT_CREATED = 'merchant_created',
  MERCHANT_UPDATED = 'merchant_updated',
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_APPROVED = 'transaction_approved',
  TRANSACTION_DECLINED = 'transaction_declined',
}

export enum AuditLogEntityType {
  USER = 'user',
  MERCHANT = 'merchant',
  TRANSACTION = 'transaction',
}
