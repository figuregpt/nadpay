// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NadRaffle is ReentrancyGuard, Ownable {
    uint256 private _raffleIdCounter;
    uint256 public platformFeePercentage = 200; // 2% (200 basis points)
    uint256 public constant MAX_FEE = 500; // 5% maximum

    enum RewardType { TOKEN, NFT }
    enum RaffleStatus { ACTIVE, ENDED, CANCELLED }

    struct Raffle {
        uint256 id;
        address creator;
        string title;
        string description;
        string imageHash;
        RewardType rewardType;
        address rewardTokenAddress; // For both ERC20 and ERC721
        uint256 rewardAmount; // Amount for ERC20, tokenId for ERC721
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 maxTicketsPerWallet;
        uint256 expirationTime;
        bool autoDistributeOnSoldOut;
        uint256 ticketsSold;
        uint256 totalEarned;
        address winner;
        RaffleStatus status;
        uint256 createdAt;
        bool rewardClaimed;
    }

    struct Ticket {
        uint256 raffleId;
        address buyer;
        uint256 ticketNumber;
        uint256 purchaseTime;
        bytes32 randomSeed;
    }

    mapping(uint256 => Raffle) public raffles;
    mapping(uint256 => Ticket[]) public raffleTickets;
    mapping(uint256 => mapping(address => uint256)) public ticketsPurchasedByWallet;
    mapping(address => uint256[]) public userRaffles;
    
    // For random number generation
    mapping(uint256 => bytes32) private raffleSeeds;
    uint256 private globalNonce;

    event RaffleCreated(
        uint256 indexed raffleId,
        address indexed creator,
        string title,
        RewardType rewardType,
        address rewardTokenAddress,
        uint256 rewardAmount,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 expirationTime
    );

    event TicketPurchased(
        uint256 indexed raffleId,
        address indexed buyer,
        uint256 ticketNumber,
        uint256 amount,
        bytes32 randomSeed
    );

    event RaffleEnded(
        uint256 indexed raffleId,
        address indexed winner,
        uint256 winningTicket,
        bytes32 randomHash
    );

    event RewardClaimed(
        uint256 indexed raffleId,
        address indexed winner,
        RewardType rewardType,
        uint256 amount
    );

    event RaffleCancelled(
        uint256 indexed raffleId,
        address indexed creator
    );

    event PlatformFeeUpdated(uint256 newFee);

    constructor() Ownable(msg.sender) {}

    function createRaffle(
        string memory title,
        string memory description,
        string memory imageHash,
        RewardType rewardType,
        address rewardTokenAddress,
        uint256 rewardAmount,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 maxTicketsPerWallet,
        uint256 expirationTime,
        bool autoDistributeOnSoldOut
    ) external payable nonReentrant returns (uint256) {
        _validateRaffleParams(title, description, ticketPrice, maxTickets, maxTicketsPerWallet, expirationTime);
        
        uint256 requiredValue = 0.001 ether; // Base creation fee
        if (rewardType == RewardType.TOKEN && rewardTokenAddress == address(0)) {
            requiredValue += rewardAmount; // Add reward amount for native MON
        }
        require(msg.value >= requiredValue, "Insufficient fee for raffle creation");

        _raffleIdCounter++;
        uint256 raffleId = _raffleIdCounter;

        _transferReward(rewardType, rewardTokenAddress, rewardAmount);
        _createRaffleData(raffleId, title, description, imageHash, rewardType, rewardTokenAddress, rewardAmount, ticketPrice, maxTickets, maxTicketsPerWallet, expirationTime, autoDistributeOnSoldOut);
        
        userRaffles[msg.sender].push(raffleId);
        _initializeRandomSeed(raffleId);

        emit RaffleCreated(raffleId, msg.sender, title, rewardType, rewardTokenAddress, rewardAmount, ticketPrice, maxTickets, expirationTime);
        return raffleId;
    }

    function _validateRaffleParams(
        string memory title,
        string memory description, 
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 maxTicketsPerWallet,
        uint256 expirationTime
    ) internal view {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(ticketPrice > 0, "Ticket price must be greater than 0");
        require(maxTickets > 0, "Max tickets must be greater than 0");
        require(maxTicketsPerWallet > 0 && maxTicketsPerWallet <= maxTickets, "Invalid max tickets per wallet");
        require(expirationTime > block.timestamp, "Expiration time must be in the future");
    }

    function _transferReward(RewardType rewardType, address rewardTokenAddress, uint256 rewardAmount) internal {
        if (rewardType == RewardType.TOKEN) {
            require(rewardAmount > 0, "Reward amount must be greater than 0");
            if (rewardTokenAddress == address(0)) {
                // Native MON token - no transfer needed, reward will be sent from contract balance
                require(msg.value >= rewardAmount, "Insufficient MON sent for reward");
            } else {
                // ERC-20 token
                IERC20(rewardTokenAddress).transferFrom(msg.sender, address(this), rewardAmount);
            }
        } else {
            IERC721(rewardTokenAddress).transferFrom(msg.sender, address(this), rewardAmount);
        }
    }

    function _createRaffleData(
        uint256 raffleId,
        string memory title,
        string memory description,
        string memory imageHash,
        RewardType rewardType,
        address rewardTokenAddress,
        uint256 rewardAmount,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 maxTicketsPerWallet,
        uint256 expirationTime,
        bool autoDistributeOnSoldOut
    ) internal {
        raffles[raffleId] = Raffle({
            id: raffleId,
            creator: msg.sender,
            title: title,
            description: description,
            imageHash: imageHash,
            rewardType: rewardType,
            rewardTokenAddress: rewardTokenAddress,
            rewardAmount: rewardAmount,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            maxTicketsPerWallet: maxTicketsPerWallet,
            expirationTime: expirationTime,
            autoDistributeOnSoldOut: autoDistributeOnSoldOut,
            ticketsSold: 0,
            totalEarned: 0,
            winner: address(0),
            status: RaffleStatus.ACTIVE,
            createdAt: block.timestamp,
            rewardClaimed: false
        });
    }

    function _initializeRandomSeed(uint256 raffleId) internal {
        raffleSeeds[raffleId] = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            raffleId,
            globalNonce++
        ));
    }

    function purchaseTickets(uint256 raffleId, uint256 quantity) external payable nonReentrant {
        Raffle storage raffle = raffles[raffleId];
        _validateTicketPurchase(raffle, raffleId, quantity);

        uint256 totalCost = raffle.ticketPrice * quantity;
        require(msg.value >= totalCost, "Insufficient payment");

        _processTicketPurchase(raffleId, quantity, totalCost);
        _transferFunds(raffle.creator, totalCost);

        if (raffle.autoDistributeOnSoldOut && raffle.ticketsSold == raffle.maxTickets) {
            _endRaffle(raffleId);
        }
    }

    function _validateTicketPurchase(Raffle storage raffle, uint256 raffleId, uint256 quantity) internal view {
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(block.timestamp < raffle.expirationTime, "Raffle has expired");
        require(quantity > 0, "Quantity must be greater than 0");
        require(raffle.ticketsSold + quantity <= raffle.maxTickets, "Not enough tickets available");
        
        uint256 userCurrentTickets = ticketsPurchasedByWallet[raffleId][msg.sender];
        require(userCurrentTickets + quantity <= raffle.maxTicketsPerWallet, "Exceeds max tickets per wallet");
    }

    function _processTicketPurchase(uint256 raffleId, uint256 quantity, uint256 totalCost) internal {
        Raffle storage raffle = raffles[raffleId];
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 ticketNumber = raffle.ticketsSold + i + 1;
            bytes32 ticketSeed = keccak256(abi.encodePacked(raffleSeeds[raffleId], msg.sender, ticketNumber, block.timestamp, globalNonce++));

            raffleTickets[raffleId].push(Ticket({
                raffleId: raffleId,
                buyer: msg.sender,
                ticketNumber: ticketNumber,
                purchaseTime: block.timestamp,
                randomSeed: ticketSeed
            }));

            emit TicketPurchased(raffleId, msg.sender, ticketNumber, raffle.ticketPrice, ticketSeed);
        }

        raffle.ticketsSold += quantity;
        raffle.totalEarned += totalCost;
        ticketsPurchasedByWallet[raffleId][msg.sender] += quantity;
    }

    function _transferFunds(address creator, uint256 totalCost) internal {
        uint256 platformFee = (totalCost * platformFeePercentage) / 10000;
        uint256 creatorAmount = totalCost - platformFee;

        if (creatorAmount > 0) {
            payable(creator).transfer(creatorAmount);
        }

        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    function endRaffle(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(
            msg.sender == raffle.creator || 
            msg.sender == owner() || 
            block.timestamp >= raffle.expirationTime,
            "Not authorized to end raffle"
        );
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(raffle.ticketsSold > 0, "No tickets sold");

        _endRaffle(raffleId);
    }

    function _endRaffle(uint256 raffleId) internal {
        Raffle storage raffle = raffles[raffleId];
        
        // Generate final random number for winner selection
        bytes32 finalRandomHash = keccak256(abi.encodePacked(
            raffleSeeds[raffleId],
            block.timestamp,
            block.prevrandao,
            raffle.ticketsSold,
            globalNonce++
        ));

        // Select random winner
        uint256 winningTicketIndex = uint256(finalRandomHash) % raffle.ticketsSold;
        Ticket storage winningTicket = raffleTickets[raffleId][winningTicketIndex];
        
        raffle.winner = winningTicket.buyer;
        raffle.status = RaffleStatus.ENDED;

        emit RaffleEnded(raffleId, raffle.winner, winningTicket.ticketNumber, finalRandomHash);
    }

    function claimReward(uint256 raffleId) external nonReentrant {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ENDED, "Raffle has not ended");
        require(raffle.winner == msg.sender, "Not the winner");
        require(!raffle.rewardClaimed, "Reward already claimed");

        raffle.rewardClaimed = true;

        if (raffle.rewardType == RewardType.TOKEN) {
            if (raffle.rewardTokenAddress == address(0)) {
                // Native MON token
                payable(msg.sender).transfer(raffle.rewardAmount);
            } else {
                // ERC-20 token
                IERC20(raffle.rewardTokenAddress).transfer(msg.sender, raffle.rewardAmount);
            }
        } else {
            IERC721(raffle.rewardTokenAddress).transferFrom(address(this), msg.sender, raffle.rewardAmount);
        }

        emit RewardClaimed(raffleId, msg.sender, raffle.rewardType, raffle.rewardAmount);
    }

    function cancelRaffle(uint256 raffleId) external nonReentrant {
        Raffle storage raffle = raffles[raffleId];
        require(msg.sender == raffle.creator, "Only creator can cancel");
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(raffle.ticketsSold == 0, "Cannot cancel raffle with sold tickets");

        raffle.status = RaffleStatus.CANCELLED;

        // Return the reward to creator
        if (raffle.rewardType == RewardType.TOKEN) {
            if (raffle.rewardTokenAddress == address(0)) {
                // Native MON token
                payable(raffle.creator).transfer(raffle.rewardAmount);
            } else {
                // ERC-20 token
                IERC20(raffle.rewardTokenAddress).transfer(raffle.creator, raffle.rewardAmount);
            }
        } else {
            IERC721(raffle.rewardTokenAddress).transferFrom(address(this), raffle.creator, raffle.rewardAmount);
        }

        emit RaffleCancelled(raffleId, raffle.creator);
    }

    // View functions
    function getRaffle(uint256 raffleId) external view returns (Raffle memory) {
        return raffles[raffleId];
    }

    function getRaffleTickets(uint256 raffleId) external view returns (Ticket[] memory) {
        return raffleTickets[raffleId];
    }

    function getUserRaffles(address user) external view returns (uint256[] memory) {
        return userRaffles[user];
    }

    function getUserTickets(uint256 raffleId, address user) external view returns (uint256) {
        return ticketsPurchasedByWallet[raffleId][user];
    }

    function getTotalRaffles() external view returns (uint256) {
        return _raffleIdCounter;
    }

    function isRaffleExpired(uint256 raffleId) external view returns (bool) {
        return block.timestamp >= raffles[raffleId].expirationTime;
    }

    // Owner functions
    function setPlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_FEE, "Fee too high");
        platformFeePercentage = newFeePercentage;
        emit PlatformFeeUpdated(newFeePercentage);
    }

    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    // Emergency function to end expired raffles
    function forceEndExpiredRaffle(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(block.timestamp >= raffle.expirationTime, "Raffle has not expired");
        require(raffle.ticketsSold > 0, "No tickets sold");

        _endRaffle(raffleId);
    }
} 