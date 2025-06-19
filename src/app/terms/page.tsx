export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#200052] via-[#1a0044] to-[#0f0022] text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-[#836EF9] to-[#A855F7] bg-clip-text text-transparent">
            Terms of Service
          </h1>
          
          <div className="space-y-8 text-gray-300">
            <div className="text-sm text-gray-400 mb-8">
              <p><strong>Effective Date:</strong> June 20, 2025</p>
              <p><strong>Last Updated:</strong> June 20, 2025</p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing or using NadPay ("the Platform," "we," "our," or "us"), you ("User," "you," or "your") 
                agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, 
                do not use the Platform. These Terms constitute a legally binding agreement between you and NadPay.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="leading-relaxed mb-4">
                NadPay is a decentralized payment platform built on the Monad blockchain that allows users to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Create payment links for goods and services</li>
                <li>Process cryptocurrency payments through smart contracts</li>
                <li>Manage payment transactions on the blockchain</li>
                <li>Access decentralized finance (DeFi) payment solutions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Eligibility and User Requirements</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">3.1 Age Requirement</h3>
              <p className="leading-relaxed mb-4">
                You must be at least 18 years old to use this Platform. By using the Platform, you represent 
                and warrant that you meet this age requirement.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">3.2 Legal Capacity</h3>
              <p className="leading-relaxed mb-4">
                You must have the legal capacity to enter into binding contracts in your jurisdiction.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">3.3 Compliance</h3>
              <p className="leading-relaxed">
                You must comply with all applicable laws and regulations in your jurisdiction, including 
                but not limited to financial regulations, tax obligations, and anti-money laundering (AML) requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Platform Fees</h2>
              <p className="leading-relaxed mb-4">
                NadPay charges a platform fee of 1% on all successful transactions processed through payment links. 
                This fee is automatically deducted from the payment amount through our smart contract system.
              </p>
              <p className="leading-relaxed">
                Additional blockchain network fees (gas fees) may apply and are determined by the Monad network, 
                not by NadPay.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. User Responsibilities</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">5.1 Wallet Security</h3>
              <p className="leading-relaxed mb-4">
                You are solely responsible for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Securing your cryptocurrency wallet and private keys</li>
                <li>Maintaining the confidentiality of your wallet credentials</li>
                <li>All transactions made from your wallet</li>
                <li>Backing up your wallet and recovery phrases</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">5.2 Accurate Information</h3>
              <p className="leading-relaxed mb-4">
                You must provide accurate and truthful information when creating payment links, including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Product or service descriptions</li>
                <li>Pricing information</li>
                <li>Terms of sale or service delivery</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">5.3 Prohibited Activities</h3>
              <p className="leading-relaxed mb-4">
                You agree not to use the Platform for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Illegal activities or transactions</li>
                <li>Money laundering or terrorist financing</li>
                <li>Fraud, scams, or deceptive practices</li>
                <li>Sale of prohibited goods or services</li>
                <li>Violation of intellectual property rights</li>
                <li>Market manipulation or insider trading</li>
                <li>Spamming or phishing activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Blockchain and Smart Contract Risks</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">6.1 Immutable Transactions</h3>
              <p className="leading-relaxed mb-4">
                All transactions on the blockchain are irreversible. Once a transaction is confirmed, 
                it cannot be undone, modified, or refunded by NadPay.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">6.2 Smart Contract Risks</h3>
              <p className="leading-relaxed mb-4">
                Smart contracts are autonomous programs that execute automatically. While we implement 
                security best practices, users acknowledge the inherent risks including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Potential bugs or vulnerabilities in smart contract code</li>
                <li>Network congestion affecting transaction processing</li>
                <li>Changes to the underlying blockchain protocol</li>
                <li>Regulatory changes affecting blockchain operations</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">6.3 Network Risks</h3>
              <p className="leading-relaxed">
                The Monad blockchain network may experience downtime, forks, or other technical issues 
                that could affect platform functionality. We are not responsible for blockchain network issues.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Disclaimers</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">7.1 "As Is" Service</h3>
              <p className="leading-relaxed mb-4">
                The Platform is provided "as is" and "as available" without warranties of any kind, 
                either express or implied, including but not limited to warranties of merchantability, 
                fitness for a particular purpose, or non-infringement.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">7.2 No Financial Advice</h3>
              <p className="leading-relaxed mb-4">
                NadPay does not provide financial, investment, or legal advice. All decisions regarding 
                cryptocurrency transactions are made solely by users at their own risk.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">7.3 Third-Party Services</h3>
              <p className="leading-relaxed">
                We integrate with third-party services (wallets, image hosting, etc.) and are not 
                responsible for their availability, security, or functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
              <p className="leading-relaxed mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, NADPAY SHALL NOT BE LIABLE FOR:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Loss of funds due to user error or negligence</li>
                <li>Smart contract bugs or vulnerabilities</li>
                <li>Blockchain network issues or downtime</li>
                <li>Unauthorized access to user wallets</li>
                <li>Third-party service failures</li>
                <li>Regulatory changes affecting platform use</li>
                <li>Indirect, incidental, or consequential damages</li>
              </ul>
              <p className="leading-relaxed mt-4">
                <strong>OUR TOTAL LIABILITY SHALL NOT EXCEED THE PLATFORM FEES PAID BY YOU IN THE 
                12 MONTHS PRECEDING THE CLAIM.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Indemnification</h2>
              <p className="leading-relaxed">
                You agree to indemnify, defend, and hold harmless NadPay, its affiliates, officers, directors, 
                employees, and agents from and against any claims, damages, losses, costs, and expenses 
                (including reasonable attorney fees) arising from or relating to your use of the Platform, 
                violation of these Terms, or infringement of any rights of another party.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Platform Modifications and Termination</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">10.1 Service Changes</h3>
              <p className="leading-relaxed mb-4">
                We reserve the right to modify, suspend, or discontinue the Platform (or any part thereof) 
                at any time with or without notice.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">10.2 User Termination</h3>
              <p className="leading-relaxed">
                You may stop using the Platform at any time. Due to the decentralized nature of blockchain, 
                existing payment links and transactions will remain on the blockchain even if you stop using our interface.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Intellectual Property</h2>
              <p className="leading-relaxed mb-4">
                The Platform interface, design, and our proprietary technology are protected by intellectual 
                property laws. You may not copy, modify, distribute, or reverse engineer our Platform without permission.
              </p>
              <p className="leading-relaxed">
                Smart contracts deployed on the blockchain are public and may be viewed by anyone, 
                consistent with blockchain transparency principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Dispute Resolution</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">12.1 Governing Law</h3>
              <p className="leading-relaxed mb-4">
                These Terms are governed by and construed in accordance with the laws of [JURISDICTION], 
                without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">12.2 Arbitration</h3>
              <p className="leading-relaxed mb-4">
                Any disputes arising from these Terms or use of the Platform shall be resolved through 
                binding arbitration in accordance with the rules of [ARBITRATION ORGANIZATION].
              </p>

              <h3 className="text-xl font-medium text-white mb-3">12.3 Class Action Waiver</h3>
              <p className="leading-relaxed">
                You agree to resolve disputes individually and waive any right to participate in 
                class action lawsuits or class-wide arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Regulatory Compliance</h2>
              <p className="leading-relaxed mb-4">
                Cryptocurrency regulations vary by jurisdiction and are rapidly evolving. Users are 
                responsible for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Understanding applicable laws in their jurisdiction</li>
                <li>Complying with tax reporting requirements</li>
                <li>Obtaining necessary licenses or permits for business use</li>
                <li>Following AML/KYC requirements where applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Updates to Terms</h2>
              <p className="leading-relaxed">
                We may update these Terms from time to time. Material changes will be posted on the Platform 
                with a new effective date. Continued use of the Platform after changes constitutes acceptance 
                of the updated Terms. Users are encouraged to review Terms regularly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. Severability</h2>
              <p className="leading-relaxed">
                If any provision of these Terms is held to be invalid or unenforceable, the remaining 
                provisions shall remain in full force and effect, and the invalid provision shall be 
                modified to the minimum extent necessary to make it valid and enforceable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">16. Contact Information</h2>
              <p className="leading-relaxed">
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <p><strong>Email:</strong> legal@nadpay.com</p>
                <p><strong>Platform:</strong> NadPay Decentralized Payment Platform</p>
                <p><strong>Blockchain:</strong> Monad Testnet</p>
              </div>
            </section>

            <section className="border-t border-white/20 pt-8">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-amber-400 mb-3">⚠️ Important Notice</h3>
                <p className="text-amber-200 leading-relaxed">
                  Cryptocurrency transactions are irreversible and carry inherent risks. Only use funds you can 
                  afford to lose. NadPay is a decentralized platform and cannot reverse blockchain transactions. 
                  Always verify payment details before confirming transactions.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}