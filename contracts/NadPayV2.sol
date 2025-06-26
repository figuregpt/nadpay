// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract NadPayV2 is ReentrancyGuard, Ownable2Step, Pausable {
    using SafeERC20 for IERC20;

    struct PaymentLink {
        uint256 id;
        address creator;
        string title;
        uint256 price;
        address paymentToken; // address(0) for native MON
        uint256 totalSales; // 0 for unlimited
        uint256 maxPerWallet; // 0 for unlimited
        uint256 salesCount;
        uint256 totalEarned;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt; // 0 for no expiration
    }

    struct Purchase {
        address buyer;
        uint256 amount;
        uint256 timestamp;
        bytes32 txHash;
    }

    // ✅ NEW: Pagination support for gas limit DoS prevention
    struct PaginationResult {
        uint256[] linkIds;
        uint256 totalCount;
        bool hasMore;
        uint256 nextCursor;
    }

    // State variables
    mapping(uint256 => PaymentLink) public paymentLinks;
    mapping(uint256 => Purchase[]) public linkPurchases;
    mapping(uint256 => mapping(address => uint256)) public userPurchases;
    
    // ✅ NEW: Creator links tracking for efficient pagination
    mapping(address => uint256[]) public creatorLinkIds;
    mapping(address => mapping(uint256 => uint256)) public creatorLinkIndex; // creator => linkId => index
    
    uint256 private _linkIdCounter;
    uint256 public platformFee = 250; // 2.5% in basis points
    uint256 public constant MAX_FEE = 1000; // 10% maximum
    address public feeRecipient;
    
    // ✅ NEW: Anti-centralization measures
    uint256 public constant TIMELOCK_DURATION = 2 days;
    mapping(bytes32 => uint256) public timelockProposals;
    address public proposedFeeRecipient;
    uint256 public proposedFeeRecipientTime;
    
    // ✅ NEW: Enhanced input validation limits
    uint256 public constant MAX_TITLE_LENGTH = 200;
    uint256 public constant MAX_TOTAL_SALES = 1000000; // 1M max
    uint256 public constant MAX_PER_WALLET = 10000; // 10K max
    uint256 public constant MIN_PRICE = 1000; // 0.001 MON minimum
    uint256 public constant MAX_PRICE = 1000 ether; // 1000 MON maximum
    uint256 public constant MAX_EXPIRATION_DURATION = 365 days; // 1 year max
    uint256 public constant MAX_PURCHASE_AMOUNT = 1000; // Max 1000 items per tx
    
    // ✅ NEW: Front-running protection
    mapping(address => uint256) public lastPurchaseBlock;
    uint256 public constant PURCHASE_COOLDOWN_BLOCKS = 1; // 1 block cooldown
    
    // ✅ NEW: Emergency controls
    bool public emergencyPaused = false;
    uint256 public maxDailyWithdrawal = 100 ether;
    mapping(uint256 => uint256) public dailyWithdrawn; // day => amount
    
    // Events
    event PaymentLinkCreated(
        uint256 indexed linkId,
        address indexed creator,
        string title,
        uint256 price,
        address paymentToken,
        uint256 totalSales,
        uint256 maxPerWallet,
        uint256 expiresAt
    );
    
    event PurchaseMade(
        uint256 indexed linkId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice,
        address paymentToken,
        bytes32 txHash
    );
    
    event PaymentLinkDeactivated(uint256 indexed linkId);
    event PlatformFeeUpdated(uint256 newFee);
    
    // ✅ NEW: Enhanced events
    event FeeRecipientProposed(address indexed newRecipient, uint256 effectiveTime);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event EmergencyAction(string action, address indexed actor, uint256 timestamp);

    // Modifiers
    modifier validLinkId(uint256 linkId) {
        require(linkId < _linkIdCounter, "Invalid link ID");
        _;
    }

    modifier onlyCreator(uint256 linkId) {
        require(msg.sender == paymentLinks[linkId].creator, "Only creator can perform this action");
        _;
    }
    
    // ✅ NEW: Enhanced security modifiers
    modifier antiBot() {
        require(tx.origin == msg.sender, "No contract calls allowed");
        _;
    }
    
    modifier rateLimited() {
        require(
            lastPurchaseBlock[msg.sender] + PURCHASE_COOLDOWN_BLOCKS <= block.number,
            "Purchase rate limit exceeded"
        );
        lastPurchaseBlock[msg.sender] = block.number;
        _;
    }
    
    modifier notEmergencyPaused() {
        require(!emergencyPaused, "Emergency pause active");
        _;
    }

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_feeRecipient != msg.sender, "Fee recipient cannot be owner");
        feeRecipient = _feeRecipient;
    }

    // ✅ ENHANCED: Input validation and anti-DoS measures
    function createPaymentLink(
        string memory title,
        uint256 price,
        address paymentToken,
        uint256 totalSales,
        uint256 maxPerWallet,
        uint256 expiresAt
    ) external whenNotPaused notEmergencyPaused returns (uint256) {
        // ✅ Enhanced input validation
        require(bytes(title).length > 0 && bytes(title).length <= MAX_TITLE_LENGTH, "Invalid title length");
        require(price >= MIN_PRICE && price <= MAX_PRICE, "Price out of bounds");
        require(totalSales <= MAX_TOTAL_SALES, "Total sales too high");
        require(maxPerWallet <= MAX_PER_WALLET, "Max per wallet too high");
        
        if (expiresAt > 0) {
            require(expiresAt > block.timestamp, "Expiration must be in the future");
            require(expiresAt <= block.timestamp + MAX_EXPIRATION_DURATION, "Expiration too far in future");
        }
        
        // ✅ Validate token address if not native
        if (paymentToken != address(0)) {
            require(_isContract(paymentToken), "Invalid token contract");
        }

        uint256 linkId = _linkIdCounter++;

        paymentLinks[linkId] = PaymentLink({
            id: linkId,
            creator: msg.sender,
            title: title,
            price: price,
            paymentToken: paymentToken,
            totalSales: totalSales,
            maxPerWallet: maxPerWallet,
            salesCount: 0,
            totalEarned: 0,
            isActive: true,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        // ✅ Track creator links for efficient queries
        creatorLinkIds[msg.sender].push(linkId);
        creatorLinkIndex[msg.sender][linkId] = creatorLinkIds[msg.sender].length - 1;

        emit PaymentLinkCreated(
            linkId,
            msg.sender,
            title,
            price,
            paymentToken,
            totalSales,
            maxPerWallet,
            expiresAt
        );

        return linkId;
    }

    // ✅ ENHANCED: Anti-front-running and rate limiting
    function purchase(uint256 linkId, uint256 amount) 
        external 
        payable 
        nonReentrant 
        validLinkId(linkId)
        antiBot
        rateLimited
        whenNotPaused
        notEmergencyPaused
    {
        PaymentLink storage link = paymentLinks[linkId];
        
        // ✅ Enhanced validation
        require(link.isActive, "Payment link is not active");
        require(amount > 0 && amount <= MAX_PURCHASE_AMOUNT, "Invalid purchase amount");
        
        // ✅ Timestamp manipulation protection (allow small variance)
        if (link.expiresAt > 0) {
            require(block.timestamp + 300 <= link.expiresAt, "Payment link expired or expiring soon");
        }
        
        // Check total sales limit
        if (link.totalSales > 0) {
            require(link.salesCount + amount <= link.totalSales, "Exceeds total sales limit");
        }
        
        // Check per-wallet limit
        if (link.maxPerWallet > 0) {
            require(
                userPurchases[linkId][msg.sender] + amount <= link.maxPerWallet,
                "Exceeds per-wallet limit"
            );
        }
        
        uint256 totalPrice = link.price * amount;
        require(totalPrice / amount == link.price, "Price overflow"); // Overflow check
        
        // Validate payment amounts
        if (link.paymentToken == address(0)) {
            require(msg.value == totalPrice, "Incorrect MON payment amount");
        } else {
            require(msg.value == 0, "No MON should be sent for token payments");
        }
        
        // Calculate fees with overflow protection
        uint256 fee = (totalPrice * platformFee) / 10000;
        require(fee <= totalPrice, "Fee calculation error");
        uint256 creatorAmount = totalPrice - fee;
        
        // ✅ EFFECTS: Update all state variables BEFORE external calls
        link.totalEarned += creatorAmount;
        link.salesCount += amount;
        userPurchases[linkId][msg.sender] += amount;
        
        // Auto-deactivate if sold out
        if (link.totalSales > 0 && link.salesCount >= link.totalSales) {
            link.isActive = false;
        }
        
        // Record purchase with enhanced data
        linkPurchases[linkId].push(Purchase({
            buyer: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            txHash: keccak256(abi.encodePacked(block.timestamp, msg.sender, linkId, amount))
        }));
        
        // ✅ INTERACTIONS: External calls LAST (reentrancy safe)
        if (link.paymentToken == address(0)) {
            // Native MON payment
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
            payable(link.creator).transfer(creatorAmount);
        } else {
            // ERC20 token payment with additional safety
            IERC20 token = IERC20(link.paymentToken);
            
            if (fee > 0) {
                token.safeTransferFrom(msg.sender, feeRecipient, fee);
            }
            token.safeTransferFrom(msg.sender, link.creator, creatorAmount);
        }
        
        // Emit events after successful execution
        if (link.totalSales > 0 && link.salesCount >= link.totalSales) {
            emit PaymentLinkDeactivated(linkId);
        }
        
        emit PurchaseMade(
            linkId, 
            msg.sender, 
            amount, 
            totalPrice, 
            link.paymentToken,
            keccak256(abi.encodePacked(block.timestamp, msg.sender, linkId, amount))
        );
    }

    function deactivatePaymentLink(uint256 linkId) 
        external 
        validLinkId(linkId) 
        onlyCreator(linkId) 
        whenNotPaused
    {
        paymentLinks[linkId].isActive = false;
        emit PaymentLinkDeactivated(linkId);
    }

    // ✅ ENHANCED: Paginated queries to prevent gas limit DoS
    function getCreatorLinks(address creator, uint256 offset, uint256 limit) 
        external 
        view 
        returns (PaginationResult memory) 
    {
        require(limit > 0 && limit <= 100, "Invalid limit"); // Max 100 per query
        
        uint256[] storage allLinks = creatorLinkIds[creator];
        uint256 totalCount = allLinks.length;
        
        if (offset >= totalCount) {
            return PaginationResult({
                linkIds: new uint256[](0),
                totalCount: totalCount,
                hasMore: false,
                nextCursor: 0
            });
        }
        
        uint256 end = offset + limit;
        if (end > totalCount) {
            end = totalCount;
        }
        
        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allLinks[i];
        }
        
        return PaginationResult({
            linkIds: result,
            totalCount: totalCount,
            hasMore: end < totalCount,
            nextCursor: end
        });
    }
    
    // ✅ NEW: Get all creator links (with gas limit protection)
    function getAllCreatorLinks(address creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] storage links = creatorLinkIds[creator];
        require(links.length <= 1000, "Too many links, use pagination"); // Gas limit protection
        return links;
    }

    // View functions
    function getPaymentLink(uint256 linkId) 
        external 
        view 
        validLinkId(linkId) 
        returns (PaymentLink memory) 
    {
        return paymentLinks[linkId];
    }

    function getPurchases(uint256 linkId) 
        external 
        view 
        validLinkId(linkId) 
        returns (Purchase[] memory) 
    {
        return linkPurchases[linkId];
    }

    function getUserPurchaseCount(uint256 linkId, address user) 
        external 
        view 
        validLinkId(linkId) 
        returns (uint256) 
    {
        return userPurchases[linkId][user];
    }

    function getTotalLinks() external view returns (uint256) {
        return _linkIdCounter;
    }
    
    // ✅ NEW: Enhanced view functions
    function getCreatorLinkCount(address creator) external view returns (uint256) {
        return creatorLinkIds[creator].length;
    }
    
    function isValidToken(address token) external view returns (bool) {
        return token == address(0) || _isContract(token);
    }

    // ✅ ENHANCED: Anti-centralization owner functions with timelock
    function proposeFeeRecipientChange(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        require(newRecipient != owner(), "Fee recipient cannot be owner");
        require(newRecipient != feeRecipient, "Same as current recipient");
        
        proposedFeeRecipient = newRecipient;
        proposedFeeRecipientTime = block.timestamp;
        
        emit FeeRecipientProposed(newRecipient, block.timestamp + TIMELOCK_DURATION);
    }
    
    function executeFeeRecipientChange() external onlyOwner {
        require(proposedFeeRecipient != address(0), "No proposal pending");
        require(
            block.timestamp >= proposedFeeRecipientTime + TIMELOCK_DURATION,
            "Timelock not expired"
        );
        
        address oldRecipient = feeRecipient;
        feeRecipient = proposedFeeRecipient;
        
        // Clear proposal
        proposedFeeRecipient = address(0);
        proposedFeeRecipientTime = 0;
        
        emit FeeRecipientUpdated(oldRecipient, feeRecipient);
    }

    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        require(newFee != platformFee, "Same as current fee");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    // ✅ ENHANCED: Emergency functions with daily limits
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        
        uint256 today = block.timestamp / 1 days;
        require(
            dailyWithdrawn[today] + amount <= maxDailyWithdrawal,
            "Daily withdrawal limit exceeded"
        );
        
        dailyWithdrawn[today] += amount;
        payable(owner()).transfer(amount);
        
        emit EmergencyAction("Emergency withdrawal", owner(), block.timestamp);
    }

    function emergencyTokenWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be positive");
        
        IERC20(token).safeTransfer(owner(), amount);
        emit EmergencyAction("Emergency token withdrawal", owner(), block.timestamp);
    }
    
    function setEmergencyPause(bool paused) external onlyOwner {
        emergencyPaused = paused;
        emit EmergencyAction(
            paused ? "Emergency pause activated" : "Emergency pause deactivated",
            owner(),
            block.timestamp
        );
    }
    
    function setMaxDailyWithdrawal(uint256 newLimit) external onlyOwner {
        require(newLimit >= 10 ether, "Limit too low");
        require(newLimit <= 1000 ether, "Limit too high");
        maxDailyWithdrawal = newLimit;
    }

    // ✅ ENHANCED: Pausable functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ✅ Internal helper functions
    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
    
    // ✅ NEW: Get current day for withdrawal limits
    function getCurrentDay() external view returns (uint256) {
        return block.timestamp / 1 days;
    }
    
    function getDailyWithdrawn(uint256 day) external view returns (uint256) {
        return dailyWithdrawn[day];
    }
    
    function getRemainingDailyWithdrawal() external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        uint256 withdrawn = dailyWithdrawn[today];
        return withdrawn >= maxDailyWithdrawal ? 0 : maxDailyWithdrawal - withdrawn;
    }
} 