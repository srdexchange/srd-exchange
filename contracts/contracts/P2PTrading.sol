// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract P2PTrading {
    address public admin;
    IERC20 public usdtToken;
    
    struct Order {
        uint256 orderId;
        address user;
        uint256 usdtAmount; // Amount in USDT (6 decimals)
        uint256 inrAmount;  // Amount in INR (for record keeping)
        bool isBuyOrder;
        bool isCompleted;
        bool isVerified;
        bool adminApproved;
        uint256 timestamp;
        string orderType; // "BUY_UPI", "BUY_CDM", "SELL_UPI", "SELL_CDM"
    }
    
    mapping(uint256 => Order) public orders;
    mapping(address => bool) public authorizedAdmins;
    uint256 public orderCounter;
    
    event OrderCreated(uint256 indexed orderId, address indexed user, uint256 usdtAmount, uint256 inrAmount, bool isBuyOrder, string orderType);
    event OrderVerified(uint256 indexed orderId, address indexed admin);
    event OrderCompleted(uint256 indexed orderId, address indexed user, uint256 usdtAmount);
    event USDTTransferred(uint256 indexed orderId, address indexed from, address indexed to, uint256 amount);
    
    modifier onlyAdmin() {
        require(authorizedAdmins[msg.sender] || msg.sender == admin, "Not authorized admin");
        _;
    }
    
    modifier onlyUser(uint256 _orderId) {
        require(orders[_orderId].user == msg.sender, "Not the order owner");
        _;
    }
    
    constructor(address _usdtToken) {
        admin = msg.sender;
        usdtToken = IERC20(_usdtToken);
        authorizedAdmins[msg.sender] = true;
    }
    
    function createBuyOrder(
        uint256 _usdtAmount,
        uint256 _inrAmount,
        string memory _orderType
    ) external {
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");
        
        orderCounter++;
        orders[orderCounter] = Order({
            orderId: orderCounter,
            user: msg.sender,
            usdtAmount: _usdtAmount,
            inrAmount: _inrAmount,
            isBuyOrder: true,
            isCompleted: false,
            isVerified: false,
            adminApproved: false,
            timestamp: block.timestamp,
            orderType: _orderType
        });
        
        emit OrderCreated(orderCounter, msg.sender, _usdtAmount, _inrAmount, true, _orderType);
    }
    
    function createSellOrder(
        uint256 _usdtAmount,
        uint256 _inrAmount,
        string memory _orderType
    ) external {
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");
        require(usdtToken.balanceOf(msg.sender) >= _usdtAmount, "Insufficient USDT balance");
        
        // Transfer USDT from user to contract for escrow
        require(usdtToken.transferFrom(msg.sender, address(this), _usdtAmount), "USDT transfer failed");
        
        orderCounter++;
        orders[orderCounter] = Order({
            orderId: orderCounter,
            user: msg.sender,
            usdtAmount: _usdtAmount,
            inrAmount: _inrAmount,
            isBuyOrder: false,
            isCompleted: false,
            isVerified: false,
            adminApproved: false,
            timestamp: block.timestamp,
            orderType: _orderType
        });
        
        emit OrderCreated(orderCounter, msg.sender, _usdtAmount, _inrAmount, false, _orderType);
    }
    
    function approveOrder(uint256 _orderId) external onlyAdmin {
        require(_orderId <= orderCounter, "Order does not exist");
        orders[_orderId].adminApproved = true;
    }
    
    function verifyPayment(uint256 _orderId) external onlyAdmin {
        require(_orderId <= orderCounter, "Order does not exist");
        require(orders[_orderId].adminApproved, "Order not approved by admin");
        require(!orders[_orderId].isVerified, "Order already verified");
        
        orders[_orderId].isVerified = true;
        emit OrderVerified(_orderId, msg.sender);
    }
    
    function completeBuyOrder(uint256 _orderId) external onlyAdmin {
        Order storage order = orders[_orderId];
        require(order.isBuyOrder, "Not a buy order");
        require(order.isVerified, "Order not verified");
        require(!order.isCompleted, "Order already completed");
        require(usdtToken.balanceOf(msg.sender) >= order.usdtAmount, "Admin insufficient USDT balance");
        
        // Transfer USDT from admin to user (admin pays gas fees)
        require(usdtToken.transferFrom(msg.sender, order.user, order.usdtAmount), "USDT transfer failed");
        
        order.isCompleted = true;
        
        emit USDTTransferred(_orderId, msg.sender, order.user, order.usdtAmount);
        emit OrderCompleted(_orderId, order.user, order.usdtAmount);
    }
    
    function completeSellOrder(uint256 _orderId) external onlyAdmin {
        Order storage order = orders[_orderId];
        require(!order.isBuyOrder, "Not a sell order");
        require(order.isVerified, "Order not verified");
        require(!order.isCompleted, "Order already completed");
        
        // Transfer USDT from contract to admin (admin pays gas fees)
        require(usdtToken.transfer(msg.sender, order.usdtAmount), "USDT transfer failed");
        
        order.isCompleted = true;
        
        emit USDTTransferred(_orderId, address(this), msg.sender, order.usdtAmount);
        emit OrderCompleted(_orderId, order.user, order.usdtAmount);
    }
    
    function confirmOrderReceived(uint256 _orderId) external onlyUser(_orderId) {
        require(orders[_orderId].isCompleted, "Order not completed");
        // This is just for user confirmation, order is already completed
    }
    
    function addAdmin(address _admin) external onlyAdmin {
        authorizedAdmins[_admin] = true;
    }
    
    function removeAdmin(address _admin) external onlyAdmin {
        require(_admin != admin, "Cannot remove main admin");
        authorizedAdmins[_admin] = false;
    }
    
    function getOrder(uint256 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }
    
    function withdrawEmergency(address _token, uint256 _amount) external onlyAdmin {
        IERC20(_token).transfer(admin, _amount);
    }
}