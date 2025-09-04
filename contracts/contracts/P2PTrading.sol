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
    address public gasStation; // New: Gas Station wallet
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
    mapping(address => bool) public authorizedGasStations; // New: Multiple gas stations
    uint256 orderCounter;
    
    event OrderCreated(uint256 indexed orderId, address indexed user, uint256 usdtAmount, uint256 inrAmount, bool isBuyOrder, string orderType);
    event OrderVerified(uint256 indexed orderId, address indexed admin);
    event OrderCompleted(uint256 indexed orderId, address indexed user, uint256 usdtAmount);
    event USDTTransferred(uint256 indexed orderId, address indexed from, address indexed to, uint256 amount);
    event GasStationUpdated(address indexed oldGasStation, address indexed newGasStation);
    
    modifier onlyAdmin() {
        require(authorizedAdmins[msg.sender] || msg.sender == admin, "Not authorized admin");
        _;
    }
    
    modifier onlyGasStation() {
        require(authorizedGasStations[msg.sender] || msg.sender == gasStation, "Not authorized gas station");
        _;
    }
    
    modifier onlyAdminOrGasStation() {
        require(
            authorizedAdmins[msg.sender] || 
            msg.sender == admin || 
            authorizedGasStations[msg.sender] || 
            msg.sender == gasStation, 
            "Not authorized"
        );
        _;
    }
    
    modifier onlyUser(uint256 _orderId) {
        require(orders[_orderId].user == msg.sender, "Not the order owner");
        _;
    }
    
    constructor(address _usdtToken, address _gasStation) {
        admin = msg.sender;
        gasStation = _gasStation;
        usdtToken = IERC20(_usdtToken);
        authorizedAdmins[msg.sender] = true;
        authorizedGasStations[_gasStation] = true;
    }
    
    // New: Gas Station executed buy order creation
    function createBuyOrderViaGasStation(
        address _user,
        uint256 _usdtAmount,
        uint256 _inrAmount,
        string memory _orderType
    ) external onlyGasStation {
        require(_user != address(0), "Invalid user address");
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");
        
        // No USDT transfer for buy orders - user wants to receive USDT
        orderCounter++;
        orders[orderCounter] = Order({
            orderId: orderCounter,
            user: _user,
            usdtAmount: _usdtAmount,
            inrAmount: _inrAmount,
            isBuyOrder: true,
            isCompleted: false,
            isVerified: false,
            adminApproved: false,
            timestamp: block.timestamp,
            orderType: _orderType
        });
        
        emit OrderCreated(orderCounter, _user, _usdtAmount, _inrAmount, true, _orderType);
    }
    
    // New: Gas Station executed sell order creation
    function createSellOrderViaGasStation(
        address _user,
        uint256 _usdtAmount,
        uint256 _inrAmount,
        string memory _orderType
    ) external onlyGasStation {
        require(_user != address(0), "Invalid user address");
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");
        require(usdtToken.balanceOf(_user) >= _usdtAmount, "User insufficient USDT balance");
        require(usdtToken.allowance(_user, address(this)) >= _usdtAmount, "Insufficient allowance");
        
        // Transfer USDT from user to contract for escrow (Gas Station pays gas)
        require(usdtToken.transferFrom(_user, address(this), _usdtAmount), "USDT transfer failed");
        
        orderCounter++;
        orders[orderCounter] = Order({
            orderId: orderCounter,
            user: _user,
            usdtAmount: _usdtAmount,
            inrAmount: _inrAmount,
            isBuyOrder: false,
            isCompleted: false,
            isVerified: false,
            adminApproved: false,
            timestamp: block.timestamp,
            orderType: _orderType
        });
        
        emit OrderCreated(orderCounter, _user, _usdtAmount, _inrAmount, false, _orderType);
    }
    
    // New: Gas Station executed admin USDT transfer for buy orders
    function adminTransferUSDTViaGasStation(
        address _admin,
        address _user,
        uint256 _usdtAmount
    ) external onlyGasStation {
        require(_admin != address(0), "Invalid admin address");
        require(_user != address(0), "Invalid user address");
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(authorizedAdmins[_admin] || _admin == admin, "Not authorized admin");
        require(usdtToken.balanceOf(_admin) >= _usdtAmount, "Admin insufficient USDT balance");
        require(usdtToken.allowance(_admin, address(this)) >= _usdtAmount, "Admin insufficient allowance");
        
        // Transfer USDT from admin to user (Gas Station pays gas)
        require(usdtToken.transferFrom(_admin, _user, _usdtAmount), "USDT transfer failed");
        
        emit USDTTransferred(0, _admin, _user, _usdtAmount); // OrderId 0 for direct transfers
    }
    
    // New: Gas Station executed direct sell transfer
    function directSellTransferViaGasStation(
        address _user,
        uint256 _usdtAmount,
        uint256 _inrAmount,
        string memory _orderType,
        address _adminWallet
    ) external onlyGasStation {
        require(_user != address(0), "Invalid user address");
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");
        require(_adminWallet != address(0), "Invalid admin wallet");
        require(authorizedAdmins[_adminWallet] || _adminWallet == admin, "Not authorized admin");
        require(usdtToken.balanceOf(_user) >= _usdtAmount, "Insufficient USDT balance");
        require(usdtToken.allowance(_user, address(this)) >= _usdtAmount, "Insufficient allowance");
        
        // Direct transfer from user to admin (Gas Station pays gas)
        require(usdtToken.transferFrom(_user, _adminWallet, _usdtAmount), "USDT transfer failed");
        
        orderCounter++;
        orders[orderCounter] = Order({
            orderId: orderCounter,
            user: _user,
            usdtAmount: _usdtAmount,
            inrAmount: _inrAmount,
            isBuyOrder: false,
            isCompleted: false, // Admin still needs to pay user
            isVerified: false,
            adminApproved: true, // Auto-approve since USDT is already transferred
            timestamp: block.timestamp,
            orderType: _orderType
        });
        
        emit OrderCreated(orderCounter, _user, _usdtAmount, _inrAmount, false, _orderType);
        emit USDTTransferred(orderCounter, _user, _adminWallet, _usdtAmount);
    }
    
    // Existing functions remain the same...
    function createBuyOrder(
        uint256 _usdtAmount,
        uint256 _inrAmount,
        string memory _orderType
    ) external {
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");
        require(usdtToken.balanceOf(msg.sender) >= _usdtAmount, "Insufficient USDT balance");
        require(usdtToken.allowance(msg.sender, address(this)) >= _usdtAmount, "Insufficient allowance");
        
        // Transfer USDT from user to contract for escrow
        require(usdtToken.transferFrom(msg.sender, address(this), _usdtAmount), "USDT transfer failed");
        
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
    
    // Gas Station management functions
    function setGasStation(address _newGasStation) external onlyAdmin {
        require(_newGasStation != address(0), "Invalid gas station address");
        address oldGasStation = gasStation;
        gasStation = _newGasStation;
        authorizedGasStations[_newGasStation] = true;
        emit GasStationUpdated(oldGasStation, _newGasStation);
    }
    
    function addGasStation(address _gasStation) external onlyAdmin {
        require(_gasStation != address(0), "Invalid gas station address");
        authorizedGasStations[_gasStation] = true;
    }
    
    function removeGasStation(address _gasStation) external onlyAdmin {
        require(_gasStation != gasStation, "Cannot remove main gas station");
        authorizedGasStations[_gasStation] = false;
    }
    
    // ... rest of existing functions remain the same
    function createSellOrder(
        uint256 _usdtAmount,
        uint256 _inrAmount,
        string memory _orderType
    ) external {
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");
        require(usdtToken.balanceOf(msg.sender) >= _usdtAmount, "Insufficient USDT balance");
        require(usdtToken.allowance(msg.sender, address(this)) >= _usdtAmount, "Insufficient allowance");
        
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
        require(usdtToken.allowance(msg.sender, address(this)) >= order.usdtAmount, "Admin insufficient allowance");
        
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
    
    function confirmOrderReceived(uint256 _orderId) external view onlyUser(_orderId) {
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
        require(IERC20(_token).transfer(admin, _amount), "Token transfer failed");
    }

    function getOrderCounter() external view returns (uint256) {
        return orderCounter;
    }

    function directSellTransfer(
        uint256 _usdtAmount,
        uint256 _inrAmount,
        string memory _orderType,
        address _adminWallet
    ) external {
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");
        require(_adminWallet != address(0), "Invalid admin wallet");
        require(authorizedAdmins[_adminWallet] || _adminWallet == admin, "Not authorized admin");
        require(usdtToken.balanceOf(msg.sender) >= _usdtAmount, "Insufficient USDT balance");
        require(usdtToken.allowance(msg.sender, address(this)) >= _usdtAmount, "Insufficient allowance");
        
        // Direct transfer from user to admin
        require(usdtToken.transferFrom(msg.sender, _adminWallet, _usdtAmount), "USDT transfer failed");
        
        orderCounter++;
        orders[orderCounter] = Order({
            orderId: orderCounter,
            user: msg.sender,
            usdtAmount: _usdtAmount,
            inrAmount: _inrAmount,
            isBuyOrder: false,
            isCompleted: false, // Admin still needs to pay user
            isVerified: false,
            adminApproved: true, // Auto-approve since USDT is already transferred
            timestamp: block.timestamp,
            orderType: _orderType
        });
        
        emit OrderCreated(orderCounter, msg.sender, _usdtAmount, _inrAmount, false, _orderType);
        emit USDTTransferred(orderCounter, msg.sender, _adminWallet, _usdtAmount);
    }

    function adminExecuteSellTransfer(
        address _userAddress,
        uint256 _usdtAmount,
        uint256 _inrAmount,
        string memory _orderType
    ) external onlyAdmin {
        require(_userAddress != address(0), "Invalid user address");
        require(_usdtAmount > 0, "USDT amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");
        require(usdtToken.balanceOf(_userAddress) >= _usdtAmount, "User insufficient USDT balance");
        require(usdtToken.allowance(_userAddress, address(this)) >= _usdtAmount, "Insufficient allowance");
        
        // Admin pays gas, user's USDT gets transferred to admin
        require(usdtToken.transferFrom(_userAddress, admin, _usdtAmount), "USDT transfer failed");
        
        orderCounter++;
        orders[orderCounter] = Order({
            orderId: orderCounter,
            user: _userAddress,
            usdtAmount: _usdtAmount,
            inrAmount: _inrAmount,
            isBuyOrder: false,
            isCompleted: true, // Mark as completed immediately since transfer is done
            isVerified: true,  // Mark as verified immediately
            adminApproved: true, // Mark as approved immediately
            timestamp: block.timestamp,
            orderType: _orderType
        });
        
        emit OrderCreated(orderCounter, _userAddress, _usdtAmount, _inrAmount, false, _orderType);
        emit USDTTransferred(orderCounter, _userAddress, admin, _usdtAmount);
        emit OrderCompleted(orderCounter, _userAddress, _usdtAmount);
    }

    function getAdminWallet() external view returns (address) {
        return admin;
    }

    function getGasStation() external view returns (address) {
        return gasStation;
    }
}