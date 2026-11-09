export const DEFAULT_PRIVACY_HTML = `
<h2>1. Introduction</h2>
<p>EasyBank (“we”, “our”, or “us”) provides digital banking services including account opening, deposits, withdrawals, transfers, and loans. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website and banking platform.</p>

<h2>2. Information We Collect</h2>
<p>We may collect the following categories of information:</p>
<ul>
  <li><strong>Identity details:</strong> name, email, phone number, and profile photo.</li>
  <li><strong>Account details:</strong> account number, account type, branch, status, and balances.</li>
  <li><strong>Transaction data:</strong> deposits, withdrawals, transfers, loan requests, repayments, and related statuses.</li>
  <li><strong>Technical data:</strong> login session tokens, device/browser information, and security logs needed to protect your account.</li>
  <li><strong>Support messages:</strong> information you send through contact forms or support channels.</li>
</ul>

<h2>3. How We Use Your Information</h2>
<p>We use your information to:</p>
<ul>
  <li>Create and manage customer, manager, and admin accounts.</li>
  <li>Process deposits via Stripe checkout and complete confirmed payments.</li>
  <li>Handle withdrawal requests, transfers, and loan workflows.</li>
  <li>Apply bank-configured limits, interest rates, and account rules.</li>
  <li>Improve platform security, prevent fraud, and troubleshoot issues.</li>
  <li>Communicate important account, payment, and service updates.</li>
</ul>

<h2>4. Payments and Stripe</h2>
<p>Card deposits and loan repayments are processed through Stripe. Payment card details are handled by Stripe and are not stored on EasyBank servers. We store only the transaction references and status needed to update your ledger securely.</p>

<h2>5. Sharing of Information</h2>
<p>We do not sell your personal data. We may share limited information with:</p>
<ul>
  <li><strong>Payment processors</strong> such as Stripe to complete transactions.</li>
  <li><strong>Cloud and infrastructure providers</strong> used to host and operate the service.</li>
  <li><strong>Authorized staff</strong> (admins/managers) who need access to review accounts, loans, or withdrawals.</li>
  <li><strong>Legal authorities</strong> when required by law or to protect against fraud and abuse.</li>
</ul>

<h2>6. Data Security</h2>
<p>We use encrypted sessions, role-based access control, hashed passwords, and audited money-flow controls. While no system can guarantee absolute security, we continuously apply safeguards appropriate for a banking platform.</p>

<h2>7. Data Retention</h2>
<p>We retain account and transaction records for as long as needed to operate the service, meet compliance obligations, resolve disputes, and maintain financial audit history.</p>

<h2>8. Your Choices and Rights</h2>
<p>Depending on applicable law, you may request access to your data, correction of inaccurate information, or support related to your account privacy. Contact us through the Contact page or support email published on the website.</p>

<h2>9. Cookies and Local Storage</h2>
<p>We use essential cookies/local storage for authentication and session continuity so you can securely access My Banking and staff portals.</p>

<h2>10. Policy Updates</h2>
<p>We may update this Privacy Policy as EasyBank features evolve. The latest version will always be available on this page.</p>

<h2>11. Contact</h2>
<p>For privacy questions, use the Contact page or email the support address configured in Platform settings.</p>
`;

