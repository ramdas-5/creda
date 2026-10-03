export interface User { id: string; email: string; full_name?: string; roles: string[]; }
export interface Paginated<T> { items: T[]; total: number; page: number; page_size: number; pages?: number; }
export interface Account { id: string; account_number: string; masked_number?: string; account_type: string; balance: string | number; available_balance?: string | number; status: string; branch?: string; branch_name?: string; opened_at?: string; created_at?: string; }
export interface Transaction { id: string; reference_number?: string; amount: string | number; type?: string; direction?: 'debit'|'credit'; status: string; description?: string; created_at?: string; balance_after?: string | number; sender?: string; receiver?: string; fees?: string | number; account_id?: string; }
export interface Beneficiary { id: string; nickname: string; account_number: string; bank_name?: string; ifsc?: string; full_name?: string; is_active?: boolean; verified?: boolean; }
export interface CardItem { id: string; masked_number: string; card_type: string; status: string; spending_limit?: string | number; }
export interface Loan { id: string; product?: string; amount: string | number; tenure_months?: number; interest_rate?: string | number; status: string; outstanding?: string | number; emi?: string | number; }
export interface DepositItem { id: string; principal?: string | number; amount?: string | number; tenure_months?: number; interest_rate?: string | number; maturity_amount?: string | number; maturity_date?: string; status: string; next_installment_date?: string; }
export interface NotificationItem { id: string; title: string; message?: string; body?: string; is_read?: boolean; read?: boolean; created_at?: string; type?: string; }
export interface Ticket { id: string; subject: string; category?: string; status: string; created_at?: string; updated_at?: string; messages?: { id: string; body: string; author?: string; created_at?: string }[]; }
export interface Branch { id: string; code: string; name: string; address?: string; phone?: string; email?: string; status?: string; }
