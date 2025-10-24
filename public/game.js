import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, prepareTransaction } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { createWallet, injectedProvider } from 'thirdweb/wallets';
import { toWei } from 'thirdweb/utils';

// Helper function to convert wei to ether
function fromWei(wei, decimals = 18) {
  return (BigInt(wei) / BigInt(10 ** decimals)).toString();
}

// Somnia testnet configuration
const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
  rpc: 'https://dream-rpc.somnia.network',
  blockExplorers: [
    {
      name: 'Shannon Explorer',
      url: 'https://shannon-explorer.somnia.network/',
    },
  ],
});

// Initialize Thirdweb client (you'll need to replace with your actual client ID)
const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || 'your-client-id-here', // Load from environment variables
});

// Game state
let gameState = {
  wallet: null,
  account: null,
  treasures: [],
  playerProgress: {
    treasuresFound: 0,
    totalSpent: 0,
    achievements: []
  },
  currentPayment: null,
  paymentId: null // Store payment ID for API access
};

// DOM elements
const connectWalletBtn = document.getElementById('connectWallet');
const walletInfo = document.getElementById('walletInfo');
const walletAddress = document.getElementById('walletAddress');
const walletBalance = document.getElementById('walletBalance');
const gameMap = document.getElementById('gameMap');
const paymentModal = document.getElementById('paymentModal');
const treasuresFoundSpan = document.getElementById('treasuresFound');
const totalSpentSpan = document.getElementById('totalSpent');
const achievementsList = document.getElementById('achievementsList');
const resetGameBtn = document.getElementById('resetGame');
const statusLog = document.getElementById('statusLog');

// Status logging function
function logStatus(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const statusDiv = document.createElement('div');
  statusDiv.style.marginBottom = '0.5rem';
  statusDiv.style.padding = '0.5rem';
  statusDiv.style.borderRadius = '5px';
  statusDiv.style.borderLeft = '3px solid';
  
  // Set colors based on type
  switch(type) {
    case 'success':
      statusDiv.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
      statusDiv.style.borderLeftColor = '#2ecc71';
      statusDiv.innerHTML = `<span style="color: #2ecc71;">✅ ${timestamp}</span> - ${message}`;
      break;
    case 'error':
      statusDiv.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
      statusDiv.style.borderLeftColor = '#e74c3c';
      statusDiv.innerHTML = `<span style="color: #e74c3c;">❌ ${timestamp}</span> - ${message}`;
      break;
    case 'warning':
      statusDiv.style.backgroundColor = 'rgba(241, 196, 15, 0.2)';
      statusDiv.style.borderLeftColor = '#f1c40f';
      statusDiv.innerHTML = `<span style="color: #f1c40f;">⚠️ ${timestamp}</span> - ${message}`;
      break;
    case 'payment':
      statusDiv.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
      statusDiv.style.borderLeftColor = '#3498db';
      statusDiv.innerHTML = `<span style="color: #3498db;">💰 ${timestamp}</span> - ${message}`;
      break;
    default:
      statusDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      statusDiv.style.borderLeftColor = '#bdc3c7';
      statusDiv.innerHTML = `<span style="color: #bdc3c7;">ℹ️ ${timestamp}</span> - ${message}`;
  }
  
  // Clear initial message if it exists
  if (statusLog.children.length === 1 && statusLog.children[0].style.opacity === '0.5') {
    statusLog.innerHTML = '';
  }
  
  // Add new message at the top
  statusLog.insertBefore(statusDiv, statusLog.firstChild);
  
  // Keep only last 10 messages
  while (statusLog.children.length > 10) {
    statusLog.removeChild(statusLog.lastChild);
  }
  
  // Auto-scroll to top
  statusLog.scrollTop = 0;
}

// Initialize game
async function initGame() {
  console.log('🎮 Initializing X402 Treasure Hunt Game');
  
  // Set up event listeners
  connectWalletBtn.addEventListener('click', connectWallet);
  resetGameBtn.addEventListener('click', resetGame);
  
  // Load game state
  await loadGameState();
  
  // Check if wallet was previously connected
  await checkWalletConnection();
}

