
export const supportData = {
    user: {
        name: "",
        email: ""
    },
    categories: [
        {
            id: "purchase_issue",
            label: "Kendala Pembelian Kode",
            requiresTxId: true
        },
        {
            id: "topup_issue",
            label: "Kendala Top Up Saldo",
            requiresTxId: true
        },
        {
            id: "account_issue",
            label: "Masalah Akun & Login",
            requiresTxId: false
        },
        {
            id: "general_question",
            label: "Pertanyaan Umum",
            requiresTxId: false
        },
        {
            id: "other",
            label: "Lainnya",
            requiresTxId: false
        }
    ]
}
