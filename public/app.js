let userAddress = null;
let compiledContract = null;
let currentNetwork = 'unknown';

const networkBadge = document.getElementById('networkBadge');
const networkName = document.getElementById('networkName');
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletDetails = document.getElementById('walletDetails');
const walletAddressEl = document.getElementById('walletAddress');
const walletBalanceEl = document.getElementById('walletBalance');
const supplyReceiverEl = document.getElementById('supplyReceiver');
const deployBtn = document.getElementById('deployBtn');

const tokenForm = document.getElementById('tokenForm');
const statusSection = document.getElementById('statusSection');
const statusSpinner = document.getElementById('statusSpinner');
const statusTitle = document.getElementById('statusTitle');
const statusMsg = document.getElementById('statusMsg');

const successCard = document.getElementById('successCard');
const deployedAddressEl = document.getElementById('deployedAddress');
const deployedTxIdEl = document.getElementById('deployedTxId');
const tronscanLink = document.getElementById('tronscanLink');
const watchAssetBtn = document.getElementById('watchAssetBtn');
const copyAddressBtn = document.getElementById('copyAddressBtn');
const copyTxBtn = document.getElementById('copyTxBtn');

// Load compiled contract ABI & Bytecode
async function loadCompiledContract() {
  try {
    const res = await fetch('/compiled.json');
    if (!res.ok) throw new Error('Gagal memuat compiled.json');
    compiledContract = await res.json();
    console.log('Smart contract loaded successfully:', compiledContract.contractName);
  } catch (err) {
    console.error('Error loading compiled contract:', err);
    alert('Peringatan: Gagal memuat smart contract compiled.json dari server lokal.');
  }
}

// Check TronWeb availability
async function initTron() {
  await loadCompiledContract();

  if (window.tronWeb && window.tronWeb.ready) {
    handleWalletConnected();
  } else {
    // Listen for TronLink injection
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.tronWeb && window.tronWeb.ready) {
        clearInterval(interval);
        handleWalletConnected();
      } else if (attempts >= 10) {
        clearInterval(interval);
      }
    }, 500);
  }
}

// Format Address: T...1234
function formatAddress(addr) {
  if (!addr) return '';
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
}

// Identify Connected Network
function detectNetwork() {
  if (!window.tronWeb || !window.tronWeb.fullNode || !window.tronWeb.fullNode.host) {
    return 'unknown';
  }
  const host = window.tronWeb.fullNode.host.toLowerCase();
  if (host.includes('nile')) return 'nile';
  if (host.includes('shasta')) return 'shasta';
  if (host.includes('trongrid.io') || host.includes('tron')) return 'mainnet';
  return 'custom';
}

// Update Network UI
function updateNetworkUI() {
  currentNetwork = detectNetwork();
  networkBadge.className = 'network-badge';

  if (currentNetwork === 'nile') {
    networkBadge.classList.add('nile');
    networkName.textContent = 'TRON Nile Testnet (Aman)';
  } else if (currentNetwork === 'mainnet') {
    networkBadge.classList.add('mainnet');
    networkName.textContent = 'TRON Mainnet (Uang Asli)';
  } else if (currentNetwork === 'shasta') {
    networkBadge.classList.add('nile');
    networkName.textContent = 'TRON Shasta Testnet';
  } else {
    networkBadge.classList.add('disconnected');
    networkName.textContent = 'Custom Network';
  }
}

// Handle Wallet Connected
async function handleWalletConnected() {
  if (!window.tronWeb || !window.tronWeb.defaultAddress || !window.tronWeb.defaultAddress.base58) {
    return;
  }

  userAddress = window.tronWeb.defaultAddress.base58;
  updateNetworkUI();

  // Update UI Elements
  walletDetails.classList.remove('hidden');
  walletAddressEl.textContent = formatAddress(userAddress);
  walletAddressEl.title = userAddress;
  supplyReceiverEl.textContent = `${userAddress} (Wallet Anda)`;
  connectWalletBtn.textContent = `🟢 ${formatAddress(userAddress)}`;
  deployBtn.disabled = false;

  // Fetch Balance
  try {
    const sunBalance = await window.tronWeb.trx.getBalance(userAddress);
    const trxBalance = (sunBalance / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 });
    walletBalanceEl.textContent = `${trxBalance} TRX`;

    if (sunBalance < 10_000_000 && currentNetwork === 'nile') {
      walletBalanceEl.innerHTML = `${trxBalance} TRX <small style="color:#f87171">(Perlu klaim Faucet dulu)</small>`;
    }
  } catch (e) {
    console.warn('Gagal mengambil balance:', e);
  }
}

// Connect Wallet Button Click
connectWalletBtn.addEventListener('click', async () => {
  if (window.tronLink) {
    try {
      const res = await window.tronLink.request({ method: 'tron_requestAccounts' });
      if (res && res.code === 200) {
        setTimeout(handleWalletConnected, 500);
      }
    } catch (err) {
      console.error('User rejected connection:', err);
    }
  } else if (window.tronWeb && window.tronWeb.ready) {
    handleWalletConnected();
  } else {
    alert('Ekstensi TronLink tidak terdeteksi!\n\nSilakan install ekstensi TronLink di Chrome Web Store dan login terlebih dahulu.');
    window.open('https://chromewebstore.google.com/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec', '_blank');
  }
});

