import { pgTable, text, serial, timestamp, decimal, varchar, index, bigserial, integer, boolean, pgEnum, bigint } from "drizzle-orm/pg-core";

export const productTypeEnum = pgEnum("product_type", ["instant", "manual"]);
export const productStatusEnum = pgEnum("product_status", ["active", "inactive"]);
export const stockStatusEnum = pgEnum("stock_status", ["ready", "sold", "reserved"]);
export const depositStatusEnum = pgEnum("deposit_status", ["pending", "success", "failed", "expired"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "success", "failed", "expired", "refund"]);

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
        stockSoldToIdx: index("stock_sold_to_idx").on(table.soldTo),
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

export const deposits = pgTable("deposits", {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number" }).references(() => users.id),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    totalBayar: decimal("total_bayar", { precision: 15, scale: 2 }).default("0.00").notNull(),
    totalDiterima: decimal("total_diterima", { precision: 15, scale: 2 }).default("0.00").notNull(),
    paymentChannel: varchar("payment_channel", { length: 50 }).notNull(),
    refId: varchar("ref_id", { length: 100 }),
    trxId: varchar("trx_id", { length: 100 }).notNull(),
    qrLink: varchar("qr_link", { length: 500 }).default(""),
    qrString: text("qr_string"),
    payUrl: varchar("pay_url", { length: 500 }).default(""),
    status: depositStatusEnum("status").default("pending").notNull(),
    source: varchar("source", { length: 20 }).default("web"),
    isNotified: boolean("is_notified").default(false).notNull(),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
    return {
        depositUserIdIdx: index("deposit_user_id_idx").on(table.userId),
        depositStatusIdx: index("deposit_status_idx").on(table.status),
        depositCreatedAtIdx: index("deposit_created_at_idx").on(table.createdAt),
    };
});

export const transactions = pgTable("transactions", {
    id: serial("id").primaryKey(),
    orderId: varchar("order_id", { length: 100 }),
    snapToken: varchar("snap_token", { length: 255 }),
    publicId: varchar("public_id", { length: 64 }),
    userId: bigint("user_id", { mode: "number" }).references(() => users.id),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").default(1).notNull(),
    stockId: integer("stock_id").references(() => stocks.id),
    assignedStocks: text("assigned_stocks"),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 15, scale: 2 }),
    paymentMethod: varchar("payment_method", { length: 32 }).notNull(),
    paymentProof: varchar("payment_proof", { length: 255 }),
    qrString: text("qr_string"),
    paymentUrl: varchar("payment_url", { length: 500 }),
    dmMessageId: varchar("dm_message_id", { length: 100 }),
    isNotified: boolean("is_notified").default(false).notNull(),
    status: transactionStatusEnum("status").default("pending").notNull(),
    expiredAt: timestamp("expired_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
    return {
        transactionUserIdIdx: index("transaction_user_id_idx").on(table.userId),
        transactionOrderIdIdx: index("transaction_order_id_idx").on(table.orderId),
        transactionStatusIdx: index("transaction_status_idx").on(table.status),
        transactionCreatedAtIdx: index("transaction_created_at_idx").on(table.createdAt),
    };
});

// ========== AUDIT LOGS ==========
export const auditLogs = pgTable("audit_logs", {
    id: serial("id").primaryKey(),
    action: varchar("action", { length: 50 }).notNull(), // 'update_user', 'delete_user', etc.
    targetType: varchar("target_type", { length: 50 }).notNull(), // 'user', 'transaction', 'deposit'
    targetId: bigint("target_id", { mode: "number" }),
    performedBy: bigint("performed_by", { mode: "number" }).notNull().references(() => users.id),
    changes: text("changes"), // JSON diff of changes
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        auditPerformedByIdx: index("audit_performed_by_idx").on(table.performedBy),
        auditActionIdx: index("audit_action_idx").on(table.action),
        auditCreatedAtIdx: index("audit_created_at_idx").on(table.createdAt),
    };
});

// ========== REVIEWS ==========
export const reviews = pgTable("reviews", {
    id: serial("id").primaryKey(),
    publicId: varchar("public_id", { length: 32 }),
    userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    transactionId: integer("transaction_id").notNull(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
    rating: integer("rating").notNull(),
    reviewText: text("review_text"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
    return {
        reviewUserIdIdx: index("review_user_id_idx").on(table.userId),
        reviewProductIdIdx: index("review_product_id_idx").on(table.productId),
    };
});

// ========== TRANSACTION QUEUES (RESERVATION) ==========
export const transactionQueues = pgTable("transaction_queues", {
    id: serial("id").primaryKey(),
    transactionId: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: 'cascade' }),
    stockId: integer("stock_id").notNull().references(() => stocks.id, { onDelete: 'cascade' }),
    userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        queueTransactionIdIdx: index("queue_transaction_id_idx").on(table.transactionId),
        queueStockIdIdx: index("queue_stock_id_idx").on(table.stockId),
    };
});

// ========== LIVE MESSAGES (AUTO UPDATE) ==========
export const liveMessages = pgTable("live_messages", {
    id: serial("id").primaryKey(),
    guildId: varchar("guild_id", { length: 255 }).notNull(),
    channelId: varchar("channel_id", { length: 255 }).notNull(),
    messageId: varchar("message_id", { length: 255 }).notNull().unique(),
    failCount: integer("fail_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
    return {
        liveMessageIdx: index("live_message_idx").on(table.messageId),
        liveChannelIdx: index("live_channel_idx").on(table.channelId),
    };
});

// ========== BOT SETTINGS ==========
export const botSettings = pgTable("bot_settings", {
    id: serial("id").primaryKey(),
    guildId: varchar("guild_id", { length: 255 }).notNull().unique(), // One setting per guild
    publicLogChannelId: text("public_log_channel_id"), // Comma separated IDs
    privateLogChannelId: text("private_log_channel_id"), // Comma separated IDs
    expiredLogChannelId: text("expired_log_channel_id"), // Single ID usually, but text allows flexibility
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
