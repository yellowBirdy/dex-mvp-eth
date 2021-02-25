//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
import "@openzeppelin/contracts/ERC20.sol";"

contract Bat is ERC20 {
    constructor() ERC20("Basic Attention Token", "BAT") public {}
    
        function faucet(uint amount, address to) public {
        _mint(to, amount);
    }
}
