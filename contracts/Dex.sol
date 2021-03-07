//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Dex is Ownable {
    using SafeMath for uint;
    
    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }
    
    struct Order {
        uint id;
        bytes32 ticker;
        uint amount;
        uint filled;
        uint price;
        uint side;
        address trader;
    }
    
    event OrderCreated (
        uint id,
        bytes32 indexed ticker, 
        uint indexed price,
        uint indexed side,
        uint amount
    );
    
    event Trade (
        uint id,
        bytes32 indexed ticker,
        uint indexed price,
        uint amount,
        address seller,
        address buyer,
        uint timestamp
    );
    
    enum Side {
        BUY,
        SELL
    }
    
            //ticker = > Token Struct
    mapping (bytes32 => Token) tokens;
    bytes32[] tokenNames;
                        // ticker => balance        
    mapping (address=>mapping(bytes32=>uint)) public traderBalances;
            //ticker =>    Side =>
    mapping (bytes32 => mapping(uint => Order[])) limitOrders;
    uint nextOrderId = 0;
    uint nextTradeId = 0;

    
    bytes32 DAI = bytes32("DAI");
    
    function createMarketOrder (Side side, bytes32 ticker, uint amount) external tokenExists(ticker) notDai(ticker) {
        if (side == Side.SELL) {
            require(amount <= traderBalances[msg.sender][ticker], "Dex: Not enough balance");
        }
        
        Order[] storage orders;
        if (side == Side.SELL) {
            orders = limitOrders[ticker][uint(Side.BUY)];
        } else if (side == Side.BUY) {
            orders = limitOrders[ticker][uint(Side.SELL)];
        }
            
        uint remaining = amount;
        uint i = 0;
        while (i < orders.length && remaining > 0 ) {
            uint fulfilled = (orders[i].amount - orders[i].filled) > remaining ? remaining 
                                                                                : orders[i].amount - orders[i].filled;
            remaining = remaining.sub(fulfilled);
            orders[i].filled = orders[i].filled + fulfilled;
            
            if (side == Side.SELL) {
                traderBalances[msg.sender][ticker] = traderBalances[msg.sender][ticker].sub(fulfilled);
                traderBalances[msg.sender][DAI] = traderBalances[msg.sender][DAI].add(fulfilled*orders[i].price);
                traderBalances[orders[i].trader][ticker] = traderBalances[orders[i].trader][ticker].add(fulfilled);
                traderBalances[orders[i].trader][DAI] = traderBalances[orders[i].trader][DAI].sub(fulfilled*orders[i].price);
            } else if (side == Side.BUY) {
                require(traderBalances[msg.sender][DAI] >= fulfilled*orders[i].price, "Dex: Not enough DAI to buy");
                
                traderBalances[msg.sender][ticker] = traderBalances[msg.sender][ticker].add(fulfilled);
                traderBalances[msg.sender][DAI] = traderBalances[msg.sender][DAI].sub(fulfilled*orders[i].price);
                traderBalances[orders[i].trader][ticker] = traderBalances[orders[i].trader][ticker].sub(fulfilled);
                traderBalances[orders[i].trader][DAI] = traderBalances[orders[i].trader][DAI].add(fulfilled*orders[i].price);
            }

            emit Trade (
                nextTradeId,
                ticker,
                orders[i].price,
                orders[i].amount,
                (side == Side.SELL) ? msg.sender : orders[i].trader,
                (side == Side.SELL) ? orders[i].trader : msg.sender,
                block.timestamp
            ); 
            nextTradeId = nextTradeId.add(1);
            i++;
        }
        //@dev prunning filled orders


    }
    
    
    function createLimitOrder (bytes32 ticker, Side side, uint amount, uint price) external tokenExists(ticker) notDai(ticker) {
        if (side == Side.SELL) {
            require(traderBalances[msg.sender][ticker] >= amount, "Dex: not enough balance");
        } else if (side == Side.BUY) {
            require(traderBalances[msg.sender][DAI] >= amount * price, "Dex: not enough DAI balance");
        }
        Order[] storage orders = limitOrders[ticker][uint(side)];
        orders.push(Order(
            nextOrderId,
            ticker,
            amount,
            0,
            price,
            uint(side),
            msg.sender   
        ));
        emit OrderCreated(
            nextOrderId,
            ticker, 
            price,
            uint(side),
            amount
        );
        nextOrderId.add(1);
        
        uint i = orders.length - 1 ;
        if (side == Side.BUY) {
            while (i > 0 && orders[i].price > orders[i-1].price) {
                Order memory order = orders[i];
                orders[i] = orders[i-1];
                orders[i-1] = order;
                i--;
            }
        } else if (side == Side.SELL) {
            while (i > 0 && orders[i].price < orders[i-1].price) {
                Order memory order = orders[i];
                orders[i] = orders[i-1];
                orders[i-1] = order;
                i--;
            }
        }
    }
    
    
    /*@dev it's a delegated transfer so requires preapproval ie 
    * executes wiht ERC20.transferFrom 
    * it could be refactored to uniswap V2 style keeping track of balance
    */
    function deposit(bytes32 ticker, uint amount) external tokenExists(ticker) {
        IERC20(tokens[ticker].tokenAddress).transferFrom(
            msg.sender,
            address(this),
            amount
            );
        traderBalances[msg.sender][ticker] =  traderBalances[msg.sender][ticker].add(amount);
    }
    
    function withdraw(bytes32 ticker, uint amount) external tokenExists(ticker) {
        traderBalances[msg.sender][ticker] = traderBalances[msg.sender][ticker].sub(amount, "Dex: Can't withdraw more then one owns");
         IERC20(tokens[ticker].tokenAddress).transfer(
            msg.sender,
            amount
            );
    }
    
    function getOrders(bytes32 ticker, Side side) external view tokenExists(ticker) notDai(ticker) returns(Order[] memory) {
        return limitOrders[ticker][uint(side)];
    }
    
    function getTokens() external view returns(Token[] memory) {
        Token[] memory _tokens = new Token[](tokenNames.length);
        for (uint i = 0; i < tokenNames.length; i++) {
            _tokens[i] = tokens[tokenNames[i]];
        }
        return _tokens;
    }
    
    function addToken(bytes32 ticker, address tokenAddress) external onlyOwner() {
        // require tocken hasn't been registered yet
        require(tokens[ticker].ticker != ticker, "Dex: Can't overwrite existing token.");
        tokens[ticker] = Token(
            ticker,
            tokenAddress
        );
        tokenNames.push(ticker);
    }
    
    modifier tokenExists(bytes32 ticker) {
        require(tokens[ticker].ticker == ticker, "Dex: Token has to be registered");
        _;
    }
    
    modifier notDai(bytes32 ticker)  {
        require(ticker != DAI, "Dex: Can't crate order for DAI");
        _;
    }
    
}
