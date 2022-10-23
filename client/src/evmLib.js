const axios = require('axios');
const ethers = require("ethers").ethers;
const BigNumber = ethers.BigNumber;
const moment = require('moment');

const maxUINT = ethers.constants.MaxUint256;
const ZERO18 = '000000000000000000';
const ZERO6 = '000000';

const CHAIN_ID = 1666700000;
const PROVIDER_URL = 'https://api.s0.b.hmny.io';
const EURL = 'https://explorer.pops.one';

const WARRIOR_JSON = require('./json/Warrior.json');
const WARRIOR_ABI = WARRIOR_JSON.abi;
const WARRIOR_ADDRESS = WARRIOR_JSON.networks[CHAIN_ID].address;

const KINGDOM_JSON = require('./json/Kingdom.json');
const KINGDOM_ABI = KINGDOM_JSON.abi;
const KINGDOM_ADDRESS = KINGDOM_JSON.networks[CHAIN_ID].address;

const BATTLE_JSON = require('./json/Battle.json');
const BATTLE_ABI = BATTLE_JSON.abi;

console.log({ WARRIOR_ADDRESS, KINGDOM_ADDRESS });

let PROVIDER;
let WARRIOR;
let KINGDOM;
let SIGNER;

const ENEMY_DATA = {};
ENEMY_DATA['0/0/0'] = { name: 'BANDIT' };
ENEMY_DATA['1/1/1'] = { name: 'GOBLIN' };
ENEMY_DATA['2/1/0'] = { name: 'ORC' };
ENEMY_DATA['0/0/3'] = { name: 'SHAMAN' };
ENEMY_DATA['0/3/0'] = { name: 'GOLEM' };
ENEMY_DATA['2/2/0'] = { name: 'KNIGHT' };
ENEMY_DATA['0/2/2'] = { name: 'WARLOCK' };
ENEMY_DATA['3/3/3'] = { name: 'DEMON' };
ENEMY_DATA['4/4/5'] = { name: 'DRAGON' };

async function detectMetamask() {
  if (!window.ethereum) throw new Error('Please install Metamask and reload!');

  window.ethereum.on('chainChanged', (_chainId) => window.location.reload());

  let chainId = await window.ethereum.request({ method: 'eth_chainId' });
  chainId = Number(chainId);
  if (chainId !== CHAIN_ID) throw new Error('Please connect metamask to right network!');

  return window.ethereum.isConnected();
}

async function loadMetamask() {
  window.ethereum.enable();
  PROVIDER = new ethers.providers.Web3Provider(window.ethereum);
  SIGNER = PROVIDER.getSigner();
  WARRIOR = new ethers.Contract(WARRIOR_ADDRESS, WARRIOR_ABI, SIGNER);
  KINGDOM = new ethers.Contract(KINGDOM_ADDRESS, KINGDOM_ABI, SIGNER);
  console.log('** smart contract initialized **');
}

async function loadWalletRandom() {
  const tmp = ethers.Wallet.createRandom();
  return await loadWallet(tmp.privateKey);
}

async function loadWallet(pk) {
  let provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
  const wallet = new ethers.Wallet(pk, provider);
  return wallet;
}

function wei2eth(wei) {
  return ethers.utils.formatUnits(wei, "ether");
}

function eth2wei(eth) {
  return ethers.utils.parseEther(eth);
}

async function getData() {
  const address = await SIGNER.getAddress();
  const stat = await KINGDOM.stat();
  const numBattle = stat[0].toNumber();
  const numEnemy = stat[1].toNumber();

  const battles = [];
  for (let i = 0; i < numBattle; i++) {
    const battleData = await KINGDOM.battleList(i);
    const address = battleData[0];
    const sc = new ethers.Contract(address, BATTLE_ABI, SIGNER);

    const statBattle = await sc.stat();
    const numWarriorList = statBattle[1].toNumber();
    const warriors = [];
    for (let j = 0; j < numWarriorList; j++) {
      if (j === 0) continue;
      const warrior = await sc.warriorList(j);
      warriors.push(warrior);
    }

    const numFaction = statBattle[0].toNumber();
    const factions = [];
    let totalWp = 0; // BigNumber.from('0');
    for (let j = 0; j < numFaction; j++) {
      const f = await sc.factionList(j);
      factions.push({
        id: j,
        wp: f.warPoints.toNumber(),
        numNFT: f.participant.toNumber()
      });
      totalWp += (f.warPoints.toNumber());
    }

    for (let j = 0; j < numFaction; j++) {
      const f = factions[j];
      let pctg = 0;
      if (totalWp > 0) pctg = Math.floor(f.wp * 10000 / totalWp) / 100;
      factions[j].pctg = pctg;
    }

    const finished = await sc.finished();
    const winner = await sc.winner();
    let prize = await sc.prize();
    prize = ethers.utils.formatEther(prize);
    prize = Math.floor(Number(prize) * 100) / 100;

    const enemyAttack = await sc.enemyAttack();
    const enemyDefense = await sc.enemyDefense();
    const enemyMagic = await sc.enemyMagic();
    const enemyStat = '' + enemyAttack + '/' + enemyDefense + '/' + enemyMagic;
    const enemyName = ENEMY_DATA[enemyStat].name;

    battles.unshift({
      id: i,
      address,
      ts: battleData[1].toNumber(),
      sc,
      warriors,
      factions,
      finished,
      winner,
      prize,
      enemyStat,
      enemyName
    });
  }

  const ret = {
    numBattle,
    numEnemy,
    battles
  }

  console.log(ret);
  return ret;
}

