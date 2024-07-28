// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MockERC721 is Initializable, ERC721Upgradeable {
    function initialize() public initializer {
        __ERC721_init("MockNFT", "MNFT");
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
