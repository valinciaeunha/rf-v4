// Admin-related type definitions

export interface AdminUser {
    id: number
    username: string
    email: string
    role: "user" | "reseller" | "admin" | "developer"
    balance: string
    discordId: string | null
    whatsappNumber: string | null
    createdAt: Date
    updatedAt: Date
    // Stats
    totalDeposits: number
    totalTransactions: number
    successTransactions: number
    totalSpent: string
}

export interface AdminTransaction {
    id: number
    orderId: string | null
    status: "pending" | "success" | "failed" | "expired" | "refund"
    totalAmount: string | null
    price: string
    fee: string | null
    quantity: number
    paymentMethod: string
    assignedStocks: string | null
    // Stock codes resolved from assignedStocks
    stockCodes?: string[]
    createdAt: Date
    updatedAt: Date
    expiredAt: Date | null
    // Joined fields
    userName: string | null
    userEmail: string | null
    productName: string | null
}

export interface AdminDeposit {
    id: number
    trxId: string | null
    refId: string | null
    status: "pending" | "success" | "failed" | "expired"
    amount: string
    totalBayar: string | null
    paymentChannel: string | null
    createdAt: Date
    paidAt: Date | null
    // Joined fields
    userName: string | null
    userEmail: string | null
}

export interface UserHistoryData {
    transactions: TransactionHistoryItem[]
    deposits: DepositHistoryItem[]
}

export interface TransactionHistoryItem {
    id: number
    orderId: string | null
    productName: string | null
    totalAmount: string | null
    status: string
    paymentMethod: string
    quantity: number
    createdAt: Date
}

export interface DepositHistoryItem {
    id: number
    trxId: string | null
    paymentChannel: string | null
    amount: string
    status: string
    createdAt: Date
}

export interface PaginationState {
    page: number
    limit: number
    total: number
    totalPages: number
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<string, number> = {
    user: 0,
    reseller: 1,
    admin: 2,
    developer: 3,
} as const

export type UserRole = keyof typeof ROLE_HIERARCHY
