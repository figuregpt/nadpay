// Test script for points API
const testPointsAPI = async () => {
  const testData = {
    walletAddress: '0x1234567890123456789012345678901234567890', // Replace with your wallet
    type: 'nadraffle_buy',
    amount: '0.01', // 0.01 MON
    txHash: '0xtest123456789', // Replace with real transaction hash
    twitterHandle: 'testuser',
    metadata: {
      raffleId: '1',
      creatorAddress: '0x9876543210987654321098765432109876543210'
    }
  };

  try {
    console.log('🔍 Testing points API with data:', testData);
    
    const response = await fetch('http://localhost:3000/api/points/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📥 Response status:', response.status);
    const result = await response.json();
    console.log('📥 Response data:', result);

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
};

// Run the test
testPointsAPI(); 