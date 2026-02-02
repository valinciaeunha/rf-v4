"use server"

import crypto from "crypto"
import { TOKOPAY_CHANNELS, type TokopayChannelKey } from "./tokopay-constants"

// Tokopay API Configuration
const TOKOPAY_API_URL = "https://api.tokopay.id/v1"
const TOKOPAY_MERCHANT_ID = process.env.TOKOPAY_MERCHANT_ID || ""
const TOKOPAY_SECRET = process.env.TOKOPAY_SECRET || ""

interface CreateOrderParams {
    amount: number
    channel: TokopayChannelKey
    refId: string
    customerName?: string
    customerEmail?: string
    customerPhone?: string
    itemName?: string
    productCode?: string
    redirectUrl?: string
    expiredTs?: number
}

interface TokopayOrderResponse {
    status: string
    data?: {
        panduan_pembayaran: string
        pay_url: string
        checkout_url?: string
        qr_link?: string
        qr_string?: string
        nomor_va?: string
        pay_code?: string
        trx_id: string
        ref_id?: string
        total_bayar: number
        total_diterima: number
        expire_time?: number
        status?: string
    }
    error_msg?: string
}

// Generate signature for Tokopay API: MD5(merchant_id:secret:ref_id)
function generateSignature(merchantId: string, secret: string, refId: string): string {
    const signatureString = `${merchantId}:${secret}:${refId}`
    return crypto.createHash("md5").update(signatureString).digest("hex")
}

// Create Tokopay Order (Advanced - POST)
export async function createTokopayOrder(params: CreateOrderParams): Promise<TokopayOrderResponse> {
    const {
        amount,
        channel,
        refId,
        customerName = "Customer",
        customerEmail = "",
        customerPhone = "",
        itemName = "Top Up Saldo",
        productCode = "TOPUP",
        redirectUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        expiredTs = 0 // 0 = default expiry from Tokopay
    } = params

    const channelCode = TOKOPAY_CHANNELS[channel]
    if (!channelCode) {
        return { status: "error", error_msg: "Invalid payment channel" }
    }

    // Generate signature
    const signature = generateSignature(TOKOPAY_MERCHANT_ID, TOKOPAY_SECRET, refId)

    // Build request body for Advanced Order
    const requestBody = {
        merchant_id: TOKOPAY_MERCHANT_ID,
        kode_channel: channelCode,
        reff_id: refId,
        amount: amount,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        redirect_url: `${redirectUrl}/billing`,
        expired_ts: expiredTs,
        signature: signature,
        items: [
            {
                product_code: productCode,
                name: itemName,
                price: amount,
                product_url: `${redirectUrl}/billing`,
                image_url: `${redirectUrl}/logo.png`
            }
        ]
    }



    try {
        const response = await fetch(`${TOKOPAY_API_URL}/order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        })

        const data = await response.json()


        if (data.status === "Success") {
            return {
                status: "success",
                data: {
                    ...data.data,
                    // Add ref_id to response for consistency
                    ref_id: refId,
                },
            }
        } else {
            return {
                status: "error",
                error_msg: data.error_msg || data.message || "Failed to create order",
            }
        }
    } catch (error) {
        console.error("Tokopay API Error:", error)
        return {
            status: "error",
            error_msg: "Network error while creating order",
        }
    }
}

// Check Order Status
// NOTE: Tokopay does not seem to have a public API for checking order status via Pull.
// Updates must rely on Webhook/Callback (Push).
 
// Check Order Status
// Documentation: https://docs.tokopay.id/order/cek-status-order
// Uses the same parameters as create order (Simple) to check/retrieve status
export async function checkTokopayOrderStatus(
    refId: string,
    _trxId?: string,
    amount?: number,
    channel?: string
): Promise<TokopayOrderResponse | null> {
    const merchantId = TOKOPAY_MERCHANT_ID
    const secret = TOKOPAY_SECRET

    if (!merchantId || !secret) {
        console.error("Tokopay credentials missing")
        return null
    }

    // Build query params
    const params = new URLSearchParams()
    params.append("merchant", merchantId)
    params.append("secret", secret)
    params.append("ref_id", refId)

    // According to docs, nominal and metode might be required to identify the order uniquely
    // or as validation. We include them if available.
    if (amount) params.append("nominal", amount.toString())
    if (channel) params.append("metode", channel)

    const url = `${TOKOPAY_API_URL}/order?${params.toString()}`

    try {
        const response = await fetch(url, {
            method: "GET",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json"
            }
        })
        const data = await response.json()

        if (data.status === "Success" || (data.data && data.data.status)) {
            return {
                status: "success",
                data: {
                    ...data.data,
                    // Map response fields to standardized interface if needed
                    // The docs show response structure matches our interface mostly
                }
            }
        }

        // Handle case where status is not "Success" (e.g. error looking up)
        console.warn(`Tokopay check failed for ${refId}:`, data)
        return null

    } catch (error) {
        console.error(`Error checking Tokopay status for ${refId}:`, error)
        return null
    }
}