// Wallet connection
async function connectWallet() {
  try {
    logStatus('Connecting to wallet...', 'info');
    console.log('🔗 Connecting wallet...');
    connectWalletBtn.textContent = 'Connecting...';
    connectWalletBtn.disabled = true;
    
    // Create wallet instance
    gameState.wallet = createWallet('io.metamask');
    
    // Connect to wallet
    gameState.account = await gameState.wallet.connect({ 
      client,
      chain: somniaTestnet 
    });
    
    logStatus(`Wallet connected: ${gameState.account.address.slice(0, 6)}...${gameState.account.address.slice(-4)}`, 'success');
    console.log('✅ Wallet connected:', gameState.account.address);
    
    // Switch to Somnia testnet if needed
    await switchToSomniaTestnet();
    
    // Update UI
    await updateWalletUI();
    
    // Load player progress
    await loadPlayerProgress();
    
  } catch (error) {
    logStatus('Failed to connect wallet. Please check MetaMask and try again.', 'error');
    console.error('❌ Wallet connection failed:', error);
    alert('Failed to connect wallet. Please make sure you have MetaMask installed and try again.');
    
    connectWalletBtn.textContent = 'Connect Wallet';
    connectWalletBtn.disabled = false;
  }
}

async function switchToSomniaTestnet() {
  try {
    // Check if we're on the correct network
    const chainId = await gameState.wallet.getChainId();
    
    if (chainId !== 50312) {
      console.log('🔄 Switching to Somnia testnet...');
      
      // Try to switch to Somnia testnet
      await gameState.wallet.switchChain(somniaTestnet);
      console.log('✅ Switched to Somnia testnet');
    }
  } catch (error) {
    console.error('❌ Failed to switch network:', error);
    
    // If switching fails, try to add the network
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xC458', // 50312 in hex
          chainName: 'Somnia Testnet',
          nativeCurrency: {
            name: 'STT',
            symbol: 'STT',
            decimals: 18
          },
          rpcUrls: ['https://dream-rpc.somnia.network'],
          blockExplorerUrls: ['https://shannon-explorer.somnia.network/']
        }]
      });
      
      console.log('✅ Somnia testnet added to wallet');
    } catch (addError) {
      console.error('❌ Failed to add Somnia testnet:', addError);
      alert('Please manually add Somnia testnet to your wallet:\n\nNetwork Name: Somnia Testnet\nRPC URL: https://dream-rpc.somnia.network\nChain ID: 50312\nSymbol: STT\nExplorer: https://shannon-explorer.somnia.network/');
    }
  }
}

async function updateWalletUI() {
  if (gameState.account) {
    // Update wallet info
    walletAddress.textContent = `${gameState.account.address.slice(0, 6)}...${gameState.account.address.slice(-4)}`;
    
    // Get balance
    try {
      const balance = await gameState.wallet.getBalance();
      walletBalance.textContent = parseFloat(fromWei(balance, 18)).toFixed(4);
    } catch (error) {
      console.error('Failed to get balance:', error);
      walletBalance.textContent = '0.0000';
    }
    
    // Update UI
    connectWalletBtn.textContent = 'Connected';
    connectWalletBtn.disabled = true;
    walletInfo.style.display = 'block';
    
    // Load purchased treasures
    await loadPurchasedTreasures();
  }
}

async function checkWalletConnection() {
  // Check if wallet is already connected
  if (window.ethereum && window.ethereum.selectedAddress) {
    try {
      await connectWallet();
    } catch (error) {
      console.log('No previous wallet connection found');
    }
  }
}

