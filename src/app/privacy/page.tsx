export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#200052] via-[#1a0044] to-[#0f0022] text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-[#836EF9] to-[#A855F7] bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          
          <div className="space-y-8 text-gray-300">
            <div className="text-sm text-gray-400 mb-8">
              <p><strong>Effective Date:</strong> June 20, 2025</p>
              <p><strong>Last Updated:</strong> June 20, 2025</p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="leading-relaxed">
                NadPay ("we," "our," or "us") operates as a decentralized payment platform on the Monad blockchain. 
                This Privacy Policy explains how we collect, use, and protect your information when you use our 
                decentralized application (dApp) and related services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">2.1 Blockchain Data</h3>
              <p className="leading-relaxed mb-4">
                As a decentralized application, all transaction data is stored on the Monad blockchain and is 
                publicly accessible. This includes:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Wallet addresses</li>
                <li>Transaction amounts and timestamps</li>
                <li>Payment link metadata (titles, descriptions, prices)</li>
                <li>Smart contract interactions</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">2.2 Technical Information</h3>
              <p className="leading-relaxed mb-4">
                We may collect technical information to improve our service:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>IP addresses (anonymized)</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Usage analytics (non-personal)</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">2.3 Images and Media</h3>
              <p className="leading-relaxed">
                Cover images uploaded for payment links are stored on third-party services (Imgur) and 
                are subject to their respective privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Information</h2>
              <p className="leading-relaxed mb-4">We use collected information to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Provide and maintain our decentralized payment platform</li>
                <li>Process transactions through smart contracts</li>
                <li>Improve user experience and platform functionality</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">4.1 Blockchain Transparency</h3>
              <p className="leading-relaxed mb-4">
                By design, blockchain transactions are public and immutable. All payment link data and 
                transactions are visible on the Monad blockchain explorer.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">4.2 Third-Party Services</h3>
              <p className="leading-relaxed mb-4">
                We may share information with:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Blockchain infrastructure providers</li>
                <li>Image hosting services (Imgur)</li>
                <li>Analytics providers (anonymized data only)</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">4.3 Legal Requirements</h3>
              <p className="leading-relaxed">
                We may disclose information when required by law, court order, or to protect our rights 
                and the safety of our users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
              <p className="leading-relaxed mb-4">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Smart contract security best practices</li>
              </ul>
              <p className="leading-relaxed mt-4">
                However, no method of transmission over the internet or blockchain is 100% secure. 
                Users are responsible for securing their private keys and wallet access.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">6.1 Blockchain Data</h3>
              <p className="leading-relaxed mb-4">
                Due to the immutable nature of blockchain technology, transaction data cannot be modified 
                or deleted once recorded on the Monad blockchain.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">6.2 Platform Access</h3>
              <p className="leading-relaxed mb-4">
                You may:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Stop using our platform at any time</li>
                <li>Deactivate your payment links</li>
                <li>Request information about data we collect</li>
                <li>Contact us with privacy concerns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. International Data Transfers</h2>
              <p className="leading-relaxed">
                Our services may be accessed globally. Blockchain data is distributed across network nodes 
                worldwide. By using our platform, you consent to the transfer of your information to 
                countries that may have different data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our platform is not intended for users under 18 years of age. We do not knowingly collect 
                personal information from children under 18. If we become aware of such collection, we will 
                take steps to delete the information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify users of material changes 
                by posting the updated policy on our platform with a new effective date. Continued use of our 
                platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Information</h2>
              <p className="leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <p><strong>Email:</strong> privacy@nadpay.xyz</p>
                <p><strong>Platform:</strong> NadPay Decentralized Payment Platform</p>
                <p><strong>Blockchain:</strong> Monad Testnet</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Disclaimer</h2>
              <p className="leading-relaxed">
                This platform operates on blockchain technology. Users acknowledge that blockchain transactions 
                are irreversible and that they are responsible for the security of their private keys and wallet 
                access. We are not liable for losses due to user error, technical failures, or blockchain network issues.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 