// Tokopay Payment Method Codes
export const TOKOPAY_CHANNELS = {
    // QRIS
    "qris": "QRIS",
    "qris_realtime": "QRISREALTIME",
    // E-Wallet
    "shopeepay": "SHOPEEPAY",
    "gopay": "GOPAY",
    "dana": "DANA",
    "ovo": "OVO",
    "linkaja": "LINKAJA",
    "astrapay": "ASTRAPAY",
    "virgo": "VIRGO",
    "dana_realtime": "DANAREAL",
    // Virtual Account
    "bri": "BRIVA",
    "bca": "BCAVA",
    "bni": "BNIVA",
    "mandiri": "MANDIRIVA",
    "permata": "PERMATAVA",
    "cimb": "CIMBVA",
    "danamon": "DANAMONVA",
    "bsi": "BSIVA",
    // Retail
    "alfamart": "ALFAMART",
    "indomaret": "INDOMARET",
} as const

export type TokopayChannelKey = keyof typeof TOKOPAY_CHANNELS

// Tokopay API Configuration (for use in server actions)
export const TOKOPAY_CONFIG = {
    API_URL: "https://api.tokopay.id/v1",
    MERCHANT_ID: process.env.TOKOPAY_MERCHANT_ID || "",
    SECRET: process.env.TOKOPAY_SECRET || "",
}