// Game state management
async function loadGameState() {
  try {
    // Load treasures from the treasure API
    const response = await fetch('http://localhost:4000/api/treasures');
    
    if (response.status === 402) {
      // This is expected - treasures require payment
      const paymentData = await response.json();
      console.log('💰 Treasures require payment:', paymentData);
      
      // Create mock treasures for the map
      gameState.treasures = [
        { id: 'treasure_1', x: 20, y: 30, name: 'Golden Compass', description: 'A mystical compass that points to hidden riches' },
        { id: 'treasure_2', x: 60, y: 20, name: 'Crystal of Wisdom', description: 'An ancient crystal with swirling magical energies' },
        { id: 'treasure_3', x: 80, y: 70, name: 'Phoenix Feather', description: 'A shimmering feather from an ancient phoenix' },
        { id: 'treasure_4', x: 15, y: 60, name: 'Dragon Scale Shield', description: 'An impenetrable shield forged from ancient dragon scales' },
        { id: 'treasure_5', x: 45, y: 80, name: 'Moonstone Amulet', description: 'A luminous amulet that glows with lunar energy' },
        { id: 'treasure_6', x: 75, y: 15, name: 'Thunderbolt Spear', description: 'A legendary spear crackling with electric power' },
        { id: 'treasure_7', x: 90, y: 45, name: 'Emerald of Life', description: 'A vibrant emerald pulsing with healing energy' },
        { id: 'treasure_8', x: 35, y: 25, name: 'Shadow Cloak', description: 'A mysterious cloak that bends light and shadow' },
        { id: 'treasure_9', x: 55, y: 55, name: 'Frost Crown', description: 'A crystalline crown radiating eternal winter' },
        { id: 'treasure_10', x: 25, y: 85, name: 'Starlight Orb', description: 'A celestial orb containing the essence of distant stars' },
        { id: 'treasure_11', x: 70, y: 40, name: 'Ancient Tome', description: 'A weathered book containing forgotten knowledge' },
        { id: 'treasure_12', x: 85, y: 75, name: 'Ruby of Passion', description: 'A fiery ruby that burns with eternal flame' }
      ];
      
      renderTreasures();
      console.log(`🗺️ Loaded ${gameState.treasures.length} treasures (payment required)`);
    } else {
      const data = await response.json();
      if (data && data.treasures && Array.isArray(data.treasures)) {
        gameState.treasures = data.treasures;
        renderTreasures();
        console.log(`🗺️ Loaded ${gameState.treasures.length} treasures`);
      } else {
        console.warn('⚠️ No treasures data received from server');
        gameState.treasures = [];
        renderTreasures();
      }
    }
  } catch (error) {
    console.error('❌ Failed to load game state:', error);
    gameState.treasures = [];
    renderTreasures();
  }
}

async function loadPlayerProgress() {
  if (!gameState.account) return;
  
  try {
    const response = await fetch(`/api/player/${gameState.account.address}/progress`);
    const progress = await response.json();
    
    gameState.playerProgress = progress;
    updateProgressUI();
    
    console.log('📊 Player progress loaded:', progress);
  } catch (error) {
    console.error('❌ Failed to load player progress:', error);
  }
}

function updateProgressUI() {
  treasuresFoundSpan.textContent = gameState.playerProgress.treasuresFound;
  totalSpentSpan.textContent = `${gameState.playerProgress.totalSpent} STT`;
  
  // Update achievements
  achievementsList.innerHTML = '';
  
  if (gameState.playerProgress.achievements.length === 0) {
    achievementsList.innerHTML = '<div style="opacity: 0.5; text-align: center; padding: 1rem;">No achievements yet</div>';
  } else {
    gameState.playerProgress.achievements.forEach(achievement => {
      const achievementEl = document.createElement('div');
      achievementEl.className = 'achievement';
      achievementEl.textContent = `🏆 ${achievement}`;
      achievementsList.appendChild(achievementEl);
    });
  }
}

