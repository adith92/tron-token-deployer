# 🚀 TRON TRC-20 Token Creator & 1-Click Deployer

Aplikasi dan toolkit lengkap untuk membuat dan mendeploy smart contract Token TRC-20 di jaringan TRON (Nile Testnet maupun Mainnet).

## 📁 Struktur Folder
```text
tron-token/
├── contracts/
│   └── TRC20Token.sol     # Smart contract standar TRC-20 (Solidity 0.8.20)
├── public/
│   ├── index.html         # Tampilan Web Deployer 1-Klik
│   ├── style.css          # Desain Web3 modern (Dark Mode)
│   └── app.js             # Logika interaksi TronLink & TronWeb
├── compile.js             # Skrip compile Solidity ke Bytecode & ABI
├── compiled.json          # Hasil kompilasi contract
├── server.js              # Server lokal ringan (Node.js)
├── deploy-cli.js          # Skrip alternatif deploy via terminal
├── .env.example           # Contoh variabel lingkungan untuk deploy via CLI
└── package.json           # Dependensi proyek
```

---

## 🌟 Cara Menjalankan Web Deployer 1-Klik (Rekomendasi)

1. **Jalankan Server Lokal**:
   ```bash
   node server.js
   ```
2. **Buka di Browser**:
   Buka [http://localhost:3000](http://localhost:3000) di browser yang sudah memiliki ekstensi **TronLink**.
3. **Pastikan Jaringan Nile Testnet**:
   Di ekstensi TronLink, ubah jaringan ke **Nile Testnet** dan pastikan dompet Anda memiliki TRX testnet (klaim gratis di [nileex.io](https://nileex.io/join/getJoinPage)).
4. **Isi Data & Klik Deploy**:
   - Tentukan Nama Token, Simbol, Desimal, dan Total Suplai.
   - Klik **Deploy Token Sekarang**.
   - Setujui (Sign) pop-up TronLink yang muncul.
5. **Token Anda Langsung Jadi!**
   - Salin Contract Address.
   - Klik tombol **"Tambahkan ke TronLink Wallet"** atau **"Lihat di TronScan"**.

---

## 💻 Alternatif: Deploy Langsung via Terminal (CLI)

Jika Anda lebih memilih mendeploy lewat terminal tanpa membuka browser:
1. Salin file contoh konfigurasi:
   ```bash
   cp .env.example .env
   ```
2. Buka `.env` dan masukkan Private Key dompet Nile Testnet Anda.
3. Jalankan:
   ```bash
   node deploy-cli.js
   ```
