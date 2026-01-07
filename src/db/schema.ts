import { pgTable, integer, varchar } from 'drizzle-orm/pg-core';

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