// Treasure rendering
function renderTreasures() {
  gameMap.innerHTML = '';
  
  gameState.treasures.forEach(treasure => {
    const treasureEl = document.createElement('div');
    treasureEl.className = `treasure ${treasure.revealed ? 'revealed' : ''}`;
    treasureEl.style.left = `${treasure.x}px`;
    treasureEl.style.top = `${treasure.y}px`;
    treasureEl.textContent = treasure.type;
    treasureEl.title = treasure.revealed ? `${treasure.name} (Discovered!)` : 'Click to discover (1 STT)';
    
    treasureEl.addEventListener('click', () => discoverTreasure(treasure.id));
    
    gameMap.appendChild(treasureEl);
  });
}

// X402 Payment flow
async function discoverTreasure(treasureId) {
  if (!gameState.account) {
    logStatus('Please connect your wallet first!', 'warning');
    alert('Please connect your wallet first!');
    return;
  }
  
  try {
    logStatus(`Attempting to discover treasure ${treasureId}`, 'info');
    console.log(`🔍 Attempting to discover treasure ${treasureId}`);
    
    // Prepare headers with payment ID if available
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (gameState.paymentId) {
      headers['X-Payment-ID'] = gameState.paymentId;
      logStatus('Using existing payment ID for access', 'info');
      console.log('🔑 Using payment ID:', gameState.paymentId);
    }
    
    // Make request to treasure endpoint
    const response = await fetch(`http://localhost:4000/api/treasure/${treasureId}`, {
      headers: headers
    });
    const data = await response.json();
    
    if (response.status === 402) {
      // Payment required - show X402 payment modal
      logStatus(`Payment required: ${data.payment?.amount || '1'} STT for treasure ${treasureId}`, 'payment');
      console.log('💰 Payment required for treasure', treasureId);
      gameState.currentPayment = { ...data, treasureId }; // Store treasure ID
      showPaymentModal(data);
    } else if (response.ok) {
      // Treasure already unlocked
      logStatus(`Treasure discovered: ${data.treasure?.name || treasureId}`, 'success');
      console.log('✅ Treasure discovered:', data.treasure);
      showTreasureDiscovered(data.treasure);
      await loadGameState();
      await loadPlayerProgress();
    } else {
      throw new Error(data.error || 'Failed to access treasure');
    }
  } catch (error) {
    logStatus(`Error discovering treasure: ${error.message}`, 'error');
    console.error('❌ Error discovering treasure:', error);
    alert(`Error: ${error.message}`);
  }
}

function showPaymentModal(paymentData) {
  // Preserve treasureId if it exists in currentPayment
  const treasureId = gameState.currentPayment?.treasureId;
  gameState.currentPayment = { ...paymentData, treasureId };
  
  // Extract payment info from API response
  const payment = paymentData.payment || paymentData;
  const amount = payment.amount || paymentData['x402-price'] || '1';
  const recipient = payment.recipient || paymentData['x402-recipient'] || 'Game Server';
  
  // Update modal content
  document.getElementById('paymentTreasureName').textContent = `Treasure ${treasureId}`;
  document.getElementById('paymentAmount').textContent = `${amount} STT`;
  document.getElementById('paymentRecipient').textContent = recipient;
  
  // Show modal
  paymentModal.style.display = 'flex';
}

function closePaymentModal() {
  paymentModal.style.display = 'none';
  gameState.currentPayment = null;
  
  // Reset modal state
  document.getElementById('paymentLoading').style.display = 'none';
  document.getElementById('paymentButtons').style.display = 'block';
  document.getElementById('paymentResult').innerHTML = '';
}

