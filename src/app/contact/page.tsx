export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#200052] via-[#1a0044] to-[#0f0022] text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-[#836EF9] to-[#A855F7] bg-clip-text text-transparent">
            Contact Us
          </h1>
          
          <div className="space-y-8 text-gray-300">
            <section className="text-center">
              <p className="text-lg leading-relaxed">
                Have questions about NadPay? Need technical support? We're here to help you with your 
                decentralized payment platform needs.
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-6">Get in Touch</h2>
                
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-xl font-medium text-white mb-3 flex items-center">
                      <span className="mr-3">📧</span>
                      General Support
                    </h3>
                    <p className="text-gray-300 mb-2">For general questions and platform support</p>
                    <a 
                      href="mailto:support@nadpay.xyz" 
                      className="text-[#836EF9] hover:text-[#A855F7] transition-colors"
                    >
                      support@nadpay.xyz
                    </a>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-xl font-medium text-white mb-3 flex items-center">
                      <span className="mr-3">🔒</span>
                      Privacy & Legal
                    </h3>
                    <p className="text-gray-300 mb-2">Privacy concerns and legal inquiries</p>
                    <a 
                      href="mailto:legal@nadpay.xyz" 
                      className="text-[#836EF9] hover:text-[#A855F7] transition-colors"
                    >
                      legal@nadpay.xyz
                    </a>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-xl font-medium text-white mb-3 flex items-center">
                      <span className="mr-3">🛡️</span>
                      Security Issues
                    </h3>
                    <p className="text-gray-300 mb-2">Report security vulnerabilities</p>
                    <a 
                      href="mailto:security@nadpay.xyz" 
                      className="text-[#836EF9] hover:text-[#A855F7] transition-colors"
                    >
                      security@nadpay.xyz
                    </a>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-xl font-medium text-white mb-3 flex items-center">
                      <span className="mr-3">💼</span>
                      Business Partnerships
                    </h3>
                    <p className="text-gray-300 mb-2">Integration and partnership opportunities</p>
                    <a 
                      href="mailto:partnerships@nadpay.xyz" 
                      className="text-[#836EF9] hover:text-[#A855F7] transition-colors"
                    >
                      partnerships@nadpay.xyz
                    </a>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-6">Platform Information</h2>
                
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-xl font-medium text-white mb-3">🌐 Blockchain Network</h3>
                    <div className="space-y-2 text-gray-300">
                      <p><strong>Network:</strong> Monad Testnet</p>
                      <p><strong>Chain ID:</strong> 10143</p>
                      <p><strong>RPC URL:</strong> https://testnet-rpc.monad.xyz</p>
                      <p><strong>Explorer:</strong> 
                        <a 
                          href="https://testnet.monadexplorer.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#836EF9] hover:text-[#A855F7] transition-colors ml-1"
                        >
                          testnet.monadexplorer.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-xl font-medium text-white mb-3">📱 Smart Contract</h3>
                    <div className="space-y-2 text-gray-300">
                      <p><strong>Contract Address:</strong></p>
                      <code className="text-xs bg-black/30 px-2 py-1 rounded break-all">
                        0x17c31F99b27c10fbFF0aA241202DF687377DC24A
                      </code>
                      <p className="mt-2">
                        <a 
                                                      href="https://testnet.monadexplorer.com/address/0x17c31F99b27c10fbFF0aA241202DF687377DC24A" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#836EF9] hover:text-[#A855F7] transition-colors"
                        >
                          View on Explorer →
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-xl font-medium text-white mb-3">🔧 Technical Support</h3>
                    <div className="space-y-2 text-gray-300">
                      <p><strong>Supported Wallets:</strong></p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>MetaMask</li>
                        <li>Phantom</li>
                        <li>OKX Wallet</li>
                        <li>HaHa Wallet</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-2">How do I create a payment link?</h3>
                  <p className="text-gray-300">
                    Connect your wallet, fill in the payment details (title, description, price, etc.), 
                    and click "Create Payment Link". The link will be generated using our smart contract.
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-2">What fees does NadPay charge?</h3>
                  <p className="text-gray-300">
                    NadPay charges a 1% platform fee on successful transactions. This fee is automatically 
                    deducted through our smart contract. Additional network gas fees apply.
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-2">Are transactions reversible?</h3>
                  <p className="text-gray-300">
                    No, all blockchain transactions are irreversible. Once a payment is confirmed on the 
                    Monad network, it cannot be undone. Always verify payment details before confirming.
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-2">How do I get MON tokens for testing?</h3>
                  <p className="text-gray-300">
                    You can get testnet MON tokens from the Monad testnet faucet. Visit the official 
                    Monad documentation for faucet links and instructions.
                  </p>
                </div>
              </div>
            </section>

            <section className="border-t border-white/20 pt-8">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-400 mb-3">💡 Need Help?</h3>
                <p className="text-blue-200 leading-relaxed">
                  Our support team typically responds within 24-48 hours. For urgent security issues, 
                  please use our security email for faster response. Make sure to include detailed 
                  information about your issue including wallet address and transaction hashes when relevant.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 