export const DEFAULT_TERMS_HTML = `
<h2>1. Acceptance of Terms</h2>
<p>By creating an EasyBank account or using our website, banking app, or staff portals, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>

<h2>2. Eligibility and Accounts</h2>
<ul>
  <li>You must provide accurate registration information.</li>
  <li>One customer banking account policy may apply based on bank settings.</li>
  <li>Account activation may require manager/admin approval.</li>
  <li>You are responsible for keeping your login credentials confidential.</li>
</ul>

<h2>3. Banking Services</h2>
<p>EasyBank currently supports:</p>
<ul>
  <li><strong>Deposits</strong> through Stripe checkout. Balances update after payment confirmation.</li>
  <li><strong>Withdrawals</strong> as reviewable requests. Funds may be held until approved or rejected by authorized staff.</li>
  <li><strong>Transfers</strong> between EasyBank accounts, subject to account-type limits.</li>
  <li><strong>Loans</strong> including request, approval/disbursement, and installment repayment flows.</li>
</ul>

<h2>4. Limits, Fees, and Interest</h2>
<p>Opening balances, minimum balances, interest rates, loan defaults, and transaction limits are controlled by bank settings configured by administrators. These values may change over time and apply to future transactions once updated.</p>

<h2>5. Payment Processing</h2>
<p>Inbound card payments are processed by Stripe. EasyBank records transaction outcomes in your ledger. Failed, cancelled, or incomplete Stripe sessions do not credit balances.</p>

<h2>6. Prohibited Use</h2>
<p>You agree not to:</p>
<ul>
  <li>Attempt unauthorized access to accounts, APIs, or admin/manager tools.</li>
  <li>Manipulate balances, forge transactions, or abuse review workflows.</li>
  <li>Use the platform for fraud, money laundering, or illegal activity.</li>
  <li>Interfere with platform security, availability, or integrity.</li>
</ul>

<h2>7. Account Suspension</h2>
<p>We may suspend, close, or restrict accounts that violate these terms, fail verification, or present security/fraud risk. Pending withdrawals or loans may be reviewed according to internal procedures.</p>

<h2>8. Role Responsibilities</h2>
<ul>
  <li><strong>Customers</strong> use the public website for product knowledge and My Banking for money actions.</li>
  <li><strong>Managers</strong> use the portal to review accounts, transactions, loans, and branch operations.</li>
  <li><strong>Admins</strong> manage users, branches, platform settings, and legal content.</li>
</ul>

<h2>9. Availability and Changes</h2>
<p>We aim for reliable service but do not guarantee uninterrupted availability. Features, limits, and workflows may be improved or updated as the platform evolves.</p>

<h2>10. Liability</h2>
<p>To the maximum extent permitted by law, EasyBank is not liable for indirect or consequential losses arising from service interruptions, third-party payment processor issues, or user misuse. Direct ledger corrections may be handled through authorized admin procedures when enabled.</p>

<h2>11. Governing Use</h2>
<p>These terms apply to your use of EasyBank’s website and digital banking services. Additional product-specific notices may appear in-app during deposit, withdrawal, transfer, or loan flows.</p>

<h2>12. Contact</h2>
<p>Questions about these terms can be sent through the Contact page.</p>
`;

export const DEFAULT_ABOUT_HTML = `
<h2>Our Mission</h2>
<p>EasyBank makes everyday banking clearer and more accessible. We combine a helpful public website for product education with a secure personal banking experience for customers, plus focused tools for managers and admins.</p>

<h2>What EasyBank Offers</h2>
<ul>
  <li><strong>Customer banking:</strong> overview, deposits, withdrawals, transfers, loans, and activity tracking in a dedicated banking experience.</li>
  <li><strong>Secure payments:</strong> Stripe-powered deposits and loan repayments with webhook-confirmed ledger updates.</li>
  <li><strong>Responsible cash-outs:</strong> withdrawals go through review so funds are released with proper oversight.</li>
  <li><strong>Manager portal:</strong> queue-based tools for accounts, transactions, loans, and branch performance.</li>
  <li><strong>Admin control:</strong> dynamic bank settings, website content, images, and legal pages managed from one place.</li>
</ul>

<h2>How Customers Use EasyBank</h2>
<p>Customers first explore the website — home, features, calculators, and contact — to understand products. When ready, they open <strong>My Banking</strong> to manage their account and money flows. This keeps product knowledge on the website and transactional work in a purpose-built banking space.</p>

<h2>Trust and Operations</h2>
<p>Money movement is designed around clear roles and safer flows: inbound payments through Stripe, transfers on the ledger, withdrawals with approval, and loans with structured request-to-repayment steps. Platform rules such as rates and limits are configurable so the bank can adapt without hardcoding.</p>

<h2>Continuously Improving</h2>
<p>EasyBank is built to stay flexible — from account policies and interest settings to website messaging, Cloudinary-hosted visuals, and privacy/terms content that admins can update as the business grows.</p>

<h2>Get in Touch</h2>
<p>Visit the Contact page for support, or explore Features to learn more about deposits, withdrawals, transfers, and loans.</p>
`;
