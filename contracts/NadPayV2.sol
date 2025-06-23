// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract NadPayV2 is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct PaymentLink {
        address creator;
        string title;
        string description;
        string coverImage;
        uint256 price;
        address paymentToken; // 0x0 for native MON, token address for ERC20
        uint256 totalSales;
        uint256 maxPerWallet;
        uint256 salesCount;
        uint256 totalEarned;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt; // 0 means never expires
    }

    struct Purchase {
        address buyer;
        uint256 amount;
        uint256 timestamp;
        bytes32 txHash;
    }

    // State variables
    uint256 private _linkIdCounter;
    mapping(uint256 => PaymentLink) public paymentLinks;
    mapping(uint256 => Purchase[]) public linkPurchases;
    mapping(uint256 => mapping(address => uint256)) public userPurchases; // linkId => user => amount
    
    // Platform fee (1% = 100 basis points)
    uint256 public platformFee = 100; // 1%
    uint256 public constant MAX_FEE = 500; // 5% max
    address public feeRecipient;

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

    constructor() Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }

    modifier validLinkId(uint256 linkId) {
        require(linkId < _linkIdCounter, "Invalid link ID");
        _;
    }

    modifier onlyCreator(uint256 linkId) {
        require(paymentLinks[linkId].creator == msg.sender, "Not the creator");
        _;
    }

    function createPaymentLink(
        string memory title,
        string memory description,
        string memory coverImage,
        uint256 price,
        address paymentToken, // 0x0 for native MON, token address for ERC20
        uint256 totalSales,
        uint256 maxPerWallet,
        uint256 expiresAt
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(bytes(description).length > 0, "Description required");
        require(price > 0, "Price must be greater than 0");

        uint256 linkId = _linkIdCounter++;

        paymentLinks[linkId] = PaymentLink({
            creator: msg.sender,
            title: title,
            description: description,
            coverImage: coverImage,
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

    function purchase(uint256 linkId, uint256 amount) 
        external 
        payable 
        nonReentrant 
        validLinkId(linkId) 
    {
        PaymentLink storage link = paymentLinks[linkId];
        
        require(link.isActive, "Payment link is not active");
        require(amount > 0, "Amount must be greater than 0");
        
        // Check expiration
        if (link.expiresAt > 0) {
            require(block.timestamp <= link.expiresAt, "Payment link has expired");
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
        
        // Handle payment based on token type
        if (link.paymentToken == address(0)) {
            // Native MON payment
            require(msg.value == totalPrice, "Incorrect MON payment amount");
            
            // Calculate platform fee
            uint256 fee = (totalPrice * platformFee) / 10000;
            uint256 creatorAmount = totalPrice - fee;
            
            // Transfer payments
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
            payable(link.creator).transfer(creatorAmount);
            
            // Update state
            link.totalEarned += creatorAmount;
        } else {
            // ERC20 token payment
            require(msg.value == 0, "No MON should be sent for token payments");
            
            IERC20 token = IERC20(link.paymentToken);
            
            // Calculate platform fee
            uint256 fee = (totalPrice * platformFee) / 10000;
            uint256 creatorAmount = totalPrice - fee;
            
            // Transfer tokens from buyer
            token.safeTransferFrom(msg.sender, feeRecipient, fee);
            token.safeTransferFrom(msg.sender, link.creator, creatorAmount);
            
            // Update state
            link.totalEarned += creatorAmount;
        }
        
        // Update common state
        link.salesCount += amount;
        userPurchases[linkId][msg.sender] += amount;
        
        // Auto-deactivate if sold out
        if (link.totalSales > 0 && link.salesCount >= link.totalSales) {
            link.isActive = false;
            emit PaymentLinkDeactivated(linkId);
        }
        
        // Record purchase
        linkPurchases[linkId].push(Purchase({
            buyer: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            txHash: blockhash(block.number - 1)
        }));
        
        emit PurchaseMade(
            linkId, 
            msg.sender, 
            amount, 
            totalPrice, 
            link.paymentToken,
            blockhash(block.number - 1)
        );
    }

    function deactivatePaymentLink(uint256 linkId) 
        external 
        validLinkId(linkId) 
        onlyCreator(linkId) 
    {
        paymentLinks[linkId].isActive = false;
        emit PaymentLinkDeactivated(linkId);
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

    function getCreatorLinks(address creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory creatorLinks = new uint256[](_linkIdCounter);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _linkIdCounter; i++) {
            if (paymentLinks[i].creator == creator) {
                creatorLinks[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = creatorLinks[i];
        }
        
        return result;
    }

    function getTotalLinks() external view returns (uint256) {
        return _linkIdCounter;
    }

    // Owner functions
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Emergency token withdrawal (only for tokens sent by mistake)
    function emergencyTokenWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
} 