// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IWarrior {
    function retrieveYield() external;

    function warriorStat(uint256 nftId)
        external
        view
        returns (
            uint256 genetic,
            uint256 power,
            uint8 attack,
            uint8 defense,
            uint8 magic,
            uint8 luck
        );
}
