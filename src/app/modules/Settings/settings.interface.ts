export type TWebsiteFaq = {
  question: string;
  answer: string;
  category: string;
};

export type TWebsiteService = {
  id: string;
  title: string;
  description: string;
  highlight: string;
  details: string[];
};

export type TWebsiteStat = {
  value: string;
  label: string;
};

export type TWebsiteContent = {
  brandName: string;
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroStats: TWebsiteStat[];
  deliveryTitle: string;
  deliveryBody: string;
  deliveryImage1: string;
  deliveryImage2: string;
  heroImage: string;
  brandLogo: string;
  contactTitle: string;
  contactSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  supportHours: string;
  faqs: TWebsiteFaq[];
  services: TWebsiteService[];
};

export type TBankSettings = {
  key: "bank-config";
  currency: string;
  defaultOpeningBalance: number;
  defaultMinimumBalance: number;
  oneAccountPerUser: boolean;
  savingsAnnualInterestRate: number;
  interestCompoundingFrequencyPerYear: number;
  defaultLoanInterestRate: number;
  maxOpenLoansPerUser: number;
  withdrawMaxPerMonth: number;
  withdrawMaxPerDay: number;
  checkingWithdrawDailyAmountLimit: number;
  businessWithdrawDailyAmountLimit: number;
  savingsWithdrawDailyAmountLimit: number | null;
  checkingTransferDailyAmountLimit: number;
  checkingTransferDailyCountLimit: number;
  businessTransferDailyAmountLimit: number;
  savingsTransferDailyAmountLimit: number | null;
  savingsTransferDailyCountLimit: number | null;
  allowAdminDirectBalanceEdit: boolean;
  website: TWebsiteContent;
};

export const DEFAULT_WEBSITE_CONTENT: TWebsiteContent = {
  brandName: "EasyBank",
  heroEyebrow: "ENTERPRISE FINANCIAL PLATFORM",
  heroTitleLine1: "The Future of",
  heroTitleLine2: "Digital Banking",
  heroSubtitle:
    "Experience seamless banking with our comprehensive platform. Deposit, Withdraw, Transfer & Secure Loans - all powered by enterprise-grade security and lightning-fast processing.",
  heroPrimaryCta: "Start Your Journey",
  heroSecondaryCta: "Features",
  heroStats: [
    { value: "99.9%", label: "Uptime" },
    { value: "500K+", label: "Active Users" },
    { value: "4.9", label: "App Rating" },
  ],
  deliveryTitle: "Delivering the Best Banking Experience",
  deliveryBody:
    "EasyBank focuses on giving you the most efficient and reliable digital banking service. Our team ensures that every transaction is secure, smooth, and lightning fast. From savings to spending, we've got you covered.",
  deliveryImage1: "",
  deliveryImage2: "",
  heroImage: "",
  brandLogo: "",
  contactTitle: "Contact Us",
  contactSubtitle: "We are here to help with accounts, payments, and loans.",
  contactEmail: "support@easybank.com",
  contactPhone: "+880 1700-000000",
  contactAddress: "EasyBank HQ, Dhaka, Bangladesh",
  supportHours: "24/7 customer support",
  faqs: [
    {
      question: "How does the deposit service work and when do I get my interest?",
      answer:
        "Deposits are funded securely via card. Savings interest is applied from bank settings (default 6% p.a.). Track growth anytime from My Banking.",
      category: "Deposits",
    },
    {
      question: "Are there any fees for withdrawals and how fast are they processed?",
      answer:
        "Withdrawals create a pending request: funds are held immediately and released after manager/admin approval. Limits are controlled from Bank Settings.",
      category: "Withdrawals",
    },
    {
      question: "Can I transfer money to other EasyBank users?",
      answer:
        "Yes. Transfers between EasyBank accounts are instant and secured. Status shows immediately in your activity list.",
      category: "Transfers",
    },
    {
      question: "What are the loan terms and interest rates?",
      answer:
        "Loan rates default from bank settings. After approval, funds are disbursed to your account and repayments use secure Stripe checkout.",
      category: "Loans",
    },
    {
      question: "How secure is my money and personal information?",
      answer:
        "We use encrypted sessions, role-based access, and audited money flows. Personal data is never sold to third parties.",
      category: "Security",
    },
    {
      question: "What customer support is available if I need help?",
      answer:
        "Reach us by email, phone, or the contact form. Support hours and channels are managed from the admin panel.",
      category: "Support",
    },
  ],
  services: [
    {
      id: "deposit",
      title: "Deposit",
      description: "Fund your account securely with card payments",
      highlight: "Stripe secured",
      details: [
        "Card checkout with Stripe",
        "Balance updates after payment confirmation",
        "Track every deposit in Activity",
        "No hidden deposit fees",
      ],
    },
    {
      id: "withdraw",
      title: "Withdraw",
      description: "Request cash-out with branch review",
      highlight: "Reviewed release",
      details: [
        "Funds held on request",
        "Manager/admin approval required",
        "Daily and monthly limits apply",
        "Full status history in Activity",
      ],
    },
    {
      id: "transfer",
      title: "Transfer",
      description: "Send money instantly inside EasyBank",
      highlight: "Instant ledger",
      details: [
        "Transfer to another EasyBank account",
        "Instant balance updates",
        "Account-type limits from settings",
        "Secure encrypted processing",
      ],
    },
    {
      id: "loan",
      title: "Loan",
      description: "Apply, get approved, and repay securely",
      highlight: "Flexible terms",
      details: [
        "Request from My Banking",
        "Branch approval and disbursement",
        "Repay via Stripe installments",
        "Interest rate from bank settings",
      ],
    },
  ],
};

export const DEFAULT_BANK_SETTINGS: Omit<TBankSettings, "key"> = {
  currency: "BDT",
  defaultOpeningBalance: 2000,
  defaultMinimumBalance: 2000,
  oneAccountPerUser: true,
  savingsAnnualInterestRate: 0.06,
  interestCompoundingFrequencyPerYear: 1,
  defaultLoanInterestRate: 0.05,
  maxOpenLoansPerUser: 1,
  withdrawMaxPerMonth: 25,
  withdrawMaxPerDay: 2,
  checkingWithdrawDailyAmountLimit: 50000,
  businessWithdrawDailyAmountLimit: 200000,
  savingsWithdrawDailyAmountLimit: null,
  checkingTransferDailyAmountLimit: 100000,
  checkingTransferDailyCountLimit: 5,
  businessTransferDailyAmountLimit: 1000000,
  savingsTransferDailyAmountLimit: null,
  savingsTransferDailyCountLimit: null,
  allowAdminDirectBalanceEdit: false,
  website: DEFAULT_WEBSITE_CONTENT,
};
