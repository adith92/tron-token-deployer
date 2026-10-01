require('dotenv').config();
const { TronWeb } = require('tronweb');
const fs = require('fs');
const path = require('path');

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const network = (process.env.NETWORK || 'nile').toLowerCase();

  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY belum disetel di file .env');
    console.error('Contoh pengisian di .env:');
    console.error('PRIVATE_KEY=your_private_key_here');
    console.error('NETWORK=nile');
    process.exit(1);
  }

  const fullHost = network === 'mainnet' 
    ? 'https://api.trongrid.io'
    : 'https://nile.trongrid.io';

  console.log(`🌐 Jaringan yang dipilih: TRON ${network.toUpperCase()}`);
  console.log(`🔌 Menghubungkan ke ${fullHost}...`);

  const tronWeb = new TronWeb({
    fullHost: fullHost,
    privateKey: privateKey,
  });

  const address = tronWeb.address.fromPrivateKey(privateKey);
  console.log(`👤 Deployer Address: ${address}`);

  const balanceSun = await tronWeb.trx.getBalance(address);
  const balanceTrx = balanceSun / 1_000_000;
  console.log(`💰 Saldo TRX: ${balanceTrx} TRX`);

  if (balanceTrx < 15) {
    console.warn('⚠️ Peringatan: Saldo TRX mungkin tidak cukup untuk biaya deploy (butuh ~15-30 TRX).');
    if (network === 'nile') {
      console.log('💡 Klaim faucet gratis di: https://nileex.io/join/getJoinPage');
    }
  }

  const compiledPath = path.resolve(__dirname, 'compiled.json');
  if (!fs.existsSync(compiledPath)) {
    console.error('❌ compiled.json tidak ditemukan! Jalankan "node compile.js" terlebih dahulu.');
    process.exit(1);
  }

  const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));

  const tokenName = process.env.TOKEN_NAME || 'Garuda Token';
  const tokenSymbol = process.env.TOKEN_SYMBOL || 'GRD';
  const tokenDecimals = parseInt(process.env.TOKEN_DECIMALS || '6', 10);
  const tokenSupply = parseInt(process.env.TOKEN_SUPPLY || '1000000', 10);

  console.log('\n📝 Parameter Token:');
  console.log(`   - Nama       : ${tokenName}`);
  console.log(`   - Simbol     : ${tokenSymbol}`);
  console.log(`   - Desimal    : ${tokenDecimals}`);
  console.log(`   - Total Suplai: ${tokenSupply.toLocaleString()} ${tokenSymbol}`);

  console.log('\n🚀 Sedang mendeploy smart contract ke blockchain TRON...');

  try {
    const transaction = await tronWeb.transactionBuilder.createSmartContract({
      abi: compiled.abi,
      bytecode: compiled.bytecode,
      feeLimit: 1_000_000_000,
      callValue: 0,
      userFeePercentage: 100,
      originEnergyLimit: 10_000_000,
      parameters: [tokenName, tokenSymbol, tokenDecimals, tokenSupply],
      name: 'TRC20Token'
    }, address);

    const signedTx = await tronWeb.trx.sign(transaction);
    const broadcast = await tronWeb.trx.sendRawTransaction(signedTx);

    if (!broadcast.result && !broadcast.txid) {
      throw new Error(broadcast.message ? tronWeb.toUtf8(broadcast.message) : 'Transaksi ditolak');
    }

    const txId = transaction.txID;
    const contractAddress = tronWeb.address.fromHex(transaction.contract_address);

    console.log('\n🎉 ====================================================');
    console.log('✅ TOKEN BERHASIL DI-DEPLOY KE TRON NETWORK!');
    console.log('====================================================');
    console.log(`📍 Contract Address : ${contractAddress}`);
    console.log(`🆔 Transaction ID   : ${txId}`);
    
    const explorerUrl = network === 'nile'
      ? `https://nile.tronscan.org/#/contract/${contractAddress}`
      : `https://tronscan.org/#/contract/${contractAddress}`;
    console.log(`🔍 Lihat di Explorer: ${explorerUrl}`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Gagal deploy:', err.message || err);
  }
}

main();
