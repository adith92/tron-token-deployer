const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractPath = path.resolve(__dirname, 'contracts', 'TRC20Token.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'TRC20Token.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

console.log('Compiling TRC20Token.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasError = false;
  output.errors.forEach((err) => {
    console.error(err.formattedMessage);
    if (err.severity === 'error') hasError = true;
  });
  if (hasError) process.exit(1);
}

const contract = output.contracts['TRC20Token.sol']['TRC20Token'];
const compiledData = {
  contractName: 'TRC20Token',
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object,
};

fs.writeFileSync(
  path.resolve(__dirname, 'compiled.json'),
  JSON.stringify(compiledData, null, 2)
);

const publicDir = path.resolve(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(
  path.resolve(publicDir, 'compiled.json'),
  JSON.stringify(compiledData, null, 2)
);

console.log('✅ Compilation successful! Saved to compiled.json and public/compiled.json');
console.log('Bytecode length:', compiledData.bytecode.length);

