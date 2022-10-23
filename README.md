# YIELD WARRIORS

This is submission for hackathon [Encode X Harmony](https://www.encode.club/harmony-hackathon)

![](https://res.cloudinary.com/dey55ubjm/image/upload/v1666534165/yw/ss.png)

Check the [Yield Warriors in Harmony Testnet](https://yw.traderbotx.space)


## How It Work

- To mint a Warrior NFT, user need to delegate his $ONE to validator [## MaxMustermann2](https://staking.harmony.one/validators/testnet/one198pwc4uq879kjhczvyl9lgt5nst9c5zhwhfrvz) via Yield Warrior smart contract (Warrior.sol).
- More $ONE delegated, more power for Warrior NFT. User can also set the attack, defense and magic stat for his Warrior.
- Every round, a battle will be initialized. Pooled interest from all users will be transferred to battle smart contract (Battle.sol)
- There are three factions to be selected by Warrior NFT but only one faction will be a winner. The winner decided by War Points of every faction. More war point, more chance to be selected as winner.
- When Warrior NFT join a faction, faction war point will be increase based on warrior's stat and power.
- [Harmony VRF](https://docs.harmony.one/home/developers/tools/harmony-vrf) used to decided the winner also to decide luck stat of Warrior NFT.
- Warrior NFT can also be burned to receive back its delegated $ONE
  

## How To Build

### Smart Contracts

1. Enter folder sc
2. Create .env file add PRIVATE_KEY_TESTNET=yourprivatekey
3. Add PRIVATE_KEY_MAINNET=yourprivatekey
4. Yarn install or npm install
5. Install [Truffle Framework](https://trufflesuite.com/docs/truffle/getting-started/installation)
6. truffle compile 
7. truffle migrate --network onetestnet
8. run ./copyjson.sh
 

### Client

1. Enter folder client
2. Yarn install or npm install
3. Yarn run start to run on localhost in debug mode
4. Yarn run build to build release version