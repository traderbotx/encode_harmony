// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./IWarrior.sol";
import "./Utils.sol";

contract Battle is IERC721Receiver, Utils {
    address public creator;
    address public warriorAddress;

    struct FactionData {
        uint256 warPoints;
        uint256 totalStake;
        uint256 participant;
    }

    FactionData[] public factionList;

    uint256 public totalWarPoints;
    uint256 public prize;

    uint8 public winner;
    uint256 public winningNumber;

    bool public finished;

    struct WarriorData {
        uint256 nftId;
        uint256 warPoints;
        uint8 faction;
        address owner;
        bool leave;
    }

    WarriorData[] public warriorList;

    mapping(uint256 => uint256) nftId2index;

    uint8 public enemyAttack;
    uint8 public enemyDefense;
    uint8 public enemyMagic;

    constructor(address warriorAddr) {
        creator = msg.sender;
        warriorAddress = warriorAddr;

        factionList.push(FactionData(0, 0, 0));
        factionList.push(FactionData(0, 0, 0));
        factionList.push(FactionData(0, 0, 0));
        totalWarPoints = 0;

        warriorList.push(WarriorData(0, 0, 0, address(0), false));
    }

    function stat() public view returns (uint256, uint256) {
        return (factionList.length, warriorList.length);
    }

    function start(
        uint8 enemyAtk,
        uint8 enemyDef,
        uint8 enemyMgc
    ) public payable {
        require(msg.sender == creator, "access denied");
        prize = msg.value;
        enemyAttack = enemyAtk;
        enemyDefense = enemyDef;
        enemyMagic = enemyMgc;
    }

    function join(uint256 nftId, uint8 faction) public {
        address ownerNFT = IERC721(warriorAddress).ownerOf(nftId);
        require(ownerNFT == msg.sender, "not owner");
        require(faction < factionList.length, "invalid faction");
        require(nftId2index[nftId] == 0, "already join");
        require(!finished, "already finished");

        IERC721(warriorAddress).safeTransferFrom(
            msg.sender,
            address(this),
            nftId
        );

        (
            ,
            //uint256 genetic,
            uint256 power,
            uint8 attack,
            uint8 defense,
            uint8 magic,
            uint8 luck
        ) = IWarrior(warriorAddress).warriorStat(nftId);

        uint256 multiplier1 = 100 + ((luck - 1) * 25);
        uint256 multiplier2 = power / 100e18;
        uint256 wp = 1;

        if (attack > enemyDefense) wp += (attack - enemyDefense);
        if (defense > enemyAttack) wp += (defense - enemyAttack);
        if (magic > enemyMagic) wp += (magic - enemyMagic);

        wp = wp * multiplier1;
        wp = wp * multiplier2;

        totalWarPoints = totalWarPoints + wp;

        // struct WarriorData {
        //     uint256 warPoints;
        //     uint8 faction;
        //     address owner;
        //     bool claimed;
        // }

        nftId2index[nftId] = warriorList.length;
        warriorList.push(WarriorData(nftId, wp, faction, msg.sender, false));

        factionList[faction].warPoints += wp;
        factionList[faction].totalStake += power;
        factionList[faction].participant += 1;
    }

    function leave(uint256 nftId) public {
        require(finished, "not finished");

        uint256 indexNFT = nftId2index[nftId];
        require(indexNFT > 0, "not join");

        WarriorData memory w = warriorList[indexNFT];
        require(w.owner == msg.sender, "not owner");
        require(!w.leave, "already leave");

        warriorList[indexNFT].leave = true;

        if (w.faction == winner) {
            // a winner
            // transfer reward
            uint256 totWP = factionList[winner].warPoints;
            uint256 wp = w.warPoints;
            uint256 prizeForUser = (prize * wp) / totWP;
            (bool success, ) = msg.sender.call{value: prizeForUser}("");
            require(success, "failed to send");
        }

        IERC721(warriorAddress).safeTransferFrom(
            address(this),
            msg.sender,
            nftId
        );
    }

    function finish() public {
        require(msg.sender == creator, "access denied");

        uint8 numFaction = uint8(factionList.length);

        winningNumber = _generateRandom() % totalWarPoints;
        uint256 chance;
        for (uint8 index = 0; index < numFaction; index++) {
            chance = chance + factionList[index].warPoints;
            if (winningNumber < chance) {
                // winner decided!
                winner = index;
                break;
            }
        }

        finished = true;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    receive() external payable {}

    fallback() external payable {}
}