async function makePayment() {
  if (!gameState.currentPayment || !gameState.account) {
    logStatus('Payment information not available', 'error');
    alert('Payment information not available');
    return;
  }
  
  try {
    // Extract payment data from the API response
    const paymentData = gameState.currentPayment.payment || gameState.currentPayment;
    const paymentAmount = paymentData.amount || gameState.currentPayment['x402-price'];
    const recipient = paymentData.recipient || gameState.currentPayment['x402-recipient'] || '0x0000000000000000000000000000000000000000';
    
    // Validate payment amount
    if (!paymentAmount || typeof paymentAmount !== 'string') {
      throw new Error('Invalid payment amount received from server');
    }
    
    logStatus(`Processing payment: ${paymentAmount} STT`, 'payment');
    console.log('💳 Processing X402 payment...');
    console.log('Payment data:', paymentData);
    console.log('Payment amount:', paymentAmount);
    console.log('Recipient:', recipient);
    console.log('Account object:', gameState.account);
    console.log('Wallet object:', gameState.wallet);
    
    // Show loading
    document.getElementById('paymentLoading').style.display = 'block';
    document.getElementById('paymentButtons').style.display = 'none';
    
    // Prepare transaction using Thirdweb v5 prepareTransaction
    const transaction = prepareTransaction({
      to: recipient,
      value: toWei(paymentAmount),
      chain: somniaTestnet,
      client,
    });
    
    logStatus('Sending transaction to blockchain...', 'payment');
    console.log('📤 Sending transaction:', transaction);
    
    // Ensure we have a valid wallet and account
    if (!gameState.wallet || !gameState.account || !gameState.account.address) {
      throw new Error('Wallet not properly connected');
    }
    
    // Send transaction using account (not wallet)
    const txResult = await sendTransaction({
      transaction,
      account: gameState.account,
      client,
    });
    
    // Validate transaction result
    if (!txResult || !txResult.transactionHash) {
      throw new Error('Transaction failed: No transaction hash received');
    }
    
    logStatus(`Transaction sent: ${txResult.transactionHash.slice(0, 10)}...`, 'success');
    console.log('✅ Transaction sent:', txResult.transactionHash);
    
    // Verify payment with server
    console.log('🔍 About to verify payment with treasureId:', gameState.currentPayment.treasureId);
    console.log('🔍 Current payment object:', gameState.currentPayment);
    console.log('🔍 gameState.currentPayment keys:', Object.keys(gameState.currentPayment || {}));
    console.log('🔍 treasureId type:', typeof gameState.currentPayment?.treasureId);
    console.log('🔍 treasureId stringified:', JSON.stringify(gameState.currentPayment?.treasureId));
    await verifyPayment(txResult.transactionHash, gameState.currentPayment.treasureId);
    
  } catch (error) {
    logStatus(`Payment failed: ${error.message}`, 'error');
    console.error('❌ Payment failed:', error);
    
    // Show error
    document.getElementById('paymentLoading').style.display = 'none';
    document.getElementById('paymentResult').innerHTML = `
      <div style="color: #e74c3c; padding: 1rem; background: rgba(231, 76, 60, 0.1); border-radius: 5px;">
        <strong>Payment Failed:</strong> ${error.message}
      </div>
    `;
    
    setTimeout(() => {
      document.getElementById('paymentButtons').style.display = 'block';
    }, 3000);
  }
}

