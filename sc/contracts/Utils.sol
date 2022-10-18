// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Utils {
    uint256 private randNonce;

    // random number generator
    function _random() internal view returns (uint256) {
        // use harmony vrf
        // https://docs.harmony.one/home/developers/tools/harmony-vrf
        bytes32 result;
        uint[1] memory bn;
        bn[0] = block.number;
        assembly {
            let memPtr := mload(0x40)
            if iszero(staticcall(not(0), 0xff, bn, 0x20, memPtr, 0x20)) {
                invalid()
            }
            result := mload(memPtr)
        }
        return uint256(result);
    }

    function _generateRandom() internal returns (uint256) {
        randNonce++;
        uint256 seed = _random();
        uint256 ret = uint256(
            keccak256(
                abi.encodePacked(
                    seed,
                    block.timestamp,
                    randNonce,
                    msg.sender,
                    block.difficulty,
                    tx.origin
                )
            )
        );
        return (ret);
    }

    function _uint2str(uint256 _i) internal pure returns (string memory str) {
        // https://github.com/provable-things/ethereum-api/issues/102
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + (j % 10)));
            j /= 10;
        }
        str = string(bstr);
    }
}
