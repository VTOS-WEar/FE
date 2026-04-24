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
    paymentStatus: string;
    orderStatus: string;
    timestamp: string;
    campaignName?: string | null;
    providerName?: string | null;
    firstItemImageUrl?: string | null;
    itemCount: number;
    campaignId?: string | null;
    providerId?: string | null;
    childFullName?: string | null;
    childAvatarUrl?: string | null;
};

export type StatusCountDto = {
    status: string;
    count: number;
};

export type ParentPaymentHistoryResponse = {
    items: ParentPaymentDto[];
    total: number;
    totalOrder: number;
    statusCounts: StatusCountDto[];
};
//#endregion

//#region Parent
export async function payOrder(orderId: string): Promise<PayOrderResponse> {
    return api<PayOrderResponse>(`${endpoints.payments.payOrder}/${orderId}/pay`, {
        method: "POST",
        auth: true,
    });
}

export async function getParentPaymentHistory(page = 1, pageSize = 20, startDate?: string, endDate?: string, status?: string): Promise<ParentPaymentHistoryResponse> {
    let url = `${endpoints.payments.parentHistory}?page=${page}&pageSize=${pageSize}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (status) url += `&status=${status}`;
    
    return api<ParentPaymentHistoryResponse>(url, { auth: true });
}

export async function getParentWallet(): Promise<WalletDto> {
    return api<WalletDto>(endpoints.payments.parentWallet, { auth: true });
}

export async function getParentWalletTransactions(page = 1, pageSize = 20): Promise<WalletTransactionsResponse> {
    return api<WalletTransactionsResponse>(
        `${endpoints.payments.parentWalletTransactions}?page=${page}&pageSize=${pageSize}`,
        { auth: true }
    );
}

export async function requestParentWithdrawal(amount: number): Promise<{ withdrawalRequestId: string }> {
    return api<{ withdrawalRequestId: string }>(endpoints.payments.parentWalletWithdrawals, {
        method: "POST",
        body: JSON.stringify({ amount }),
        auth: true,
    });
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

export async function requestProviderWithdrawal(amount: number): Promise<{ id: string }> {
    return api<{ id: string }>("/api/providers/me/wallet/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount }),
        auth: true,
    });
}
//#endregion
