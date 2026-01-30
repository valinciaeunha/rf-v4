import { pgTable, text, serial, timestamp, decimal, varchar, index, bigserial, integer, boolean, pgEnum, bigint } from "drizzle-orm/pg-core";

export const productTypeEnum = pgEnum("product_type", ["instant", "manual"]);
export const productStatusEnum = pgEnum("product_status", ["active", "inactive"]);
export const stockStatusEnum = pgEnum("stock_status", ["ready", "sold", "reserved"]);

export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    productId: varchar("product_id", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    buyPrice: decimal("buy_price", { precision: 15, scale: 2 }).default("0.00").notNull(),
    expiredDays: integer("expired_days").default(30).notNull(),
    type: productTypeEnum("type").default("manual").notNull(),
    badge: varchar("badge", { length: 50 }),
    status: productStatusEnum("status").default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
    return {
        productIdIdx: index("product_id_idx").on(table.productId),
    };
});

export const productSpecifications = pgTable("product_specifications", {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
    iconType: varchar("icon_type", { length: 50 }).notNull(),
    label: varchar("label", { length: 100 }).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
    return {
        prodSpecProductIdIdx: index("prod_spec_product_id_idx").on(table.productId),
    };
});

export const stocks = pgTable("stocks", {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
    code: varchar("code", { length: 255 }).notNull(),
    status: stockStatusEnum("status").default("ready").notNull(),
    soldTo: bigint("sold_to", { mode: "number" }).references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
    return {
        stockProductIdIdx: index("stock_product_id_idx").on(table.productId),
        stockStatusIdx: index("stock_status_idx").on(table.status),
    };
});

export const users = pgTable("users", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    username: varchar("username", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password"), // Nullable for Discord-only users
    role: varchar("role", { length: 50 }).default("user").notNull(),
    balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
    discordId: varchar("discord_id", { length: 255 }).unique(),
    whatsappNumber: varchar("whatsapp_number", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
    return {
        emailIdx: index("email_idx").on(table.email),
        discordIdIdx: index("discord_id_idx").on(table.discordId),
    };
});