async function verifyPayment(txHash, treasureId) {
  try {
    logStatus('Verifying payment with server...', 'payment');
    console.log('🔍 Verifying payment...');
    console.log('🔍 txHash:', txHash);
    console.log('🔍 treasureId:', treasureId);
    
    // Enhanced validation
    if (!txHash || !treasureId) {
      throw new Error('Missing transaction hash or treasure ID');
    }
    
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      throw new Error('Invalid transaction hash format');
    }
    
    const requestBody = {
      transactionHash: txHash,
      treasureId,
      walletAddress: gameState.account?.address
    };
    console.log('🔍 Request body:', requestBody);
    
    // Retry mechanism for network requests
    let response;
    let lastError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Verification attempt ${attempt}/3`);
        
        response = await fetch('http://localhost:4000/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          timeout: 30000 // 30 second timeout
        });
        
        break; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        console.log(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          console.log('⏳ Waiting 2 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!response) {
      throw new Error(`Network request failed after 3 attempts: ${lastError?.message}`);
    }
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response headers:', response.headers);
    
    const result = await response.json();
    console.log('🔍 Response body:', result);
    
    if (result.success) {
      logStatus('Payment verified successfully!', 'success');
      console.log('✅ Payment verified successfully');
      
      // Store payment proof for future API requests
      if (result.paymentProof || result.accessToken) {
        gameState.paymentId = result.paymentProof || result.accessToken;
        console.log('🔑 Payment proof stored:', gameState.paymentId);
      }
      
      // Show success message
      document.getElementById('paymentResult').innerHTML = `
        <div style="color: #27ae60; padding: 1rem; background: rgba(39, 174, 96, 0.1); border-radius: 5px;">
          <strong>Payment Verified!</strong><br>
          <a href="https://shannon-explorer.somnia.network/tx/${txHash}" target="_blank" style="color: #feca57;">View on Explorer</a>
        </div>
      `;
      
      // Wait a moment then close modal and refresh game
      setTimeout(async () => {
        closePaymentModal();
        await loadGameState();
        await loadPlayerProgress();
        await loadPurchasedTreasures();
        
        // Try to access the treasure again with payment ID
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (gameState.paymentId) {
          headers['x402-payment-proof'] = gameState.paymentId;
        }
        
        const treasureResponse = await fetch(`http://localhost:4000/api/treasure/${treasureId}`, {
          headers: headers
        });
        const treasureData = await treasureResponse.json();
        
        if (treasureResponse.ok) {
          logStatus(`Treasure discovered: ${treasureData.treasure.name}!`, 'success');
          showTreasureDiscovered(treasureData.treasure);
        }
      }, 2000);
      
    } else {
      throw new Error(result.error || 'Payment verification failed');
    }
    
  } catch (error) {
    logStatus(`Payment verification failed: ${error.message}`, 'error');
    console.error('❌ Payment verification failed:', error);
    
    document.getElementById('paymentResult').innerHTML = `
      <div style="color: #e74c3c; padding: 1rem; background: rgba(231, 76, 60, 0.1); border-radius: 5px;">
        <strong>Verification Failed:</strong> ${error.message}
      </div>
    `;
  }
  
  document.getElementById('paymentLoading').style.display = 'none';
}

function showTreasureDiscovered(treasure) {
  // Create a celebration popup
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(45deg, #feca57, #ff9ff3);
    color: #333;
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    z-index: 2000;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: bounceIn 0.5s ease;
  `;
  
  popup.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 1rem;">${treasure.type}</div>
    <h3>${treasure.name}</h3>
    <p>${treasure.description}</p>
    <p><strong>Value: ${treasure.value} points</strong></p>
    <button onclick="this.parentElement.remove()" style="
      background: #333;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      margin-top: 1rem;
      cursor: pointer;
    ">Awesome! 🎉</button>
  `;
  
  document.body.appendChild(popup);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (popup.parentElement) {
      popup.remove();
    }
  }, 5000);
}