// Deploy Form Submit
tokenForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!userAddress || !window.tronWeb) {
    alert('Silakan hubungkan dompet TronLink terlebih dahulu.');
    return;
  }

  if (!compiledContract) {
    alert('Smart contract belum siap. Muat ulang halaman.');
    return;
  }

  const name = document.getElementById('tokenName').value.trim();
  const symbol = document.getElementById('tokenSymbol').value.trim().toUpperCase();
  const decimals = parseInt(document.getElementById('tokenDecimals').value, 10);
  const supply = parseFloat(document.getElementById('tokenSupply').value);

  if (!name || !symbol || isNaN(supply) || supply <= 0) {
    alert('Harap isi semua parameter token dengan benar.');
    return;
  }

  // Confirm if on Mainnet
  if (currentNetwork === 'mainnet') {
    const ok = confirm('⚠️ PERINGATAN: Anda terhubung ke TRON MAINNET (Jaringan Asli).\n\nDeploy ini akan membakar TRX asli (~15 - 30 TRX) untuk gas/energy.\n\nApakah Anda yakin ingin melanjutkan di Mainnet?');
    if (!ok) return;
  }

  // Show Progress
  deployBtn.disabled = true;
  statusSection.classList.remove('hidden');
  successCard.classList.add('hidden');
  statusTitle.textContent = '1. Menyiapkan Transaksi...';
  statusMsg.textContent = 'Membungkus parameter TRC20 Token (' + name + ' / ' + symbol + ')...';

  try {
    // 1. Build Smart Contract
    statusTitle.textContent = '2. Menunggu Tanda Tangan TronLink...';
    statusMsg.textContent = 'Silakan buka pop-up ekstensi TronLink dan klik "Sign / Accept" untuk mengonfirmasi...';

    const transaction = await window.tronWeb.transactionBuilder.createSmartContract({
      abi: compiledContract.abi,
      bytecode: compiledContract.bytecode,
      feeLimit: 1_000_000_000, // 1000 TRX Sun fee limit
      callValue: 0,
      userFeePercentage: 100,
      originEnergyLimit: 10_000_000,
      parameters: [name, symbol, decimals, Math.floor(supply)],
      name: 'TRC20Token'
    }, userAddress);

    // 2. Sign Transaction via TronLink
    const signedTx = await window.tronWeb.trx.sign(transaction);

    // 3. Broadcast to TRON Network
    statusTitle.textContent = '3. Menyiarkan ke Jaringan TRON...';
    statusMsg.textContent = 'Mengirim transaksi ke validator node TRON...';

    const broadcast = await window.tronWeb.trx.sendRawTransaction(signedTx);

    if (!broadcast.result && !broadcast.txid) {
      throw new Error(broadcast.message ? window.tronWeb.toUtf8(broadcast.message) : 'Transaksi ditolak oleh node TRON.');
    }

    const txId = transaction.txID;
    const contractAddress = window.tronWeb.address.fromHex(transaction.contract_address);

    statusTitle.textContent = '4. Menunggu Konfirmasi Blok...';
    statusMsg.textContent = `Transaksi ${txId.substring(0, 10)}... sedang dicatat dalam blok TRON...`;

    // Wait 5 seconds for block confirmation
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Show Success Result
    statusSection.classList.add('hidden');
    successCard.classList.remove('hidden');

    deployedAddressEl.value = contractAddress;
    deployedTxIdEl.value = txId;

    const explorerUrl = currentNetwork === 'nile'
      ? `https://nile.tronscan.org/#/contract/${contractAddress}`
      : `https://tronscan.org/#/contract/${contractAddress}`;

    tronscanLink.href = explorerUrl;

    // Setup Watch Asset Button (Add to TronLink)
    watchAssetBtn.onclick = async () => {
      try {
        if (window.tronLink && window.tronLink.request) {
          await window.tronLink.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'trc20',
              options: {
                address: contractAddress,
                symbol: symbol,
                decimals: decimals
              }
            }
          });
        } else {
          alert('Buka TronLink -> Tambahkan Token manual -> Paste address: ' + contractAddress);
        }
      } catch (e) {
        alert('Silakan salin Contract Address dan masukkan manual via Add Asset di TronLink.');
      }
    };

    // Refresh balance after deploy
    setTimeout(handleWalletConnected, 3000);

  } catch (err) {
    console.error('Deployment error:', err);
    statusTitle.textContent = '❌ Deployment Gagal';
    statusMsg.textContent = err.message || 'Terjadi kesalahan saat memproses transaksi.';
    deployBtn.disabled = false;
  }
});

// Copy Buttons
copyAddressBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(deployedAddressEl.value);
  copyAddressBtn.textContent = 'Tersalin! ✓';
  setTimeout(() => copyAddressBtn.textContent = 'Salin', 2000);
});

copyTxBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(deployedTxIdEl.value);
  copyTxBtn.textContent = 'Tersalin! ✓';
  setTimeout(() => copyTxBtn.textContent = 'Salin', 2000);
});

// Listen to TronLink account changes
window.addEventListener('message', function (e) {
  if (e.data.message && (e.data.message.action === 'setAccount' || e.data.message.action === 'setNode')) {
    handleWalletConnected();
  }
});

// Start initialization
window.addEventListener('DOMContentLoaded', initTron);
