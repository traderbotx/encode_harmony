const ethers = require("ethers").ethers;

const wallet = ethers.Wallet.createRandom();
const pk = wallet.privateKey;
const mnemonic = wallet.mnemonic;
const address = wallet.address;

console.log({ pk, mnemonic, address });