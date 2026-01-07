import {
  pgTable,
  serial,
  text,
  real,
  timestamp,
  unique,
  uuid,
  integer,
  boolean,
  varchar,
  index,
  numeric,
  date,
  pgEnum
} from 'drizzle-orm/pg-core';
import {
  BookingStatus,
  FileCustomerStatus,
  FileProviderStatus,
  PaymentRule,
  BookingHistoryAction,
  AccountHistoryAction,
  ChannelType
} from './db/enums';

// ChannelType enum
export const channelTypeEnum = pgEnum('channel_type', [
  ChannelType.NEMO_PRICE,
  ChannelType.MANUAL
]);

// BookingStatus enum
export const bookingStatusEnum = pgEnum('booking_status', [
  BookingStatus.CANCELLATION_PENDING,
  BookingStatus.CANCELLATION_FAILED,
  BookingStatus.CANCELLED,
  BookingStatus.CANCELLED_WITH_CHARGES,
  BookingStatus.CONFIRMATION_DENIED,
  BookingStatus.CONFIRMATION_PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.MIXED,
  BookingStatus.REBOOKING,
  BookingStatus.REJECTED,
  BookingStatus.REQUEST_FAILED
]);

// FileCustomerStatus enum
export const fileCustomerStatusEnum = pgEnum('file_customer_status', [
  FileCustomerStatus.TO_ACCOUNT,
  FileCustomerStatus.CANCELLED,
  FileCustomerStatus.AMOUNT_CHARGED,
  FileCustomerStatus.END,
  FileCustomerStatus.INITIAL,
  FileCustomerStatus.INTERCOMPANY,
  FileCustomerStatus.INVOICED,
  FileCustomerStatus.PAYMENT_PENDING,
  FileCustomerStatus.PROFORMA_SENT,
  FileCustomerStatus.PROFORMA_TO_SEND,
  FileCustomerStatus.REBILLING
]);

// FileProviderStatus enum
export const fileProviderStatusEnum = pgEnum('file_provider_status', [
  FileProviderStatus.CANCELLED,
  FileProviderStatus.RECONFIRMED,
  FileProviderStatus.END,
  FileProviderStatus.ERROR,
  FileProviderStatus.EXPIRED_VALIDATION,
  FileProviderStatus.INITIAL,
  FileProviderStatus.PAID,
  FileProviderStatus.REBILLING,
  FileProviderStatus.REQUEST_REFUND,
  FileProviderStatus.TO_VALIDATE,
  FileProviderStatus.WHITELIST
]);

export const productsTable = pgTable(
  'products_table',
  {
    id: serial('id').primaryKey(),
    user_id: text('user_id').notNull(),
    photo_url: text('photo_url').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    price: real('price').notNull(),
    category: text('category').notNull(),
    updated_at: timestamp('updated_at').notNull().defaultNow()
  },
  (table) => [unique('name_user_idx').on(table.name, table.user_id)]
);

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

// Country table
export const countryTable = pgTable('country', {
  id: integer('id').primaryKey(),
  name_en: varchar('name_en', { length: 255 }).notNull(),
  name_es: varchar('name_es', { length: 255 }).notNull(),
  code: varchar('code', { length: 10 }),
  zone: varchar('zone', { length: 50 })
});

export type Country = typeof countryTable.$inferSelect;
export type NewCountry = typeof countryTable.$inferInsert;

// Destination table
export const destinationTable = pgTable('destination', {
  id: integer('id').primaryKey(),
  name_en: varchar('name_en', { length: 255 }).notNull(),
  name_es: varchar('name_es', { length: 255 }).notNull(),
  country_id: integer('country_id').references(() => countryTable.id)
});

export type Destination = typeof destinationTable.$inferSelect;
export type NewDestination = typeof destinationTable.$inferInsert;

