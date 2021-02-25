//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Uni is ERC20 {
    constructor() ERC20("Uniswap Token", "UNI") public {}
    
        function faucet(uint amount, address to) public {
        _mint(to, amount);
    }
}
