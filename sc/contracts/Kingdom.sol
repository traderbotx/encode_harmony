// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./IWarrior.sol";
import "./Battle.sol";
import "./Utils.sol";

contract Kingdom is Utils {
    struct BattleData {
        address battle;
        uint256 createdTime;
    }

    BattleData[] public battleList;

    address public warriorAddress;
    uint256 public lastReward;

    struct EnemyData {
        uint8 attack;
        uint8 defense;
        uint8 magic;
    }

    EnemyData[] public enemyList;

    constructor() {
        enemyList.push(EnemyData(0, 0, 0));
        enemyList.push(EnemyData(1, 1, 1));
        enemyList.push(EnemyData(2, 1, 0));
        enemyList.push(EnemyData(0, 0, 3));
        enemyList.push(EnemyData(0, 3, 0));
        enemyList.push(EnemyData(2, 2, 0));
        enemyList.push(EnemyData(0, 2, 2));
        enemyList.push(EnemyData(3, 3, 3));
        enemyList.push(EnemyData(4, 4, 5));
    }

    function setup(address warriorAddr) public {
        require(warriorAddress == address(0), "setup once");
        warriorAddress = warriorAddr;
    }

    function stat() public view returns (uint256, uint256) {
        return (battleList.length, enemyList.length);
    }

    function battleData(uint256 index) public view returns (address, uint256) {
        return (battleList[index].battle, battleList[index].createdTime);
    }

    function startNewBattle(bool retrieveYield)
        public
        payable
        returns (uint256)
    {
        if (retrieveYield) IWarrior(warriorAddress).retrieveYield();
        lastReward = address(this).balance;
        require(lastReward > 0, "no reward");

        if (battleList.length > 0) {
            uint256 lastIndex = battleList.length - 1;
            address payable battle = payable(battleList[lastIndex].battle);
            Battle(battle).finish();
        }

        uint256 randIndex = _generateRandom() % enemyList.length;
        uint8 eatk = enemyList[randIndex].attack;
        uint8 edef = enemyList[randIndex].defense;
        uint8 emgc = enemyList[randIndex].magic;

        Battle newBattle = new Battle(warriorAddress);
        battleList.push(BattleData(address(newBattle), block.timestamp));
        newBattle.start{value: lastReward}(eatk, edef, emgc);

        return (lastReward);
    }

    receive() external payable {}

    fallback() external payable {}
}