// PaymentRule table
export const paymentRuleEnum = pgEnum('payment_rule', [
  PaymentRule.DEFAULT,
  PaymentRule.FIRST_MONDAY,
  PaymentRule.FIRST_MON_NORFND,
  PaymentRule.FIRST_MON_CANCEL,
  PaymentRule.FNIGHT_CHECKIN,
  PaymentRule.FNIGHT_CHKIN_5,
  PaymentRule.FNIGHT_CHKIN_10,
  PaymentRule.FNIGHT_CHKIN_15,
  PaymentRule.FNIGHT_CHKIN_5_NORFND,
  PaymentRule.FNIGHT_CHKIN_10_NORFND,
  PaymentRule.FNIGHT_CHKIN_15_NORFND,
  PaymentRule.FNIGHT_CHKIN_0_NORFND,
  PaymentRule.FNIGHT_AUTOCANCEL,
  PaymentRule.WEEK_CHECKIN_7,
  PaymentRule.WEEK_CHECKOUT,
  PaymentRule.TENS_CHECKIN_7,
  PaymentRule.NEXT_MONTH,
  PaymentRule.CANPOLICIES_7,
  PaymentRule.CANPOLICIES_4,
  PaymentRule.CANPOLICIES_3,
  PaymentRule.CANPOLICIES_2,
  PaymentRule.CANPOLICIES_1,
  PaymentRule.AUTOCANCEL_7,
  PaymentRule.AUTOCANCEL_6,
  PaymentRule.AUTOCANCEL_5,
  PaymentRule.AUTOCANCEL_4,
  PaymentRule.AUTOCANCEL_3,
  PaymentRule.AUTOCANCEL_2,
  PaymentRule.AUTOCANCEL_1,
  PaymentRule.CHECKIN_PLUS_1,
  PaymentRule.CHECKIN_PLUS_2,
  PaymentRule.CHECKIN_PLUS_29,
  PaymentRule.CHECKIN_MINUS_1,
  PaymentRule.CHECKIN_MINUS_4,
  PaymentRule.CHECKIN_MINUS_7,
  PaymentRule.EVERY_10_DAYS
]);

// Account table
export const accountTable = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  account_type: varchar('account_type', { length: 50 }).notNull(),
  payment_rule_id: paymentRuleEnum('payment_rule_id')
    .notNull()
    .default(PaymentRule.DEFAULT),
  country_id: integer('country_id').references(() => countryTable.id),
  is_active: boolean('is_active').notNull().default(true),
  quickbooks_id: varchar('quickbooks_id', { length: 255 }),
  business_name: varchar('business_name', { length: 255 }),
  address: text('address'),
  city: varchar('city', { length: 255 }),
  language: varchar('language', { length: 50 }),
  tax_id: varchar('tax_id', { length: 100 }),
  currency: varchar('currency', { length: 10 }),
  comments: text('comments'),
  bank_account: varchar('bank_account', { length: 255 }),
  max_overdraft_amount: real('max_overdraft_amount'),
  minimum_balance: real('minimum_balance'),
  is_whitelisted: boolean('is_whitelisted').default(false),
  support_contact_info: text('support_contact_info'),
  norefund_enabled: boolean('norefund_enabled').default(false),
  overdraft_norefund_enabled: boolean('overdraft_norefund_enabled').default(
    false
  ),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

export type Account = typeof accountTable.$inferSelect;
export type NewAccount = typeof accountTable.$inferInsert;