async function loadPurchasedTreasures() {
  try {
    if (!gameState.account?.address) {
      console.log('No wallet connected, cannot load purchased treasures');
      return;
    }

    const response = await fetch(`http://localhost:4000/api/purchased/${gameState.account.address}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch purchased treasures: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      displayPurchasedTreasures(data.purchasedTreasures);
      console.log(`Loaded ${data.purchasedTreasures.length} purchased treasures`);
    }
  } catch (error) {
    console.error('Error loading purchased treasures:', error);
    logStatus('Failed to load purchased treasures', 'error');
  }
}

function displayPurchasedTreasures(treasures) {
  const purchasedList = document.getElementById('purchasedTreasuresList');
  
  if (!treasures || treasures.length === 0) {
    purchasedList.innerHTML = '<div style="opacity: 0.5; text-align: center; padding: 1rem;">No treasures purchased yet</div>';
    return;
  }

  purchasedList.innerHTML = treasures.map(treasure => `
    <div class="purchased-treasure" onclick="showPurchasedTreasureDetails('${treasure.id}')">
      <div class="purchased-treasure-header">
        <span>${treasure.name}</span>
        <span style="font-size: 0.8rem; opacity: 0.7;">${treasure.rarity}</span>
      </div>
      <div class="purchased-treasure-details">
        Purchased: ${new Date(treasure.purchaseDate).toLocaleDateString()}
      </div>
      <div class="purchased-treasure-details">
        Value: ${treasure.value} points • Cost: ${treasure.paymentAmount}
      </div>
      <div class="purchased-treasure-content">
        "${treasure.secretMessage}"
      </div>
    </div>
  `).join('');
}

async function showPurchasedTreasureDetails(treasureId) {
  try {
    // Fetch fresh data from API
    const response = await fetch(`http://localhost:4000/api/purchased/${gameState.account.address}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch treasure details');
    }
    
    const treasure = data.purchasedTreasures.find(t => t.id === treasureId);
    
    if (!treasure) {
      logStatus('Treasure details not found', 'error');
      return;
    }

  // Create a detailed view modal or expand the current display
  const detailsHtml = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 2000;" onclick="this.remove()">
      <div style="background: white; border: 2px solid black; padding: 2rem; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3>${treasure.name}</h3>
          <button onclick="this.closest('div[style*="position: fixed"]').remove()" style="background: black; color: white; border: none; padding: 0.5rem; cursor: pointer;">✕</button>
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Description:</strong> ${treasure.description}
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Rarity:</strong> ${treasure.rarity}
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Value:</strong> ${treasure.value} points
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Purchase Date:</strong> ${new Date(treasure.purchaseDate).toLocaleString()}
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Transaction:</strong> <a href="https://shannon-explorer.somnia.network/tx/${treasure.transactionHash}" target="_blank" style="color: blue; text-decoration: underline;">${treasure.transactionHash.substring(0, 10)}...</a>
        </div>
        <div style="border: 1px solid #ccc; padding: 1rem; background: #f9f9f9; margin-bottom: 1rem;">
          <strong>Secret Message:</strong><br>
          <em>"${treasure.secretMessage}"</em>
        </div>
        <div style="border: 1px solid #ccc; padding: 1rem; background: #f9f9f9;">
          <strong>Hidden Attributes:</strong><br>
          <div style="margin-top: 0.5rem;">
            <div><strong>Magical Power:</strong> ${treasure.hiddenAttributes?.magicalPower || 'Unknown'}</div>
            <div><strong>Enchantment:</strong> ${treasure.hiddenAttributes?.enchantment || 'Unknown'}</div>
            <div><strong>Origin:</strong> ${treasure.hiddenAttributes?.origin || 'Unknown'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', detailsHtml);
   
  } catch (error) {
    console.error('Error showing treasure details:', error);
    logStatus('Failed to load treasure details', 'error');
  }
}

// Game reset
async function resetGame() {
  if (confirm('Are you sure you want to reset the game? This will generate new treasures and reset all progress.')) {
    try {
      const response = await fetch('/api/game/reset', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        console.log('🔄 Game reset successfully');
        await loadGameState();
        
        if (gameState.account) {
          await loadPlayerProgress();
        }
        
        alert('Game reset! New treasures have been generated.');
      }
    } catch (error) {
      console.error('❌ Failed to reset game:', error);
      alert('Failed to reset game. Please try again.');
    }
  }
}

// Add CSS animation for popup
const style = document.createElement('style');
style.textContent = `
  @keyframes bounceIn {
    0% {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.05);
    }
    70% {
      transform: translate(-50%, -50%) scale(0.9);
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', initGame);

// Export functions for global access
window.closePaymentModal = closePaymentModal;
window.makePayment = makePayment;

console.log('🎮 X402 Treasure Hunt Game loaded successfully!');
console.log('🔗 Somnia Testnet: https://dream-rpc.somnia.network');
console.log('🌐 Explorer: https://shannon-explorer.somnia.network/');
console.log('💰 Payment: 1 STT per treasure');