import { api } from "./clients";
import { endpoints } from "./endpoints";

//#region Types
export type WalletDto = {
    walletId: string;
    balance: number;
    bankCode: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountName: string | null;
    isActive: boolean;
    updatedAt: string;
};

export type WalletTransactionDto = {
    paymentId: string;
    transactionType: string;
    amount: number;
    status: string;
    description: string | null;
    timestamp: string;
};

export type WalletTransactionsResponse = {
    items: WalletTransactionDto[];
    total: number;
};

export type PayOrderResponse = {
    paymentId: string;
    amount: number;
    status: string;
};

export type PayProviderResponse = {
    paymentId: string;
    amount: number;
    providerName: string;
};

export type RefundOrderResponse = {
    refundId: string;
    refundAmount: number;
};

export type ProviderRevenueDto = {
    totalRevenue: number;
    totalPaidOrders: number;
    totalPendingOrders: number;
    pendingAmount: number;
};

export type ProviderPaymentDto = {
    paymentId: string;
    orderId: string | null;
    amount: number;
    status: string;
    description: string | null;
    timestamp: string;
};

export type ProviderPaymentHistoryResponse = {
    items: ProviderPaymentDto[];
    total: number;
};

export type ParentPaymentDto = {
    paymentId: string;
    orderId: string;
    amount: number;
    status: string;
    timestamp: string;
};

export type ParentPaymentHistoryResponse = {
    items: ParentPaymentDto[];
    total: number;
};
//#endregion

//#region School Wallet
export async function getSchoolWallet(): Promise<WalletDto> {
    return api<WalletDto>(endpoints.payments.schoolWallet, { auth: true });
}

export async function getWalletTransactions(page = 1, pageSize = 20): Promise<WalletTransactionsResponse> {
    return api<WalletTransactionsResponse>(
        `${endpoints.payments.walletTransactions}?page=${page}&pageSize=${pageSize}`,
        { auth: true }
    );
}

export async function updateWalletBankInfo(data: {
    bankCode: string; bankName: string; accountNumber: string; accountName: string;
}): Promise<{ success: boolean }> {
    return api<{ success: boolean }>(endpoints.payments.walletBankInfo, {
        method: "PUT",
        body: JSON.stringify(data),
        auth: true,
    });
}

export async function payProvider(orderId: string): Promise<PayProviderResponse> {
    return api<PayProviderResponse>(`${endpoints.payments.payProvider}/${orderId}/pay-provider`, {
        method: "POST",
        auth: true,
    });
}

export async function refundOrder(orderId: string, reason?: string): Promise<RefundOrderResponse> {
    return api<RefundOrderResponse>(`${endpoints.payments.refundOrder}/${orderId}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason }),
        auth: true,
    });
}
//#endregion

//#region Parent
export async function payOrder(orderId: string): Promise<PayOrderResponse> {
    return api<PayOrderResponse>(`${endpoints.payments.payOrder}/${orderId}/pay`, {
        method: "POST",
        auth: true,
    });
}

export async function getParentPaymentHistory(page = 1, pageSize = 20): Promise<ParentPaymentHistoryResponse> {
    return api<ParentPaymentHistoryResponse>(
        `${endpoints.payments.parentHistory}?page=${page}&pageSize=${pageSize}`,
        { auth: true }
    );
}
//#endregion

//#region Provider
export async function getProviderRevenue(): Promise<ProviderRevenueDto> {
    return api<ProviderRevenueDto>(endpoints.payments.providerRevenue, { auth: true });
}

export async function getProviderPaymentHistory(page = 1, pageSize = 20): Promise<ProviderPaymentHistoryResponse> {
    return api<ProviderPaymentHistoryResponse>(
        `${endpoints.payments.providerPayments}?page=${page}&pageSize=${pageSize}`,
        { auth: true }
    );
}

export async function generateInvoice(orderId: string): Promise<{ invoiceId: string; issueDate: string }> {
    return api<{ invoiceId: string; issueDate: string }>(
        `${endpoints.payments.providerInvoice}/${orderId}/invoice`,
        { method: "POST", auth: true }
    );
}

export async function getProviderWallet(): Promise<WalletDto> {
    return api<WalletDto>(endpoints.payments.providerWallet, { auth: true });
}

export async function getProviderWalletTransactions(page = 1, pageSize = 20): Promise<WalletTransactionsResponse> {
    return api<WalletTransactionsResponse>(
        `${endpoints.payments.providerWalletTransactions}?page=${page}&pageSize=${pageSize}`,
        { auth: true }
    );
}

export async function updateProviderWalletBankInfo(data: {
    bankCode: string; bankName: string; accountNumber: string; accountName: string;
}): Promise<{ success: boolean }> {
    return api<{ success: boolean }>(endpoints.payments.providerWalletBankInfo, {
        method: "PUT",
        body: JSON.stringify(data),
        auth: true,
    });
}
//#endregion