// Contact table
export const contactTable = pgTable('contact', {
  id: uuid('id').primaryKey().defaultRandom(),
  account_id: uuid('account_id')
    .references(() => accountTable.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  position: varchar('position', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }).notNull(),
  should_send_administrative: boolean('should_send_administrative')
    .notNull()
    .default(false),
  should_send_invoices: boolean('should_send_invoices')
    .notNull()
    .default(false),
  should_send_reservations: boolean('should_send_reservations')
    .notNull()
    .default(false),
  should_send_marketing: boolean('should_send_marketing')
    .notNull()
    .default(false),
  should_send_hcn: boolean('should_send_hcn').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

export type Contact = typeof contactTable.$inferSelect;
export type NewContact = typeof contactTable.$inferInsert;

// AccountContract table
export const accountContractTable = pgTable(
  'account_contract',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    account_customer_id: uuid('account_customer_id').references(
      () => accountTable.id
    ),
    account_provider_id: uuid('account_provider_id').references(
      () => accountTable.id
    ),
    channel_type: channelTypeEnum('channel_type')
      .notNull()
      .default(ChannelType.NEMO_PRICE),
    cto_provider_id: varchar('cto_provider_id', { length: 50 }).notNull(),
    cto_provider_name: varchar('cto_provider_name', { length: 255 }),
    cto_producer_id: varchar('cto_producer_id', { length: 50 }).notNull(),
    cto_producer_name: varchar('cto_producer_name', { length: 255 }),
    cto_marketer_id: varchar('cto_marketer_id', { length: 50 }).notNull(),
    cto_marketer_name: varchar('cto_marketer_name', { length: 255 }),
    cto_operator_id: varchar('cto_operator_id', { length: 50 }),
    cto_operator_name: varchar('cto_operator_name', { length: 255 }),
    marketer_currency: varchar('marketer_currency', { length: 10 }),
    provider_currency: varchar('provider_currency', { length: 10 }),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow()
  },
  (table) => [
    index('cto_provider_id_idx').on(table.cto_provider_id),
    index('cto_producer_id_idx').on(table.cto_producer_id),
    index('cto_marketer_id_idx').on(table.cto_marketer_id)
  ]
);

export type AccountContract = typeof accountContractTable.$inferSelect;
export type NewAccountContract = typeof accountContractTable.$inferInsert;

// Booking table
export const bookingTable = pgTable(
  'booking',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    public_id: integer('public_id').unique(),
    external_id: varchar('external_id', { length: 50 }).notNull().unique(),
    rebooking_id: varchar('rebooking_id', { length: 50 }),
    status: bookingStatusEnum('status')
      .notNull()
      .default(BookingStatus.CONFIRMATION_PENDING),
    customer_status: bookingStatusEnum('customer_status').default(
      BookingStatus.CONFIRMATION_PENDING
    ),
    customer_reference_id: varchar('customer_reference_id', { length: 50 }),
    provider_reference_id: varchar('provider_reference_id', { length: 255 }),
    account_contract_id: uuid('account_contract_id').references(
      () => accountContractTable.id
    ),
    channel_type: channelTypeEnum('channel_type')
      .notNull()
      .default(ChannelType.NEMO_PRICE),
    creation_date: date('creation_date').notNull(),
    check_in: date('check_in').notNull(),
    check_out: date('check_out').notNull(),
    cancel_limit_date: date('cancel_limit_date'),
    canceled_date: date('canceled_date'),
    autocancel_date: date('autocancel_date'),
    deadline_date: date('deadline_date'),
    payment_informed_date: date('payment_informed_date'),
    net_price: numeric('net_price', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    net_price_usd: numeric('net_price_usd', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    gross_price: numeric('gross_price', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    gross_price_usd: numeric('gross_price_usd', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    cto_provider_id: varchar('cto_provider_id', { length: 50 }),
    cto_provider_name: varchar('cto_provider_name', { length: 255 }),
    cto_producer_id: varchar('cto_producer_id', { length: 50 }),
    cto_producer_name: varchar('cto_producer_name', { length: 255 }),
    cto_marketer_id: varchar('cto_marketer_id', { length: 50 }),
    cto_marketer_name: varchar('cto_marketer_name', { length: 255 }),
    cto_operator_id: varchar('cto_operator_id', { length: 50 }),
    cto_operator_name: varchar('cto_operator_name', { length: 255 }),
    destination_id: integer('destination_id'),
    product_type: varchar('product_type', { length: 50 }),
    product_name: varchar('product_name', { length: 500 }),
    product_board: varchar('product_board', { length: 50 }),
    nights_count: integer('nights_count'),
    rooms_count: integer('rooms_count'),
    adult_count: integer('adult_count'),
    child_count: integer('child_count'),
    holder_name: varchar('holder_name', { length: 255 }),
    hotel_confirmation_number: varchar('hotel_confirmation_number', {
      length: 255
    }),
    file_public_id: integer('file_public_id').unique(),
    file_status_customer: fileCustomerStatusEnum('file_status_customer'),
    file_status_provider: fileProviderStatusEnum('file_status_provider'),
    file_customer_deadline: date('file_customer_deadline'),
    file_provider_deadline: date('file_provider_deadline'),
    file_customer_paid_at: timestamp('file_customer_paid_at'),
    file_provider_paid_at: timestamp('file_provider_paid_at'),
    file_accounted_at: date('file_accounted_at'),
    file_created_at: timestamp('file_created_at'),
    quickbooks_estimate_id: varchar('quickbooks_estimate_id', { length: 50 }),
    quickbooks_purchase_order_id: varchar('quickbooks_purchase_order_id', {
      length: 50
    }),
    content_hash: varchar('content_hash', { length: 64 }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow()
  },
  (table) => [
    index('external_id_idx').on(table.external_id),
    index('rebooking_id_idx').on(table.rebooking_id),
    index('content_hash_idx').on(table.content_hash)
  ]
);

export type Booking = typeof bookingTable.$inferSelect;
export type NewBooking = typeof bookingTable.$inferInsert;

// BookingHistoryAction enum
export const bookingHistoryActionEnum = pgEnum('booking_history_action', [
  BookingHistoryAction.CREATED,
  BookingHistoryAction.UPDATED,
  BookingHistoryAction.FILE_INITIALIZED,
  BookingHistoryAction.FILE_STATUS_SYNCED,
  BookingHistoryAction.CUSTOMER_STATUS_CHANGE,
  BookingHistoryAction.PROVIDER_STATUS_CHANGE,
  BookingHistoryAction.FILE_CUSTOMER_REBILLING,
  BookingHistoryAction.FILE_CUSTOMER_TO_ACCOUNT,
  BookingHistoryAction.FILE_CUSTOMER_INVOICED,
  BookingHistoryAction.FILE_PROVIDER_REQUEST_REFUND,
  BookingHistoryAction.AUTO_PAYMENT_PROCESSED
]);

// BookingHistory table
export const bookingHistoryTable = pgTable(
  'bookinghistory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    booking_id: uuid('booking_id')
      .references(() => bookingTable.id)
      .notNull(),
    user_id: varchar('user_id', { length: 255 }),
    user_email: varchar('user_email', { length: 255 }),
    user_name: varchar('user_name', { length: 255 }),
    action: bookingHistoryActionEnum('action').notNull(),
    data: text('data'),
    created_at: timestamp('created_at').notNull().defaultNow()
  },
  (table) => [index('booking_id_idx').on(table.booking_id)]
);

export type BookingHistory = typeof bookingHistoryTable.$inferSelect;
export type NewBookingHistory = typeof bookingHistoryTable.$inferInsert;

export const customerFileStatusFlow = pgTable('customer_file_status_flow', {
  id: uuid('id').primaryKey().defaultRandom(),
  file_status_from: fileCustomerStatusEnum('file_status_from').notNull(),
  file_status_to: fileCustomerStatusEnum('file_status_to').notNull()
});

export type CustomerFileStatusFlow = typeof customerFileStatusFlow.$inferSelect;

export const providerFileStatusFlow = pgTable('provider_file_status_flow', {
  id: uuid('id').primaryKey().defaultRandom(),
  file_status_from: fileProviderStatusEnum('file_status_from').notNull(),
  file_status_to: fileProviderStatusEnum('file_status_to').notNull()
});

export type ProviderFileStatusFlow = typeof providerFileStatusFlow.$inferSelect;

// AccountHistoryAction enum
export const accountHistoryActionEnum = pgEnum('account_history_action', [
  AccountHistoryAction.CREATED,
  AccountHistoryAction.UPDATED,
  AccountHistoryAction.BALANCE_CHECK,
  AccountHistoryAction.NOREFUND_ENABLED,
  AccountHistoryAction.NOREFUND_DISABLED
]);

// AccountHistory table
export const accountHistoryTable = pgTable(
  'accounthistory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    account_id: uuid('account_id')
      .references(() => accountTable.id)
      .notNull(),
    user_id: varchar('user_id', { length: 255 }),
    user_email: varchar('user_email', { length: 255 }),
    user_name: varchar('user_name', { length: 255 }),
    action: accountHistoryActionEnum('action').notNull(),
    data: text('data'),
    created_at: timestamp('created_at').notNull().defaultNow()
  },
  (table) => [index('account_id_idx').on(table.account_id)]
);

export type AccountHistory = typeof accountHistoryTable.$inferSelect;
export type NewAccountHistory = typeof accountHistoryTable.$inferInsert;
