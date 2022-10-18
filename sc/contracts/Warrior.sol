// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./StakingPrecompiles.sol";
import "./Utils.sol";

contract Warrior is ERC721Enumerable, StakingPrecompiles, Utils {
    struct Stat {
        uint256 genetic;
        uint256 power;
        uint8 attack;
        uint8 defense;
        uint8 magic;
        uint8 luck;
    }

    Stat[] public statList;

    address public creator;
    address public stakeAddress;
    address public kingdomAddress;
    uint256 public totalStake;
    string public baseURL;

    struct PendingWithdraw {
        address receiver;
        uint256 amount;
        uint256 claimTime;
        bool claimed;
    }

    PendingWithdraw[] public pendingList;

    constructor() ERC721("Yield Warrior NFT v3", "WAR") {
        // https://staking.harmony.one/validators/testnet/one198pwc4uq879kjhczvyl9lgt5nst9c5zhwhfrvz
        // MaxMustermann2 validator address
        stakeAddress = 0x29c2eC57803f8b695f02613E5FA1749c165c5057;
        creator = msg.sender;
        statList.push(Stat(0, 0, 0, 0, 0, 0));
    }

    function buildVersion() public pure returns (uint256) {
        return (1);
    }

    function setup(string memory url, address kingdomAddr) public {
        require(msg.sender == creator, "only creator can setup");
        baseURL = url;
        kingdomAddress = kingdomAddr;
    }

    function stat() public view returns (uint256, uint256) {
        return (statList.length, pendingList.length);
    }

    function warriorStat(uint256 nftId)
        public
        view
        returns (
            uint256,
            uint256,
            uint8,
            uint8,
            uint8,
            uint8
        )
    {
        uint256 genetic = statList[nftId].genetic;
        uint256 power = statList[nftId].power;
        uint8 attack = statList[nftId].attack;
        uint8 defense = statList[nftId].defense;
        uint8 magic = statList[nftId].magic;
        uint8 luck = statList[nftId].luck;
        return (genetic, power, attack, defense, magic, luck);
    }

    function summon(
        uint256 power,
        uint8 atkVal,
        uint8 defVal,
        uint8 mgcVal
    ) public payable {
        uint256 num = (power / 100e18) * 100e18;
        require(num >= 100e18, "not enough power");
        require(power == num && msg.value == num, "invalid power");

        uint8 totVal = atkVal + defVal + mgcVal;
        require(
            (totVal == 9) && (atkVal <= 5) && (defVal <= 5) && (mgcVal <= 5),
            "dont cheat"
        );

        _deposit(num);

        totalStake = totalStake + num;
        uint256 genetic = _generateRandom();
        uint256 chance = genetic % 100;

        uint8 luck = 1;

        if (chance < 1) {
            luck = 5;
        } else if (chance < 1 + 7) {
            luck = 4;
        } else if (chance < 1 + 7 + 13) {
            luck = 3;
        } else if (chance < 1 + 7 + 13 + 19) {
            luck = 2;
        }

        // uint256 genetic;
        // uint256 power;
        // uint8 attack;
        // uint8 defense;
        // uint8 magic;
        // uint8 luck;

        uint256 nftId = statList.length;
        statList.push(Stat(genetic, power, atkVal, defVal, mgcVal, luck));

        _mint(msg.sender, nftId);
    }

    function unsummon(uint256 nftId) public {
        address ownerNFT = ownerOf(nftId);
        require(ownerNFT == msg.sender, "not owner");

        uint256 amount = statList[nftId].power;
        bool successWithdraw = _withdraw(amount);
        require(successWithdraw, "withdraw fail");

        uint256 claimTime = epoch() + 1;

        totalStake = totalStake - amount;
        pendingList.push(PendingWithdraw(ownerNFT, amount, claimTime, false));

        _burn(nftId);
    }

    function claimPendingWithdraw(uint256 index) public {
        address receiver = pendingList[index].receiver;
        require(receiver == msg.sender, "not owner");

        bool claimed = pendingList[index].claimed;
        require(!claimed, "already claimed");

        uint256 curTime = epoch();
        uint256 claimTime = pendingList[index].claimTime;
        require(curTime > claimTime, "not time to claim");

        pendingList[index].claimed = true;

        uint256 amount = pendingList[index].amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "failed to send");
    }

    function retrieveYield() public {
        require(msg.sender == kingdomAddress, "only kingdom contract can call");

        uint256 balanceBefore = address(this).balance;
        bool successClaim = _claim();
        require(successClaim, "claim not success");

        uint256 balanceAfter = address(this).balance;
        uint256 yieldVal = balanceAfter - balanceBefore;

        address payable receiver = payable(kingdomAddress);
        (bool success, ) = receiver.call{value: yieldVal}("");
        require(success, "failed to send");
    }

    function tokenURI(uint256 nftId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        string memory tokenId = _uint2str(nftId);
        string memory base = baseURL;

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return tokenId;
        }

        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(tokenId).length > 0) {
            return string(abi.encodePacked(base, tokenId));
        }

        return super.tokenURI(nftId);
    }

    function _deposit(uint256 amount) private returns (bool) {
        // https://github.com/MaxMustermann2/harmony-staking-precompiles/blob/main/contracts/example/StakingContract.sol
        uint256 result = StakingPrecompiles.delegate(stakeAddress, amount);
        bool success = result != 0;
        return (success);
    }

    function _withdraw(uint256 amount) private returns (bool) {
        uint256 result = StakingPrecompiles.undelegate(stakeAddress, amount);
        bool success = result != 0;
        return (success);
    }

    function _claim() private returns (bool) {
        uint256 result = StakingPrecompiles.collectRewards();
        bool success = result != 0;
        return (success);
    }

    // ensure staking precompiles private
    function delegate(address validatorAddress, uint256 amount)
        public
        override
        returns (uint256)
    {
        if (true) revert("closed");
        return (super.delegate(validatorAddress, amount));
    }

    function undelegate(address validatorAddress, uint256 amount)
        public
        override
        returns (uint256 result)
    {
        if (true) revert("closed");
        return (super.undelegate(validatorAddress, amount));
    }

    function collectRewards() public override returns (uint256) {
        if (true) revert("closed");
        return (super.collectRewards());
    }

    // ensure contract can receive yield
    receive() external payable {}

    fallback() external payable {}
}