async function getUserData(battles) {
  // const provider = PROVIDER;
  const signer = SIGNER;
  const address = await signer.getAddress();
  const num = (await WARRIOR.balanceOf(address)).toNumber();
  const ownedNFTIds = [];
  const ownedNFTDatas = [];
  for (let i = 0; i < num; i++) {
    const nftId = await WARRIOR.tokenOfOwnerByIndex(address, i);
    ownedNFTIds.push(nftId.toNumber());
    ownedNFTDatas.push({ id: nftId.toNumber(), condition: 'idle' });
  }
  const balance = await PROVIDER.getBalance(address);

  for (let i = 0; i < battles.length; i++) {
    const warriors = battles[i].warriors;
    const battleId = battles[i].id;
    for (let j = 0; j < warriors.length; j++) {
      const w = warriors[j];
      if (w.owner.toLowerCase() === address.toLowerCase() && !w.leave) {
        ownedNFTIds.push(w.nftId.toNumber());
        ownedNFTDatas.push({ id: w.nftId.toNumber(), condition: 'battle', factionId: w.faction, battleId });
      }
    }
  }

  const warriorStat = await WARRIOR.stat();
  const numPendingList = warriorStat[1].toNumber();
  const pendingList = [];
  for (let i = 0; i < numPendingList; i++) {
    const pl = await WARRIOR.pendingList(i);
    const receiver = pl.receiver;
    let amount = pl.amount;
    let claimTime = pl.claimTime.toNumber();
    const claimed = pl.claimed;
    if (!claimed && receiver.toLowerCase() === address.toLowerCase()) {
      const amountStr = ethers.utils.formatEther(amount);
      pendingList.push({ id: i, claimTime, amount: amountStr });
    }
  }

  ownedNFTDatas.sort((a, b) => a.id - b.id);

  const ret = {
    ownedNFTDatas,
    balance,
    pendingList
  }
  console.log(ret);
  return ret;
}

async function getNFTData(nftId, battles) {
  const curBattle = battles[0];
  const address = await WARRIOR.getApproved(nftId);
  const approved = address.toLowerCase() === curBattle.address.toLowerCase();
  const stat = await WARRIOR.statList(nftId);
  console.log('** stat **');
  // console.log(stat);
  // uint256 genetic;
  // uint256 power;
  // uint8 attack;
  // uint8 defense;
  // uint8 magic;
  // uint8 luck;
  const powVal = stat[1].div('1' + ZERO18);
  const ret = {
    nftNeedApprove: !approved,
    nftId: nftId,
    powVal: powVal.toString(),
    atkVal: stat[2],
    defVal: stat[3],
    magVal: stat[4],
    lucVal: stat[5]
  }

  console.log(ret);
  console.log('**********');
  return ret;
}

async function mintNFT(power, atkVal, defVal, magVal) {
  const wei = ethers.utils.parseEther(power);
  let opt = {
    value: wei
  };
  const tx = await WARRIOR.summon(wei, atkVal, defVal, magVal, opt);
  await tx.wait();
  return tx.hash;
}

async function burnNFT(nftId) {
  const tx = await WARRIOR.unsummon(nftId);
  await tx.wait();
  return tx.hash;
}

async function nextBattle() {
  const wei = ethers.utils.parseEther('1');
  let opt = {
    value: wei
  };

  let useYield = false;

  try {
    await KINGDOM.callStatic.startNewBattle(true, opt);
    console.log('startNewBattle static check passed');
    useYield = true;
  } catch (err) {
    console.log('startNewBattle static check fail');
    console.error(err);
  }

  const tx = await KINGDOM.startNewBattle(useYield, opt);
  await tx.wait();
  return tx.hash;
}

async function approveNFT(nftId, address) {
  const tx = await WARRIOR.approve(address, nftId);
  await tx.wait();
  return tx.hash;
}

async function joinBattle(nftId, factionId, address) {
  const battle = new ethers.Contract(address, BATTLE_ABI, SIGNER);
  const tx = await battle.join(nftId, factionId);
  await tx.wait();
  return tx.hash;
}

async function leaveBattle(nftId, address) {
  const battle = new ethers.Contract(address, BATTLE_ABI, SIGNER);
  const tx = await battle.leave(nftId);
  await tx.wait();
  return tx.hash;
}

export default {
  // module.exports = {
  EURL,
  ZERO18,
  ZERO6,
  CHAIN_ID,
  detectMetamask,
  loadMetamask,
  loadWalletRandom,
  loadWallet,
  wei2eth,
  eth2wei,
  getData,
  getUserData,
  getNFTData,
  mintNFT,
  burnNFT,
  nextBattle,
  approveNFT,
  joinBattle,
  leaveBattle
};


