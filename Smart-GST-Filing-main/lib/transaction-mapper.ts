import { BackendTransaction, CreateTransactionRequest, UpdateTransactionRequest } from './transactions-api';

// Frontend transaction type (from the original page.tsx)
export type FrontendTransaction = {
  id: string;
  type: "Credit" | "Debit";
  description: string;
  amount: number;
  date: string;
  category: string;
  status: "Completed" | "Pending" | "Failed";
  account: string;
  channel: "cash" | "bank" | "upi" | "cheque" | "loans";
  reference?: string;
};

// Map backend transaction to frontend format
export function mapBackendToFrontend(backendTx: BackendTransaction): FrontendTransaction {
  // Map mode to channel
  const modeToChannel: Record<string, FrontendTransaction["channel"]> = {
    "Cash": "cash",
    "Bank": "bank", 
    "UPI": "upi",
    "Cheque": "cheque",
    "Loans": "loans",
    "cash": "cash",
    "bank": "bank",
    "upi": "upi", 
    "cheque": "cheque",
    "loans": "loans"
  };

  // Map mode to account
  const modeToAccount: Record<string, string> = {
    "Cash": "Cash",
    "Bank": "Business Account",
    "UPI": "UPI", 
    "Cheque": "Bank",
    "Loans": "Bank",
    "cash": "Cash",
    "bank": "Business Account", 
    "upi": "UPI",
    "cheque": "Bank",
    "loans": "Bank"
  };

  return {
    id: backendTx.id.toString(),
    type: backendTx.transactionType as "Credit" | "Debit",
    description: backendTx.description,
    amount: parseFloat(backendTx.amount),
    date: new Date(backendTx.date).toISOString().split('T')[0],
    category: backendTx.category || (backendTx.transactionType === "Credit" ? "Income" : "Expenses"),
    status: (backendTx.status as "Completed" | "Pending" | "Failed") || "Completed",
    account: modeToAccount[backendTx.mode] || backendTx.mode,
    channel: modeToChannel[backendTx.mode] || "cash",
    reference: backendTx.reference?.toString()
  };
}

// Map frontend transaction to backend create request
export function mapFrontendToBackendCreate(frontendTx: {
  type: "Credit" | "Debit" | "";
  mode: string;
  amount: number;
  date: string;
  description: string;
  reference: string;
  category: string;
  notes: string;
  status?: string;
}, userId: string): CreateTransactionRequest {
  return {
    userId,
    transactionType: frontendTx.type as string,
    mode: frontendTx.mode,
    amount: frontendTx.amount.toString(),
    date: frontendTx.date,
    description: frontendTx.description,
    reference: frontendTx.reference ? parseInt(frontendTx.reference) : undefined,
    category: frontendTx.category,
    notes: frontendTx.notes || undefined,
    status: frontendTx.status || "Completed"
  };
}

// Map frontend transaction to backend update request
export function mapFrontendToBackendUpdate(frontendTx: FrontendTransaction): UpdateTransactionRequest {
  // Map channel back to mode
  const channelToMode: Record<FrontendTransaction["channel"], string> = {
    "cash": "Cash",
    "bank": "Bank",
    "upi": "UPI", 
    "cheque": "Cheque",
    "loans": "Loans"
  };

  return {
    transactionType: frontendTx.type,
    mode: channelToMode[frontendTx.channel],
    amount: frontendTx.amount.toString(),
    date: frontendTx.date,
    description: frontendTx.description,
    reference: frontendTx.reference ? parseInt(frontendTx.reference) : undefined,
    category: frontendTx.category,
    status: frontendTx.status
  };
}
