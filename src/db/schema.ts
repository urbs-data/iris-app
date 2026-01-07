import {
  pgTable,
  integer,
  varchar,
  timestamp,
  real,
  serial
} from 'drizzle-orm/pg-core';

export const countryTable = pgTable('country', {
  id: integer('id').primaryKey(),
  name_en: varchar('name_en', { length: 255 }).notNull(),
  name_es: varchar('name_es', { length: 255 }).notNull(),
  code: varchar('code', { length: 10 }),
  zone: varchar('zone', { length: 50 })
});

export const destinationTable = pgTable('destination', {
  id: integer('id').primaryKey(),
  name_en: varchar('name_en', { length: 255 }).notNull(),
  name_es: varchar('name_es', { length: 255 }).notNull(),
  country_id: integer('country_id').references(() => countryTable.id)
});

export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  photo_url: varchar('photo_url', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  price: real('price').notNull(),
  category: varchar('category', { length: 255 }).notNull(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
