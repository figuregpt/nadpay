// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NadRaffleV3 is ReentrancyGuard, Ownable {
    uint256 private _raffleIdCounter;
    uint256 public platformFeePercentage = 250; // 2.5% (250 basis points)
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
        address rewardTokenAddress; // For both ERC20 and ERC721 (address(0) for native MON)
        uint256 rewardAmount; // Amount for ERC20/native, tokenId for ERC721
        address ticketPaymentToken; // Token address for ticket payments (address(0) for native MON)
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
        address ticketPaymentToken,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 expirationTime
    );

    event TicketPurchased(
        uint256 indexed raffleId,
        address indexed buyer,
        uint256 ticketNumber,
        address paymentToken,
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
        address ticketPaymentToken, // New parameter for multi-token support
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 maxTicketsPerWallet,
        uint256 expirationTime,
        bool autoDistributeOnSoldOut
    ) external payable nonReentrant returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(ticketPrice > 0, "Ticket price must be greater than 0");
        require(maxTickets > 0, "Max tickets must be greater than 0");
        require(maxTicketsPerWallet > 0 && maxTicketsPerWallet <= maxTickets, "Invalid max tickets per wallet");
        require(expirationTime > block.timestamp, "Expiration time must be in the future");
        require(expirationTime >= block.timestamp + 13 minutes, "Raffle duration must be at least 13 minutes");

        // Calculate platform fee for raffle creation (small fee in native token)
        uint256 creationFee = 0.001 ether; // Small creation fee
        
        _raffleIdCounter++;
        uint256 raffleId = _raffleIdCounter;

        // Handle reward transfer based on type and token address
        if (rewardType == RewardType.TOKEN) {
            require(rewardAmount > 0, "Reward amount must be greater than 0");
            
            if (rewardTokenAddress == address(0)) {
                // Native MON reward - check if msg.value covers both creation fee and reward
                require(msg.value >= creationFee + rewardAmount, "Insufficient MON for creation fee and reward");
            } else {
                // ERC20 token reward - only need creation fee in msg.value
                require(msg.value >= creationFee, "Insufficient fee for raffle creation");
                IERC20(rewardTokenAddress).transferFrom(msg.sender, address(this), rewardAmount);
            }
        } else {
            // NFT reward
            require(msg.value >= creationFee, "Insufficient fee for raffle creation");
            IERC721(rewardTokenAddress).transferFrom(msg.sender, address(this), rewardAmount);
        }

        raffles[raffleId] = Raffle({
            id: raffleId,
            creator: msg.sender,
            title: title,
            description: description,
            imageHash: imageHash,
            rewardType: rewardType,
            rewardTokenAddress: rewardTokenAddress,
            rewardAmount: rewardAmount,
            ticketPaymentToken: ticketPaymentToken,
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

        userRaffles[msg.sender].push(raffleId);
        
        // Initialize random seed for this raffle
        raffleSeeds[raffleId] = keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            raffleId,
            globalNonce++
        ));

        emit RaffleCreated(
            raffleId,
            msg.sender,
            title,
            rewardType,
            rewardTokenAddress,
            rewardAmount,
            ticketPaymentToken,
            ticketPrice,
            maxTickets,
            expirationTime
        );

        return raffleId;
    }

    function purchaseTickets(uint256 raffleId, uint256 quantity) external payable nonReentrant {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(block.timestamp < raffle.expirationTime, "Raffle has expired");
        require(quantity > 0, "Quantity must be greater than 0");
        require(raffle.ticketsSold + quantity <= raffle.maxTickets, "Not enough tickets available");
        
        uint256 userCurrentTickets = ticketsPurchasedByWallet[raffleId][msg.sender];
        require(userCurrentTickets + quantity <= raffle.maxTicketsPerWallet, "Exceeds max tickets per wallet");

        uint256 totalCost = raffle.ticketPrice * quantity;

        // Handle payment based on ticket payment token
        if (raffle.ticketPaymentToken == address(0)) {
            // Native MON payment
            require(msg.value >= totalCost, "Insufficient MON payment");
        } else {
            // ERC20 token payment
            require(msg.value == 0, "No MON should be sent for ERC20 payments");
            IERC20(raffle.ticketPaymentToken).transferFrom(msg.sender, address(this), totalCost);
        }

        // Purchase tickets
        for (uint256 i = 0; i < quantity; i++) {
            uint256 ticketNumber = raffle.ticketsSold + i + 1;
            
            // Generate unique random seed for each ticket
            bytes32 ticketSeed = keccak256(abi.encodePacked(
                raffleSeeds[raffleId],
                msg.sender,
                ticketNumber,
                block.timestamp,
                block.difficulty,
                globalNonce++
            ));

            raffleTickets[raffleId].push(Ticket({
                raffleId: raffleId,
                buyer: msg.sender,
                ticketNumber: ticketNumber,
                purchaseTime: block.timestamp,
                randomSeed: ticketSeed
            }));

            emit TicketPurchased(raffleId, msg.sender, ticketNumber, raffle.ticketPaymentToken, raffle.ticketPrice, ticketSeed);
        }

        raffle.ticketsSold += quantity;
        raffle.totalEarned += totalCost;
        ticketsPurchasedByWallet[raffleId][msg.sender] += quantity;

        // Calculate platform fee
        uint256 platformFee = (totalCost * platformFeePercentage) / 10000;
        uint256 creatorAmount = totalCost - platformFee;

        // Transfer funds to creator
        if (creatorAmount > 0) {
            if (raffle.ticketPaymentToken == address(0)) {
                // Native MON transfer
                payable(raffle.creator).transfer(creatorAmount);
            } else {
                // ERC20 token transfer
                IERC20(raffle.ticketPaymentToken).transfer(raffle.creator, creatorAmount);
            }
        }

        // Refund excess native payment if any
        if (raffle.ticketPaymentToken == address(0) && msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        // Check if raffle should be auto-distributed
        if (raffle.autoDistributeOnSoldOut && raffle.ticketsSold == raffle.maxTickets) {
            _endRaffle(raffleId);
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
            block.difficulty,
            raffle.ticketsSold,
            globalNonce++
        ));

        // Select random winner
        uint256 winningTicketIndex = uint256(finalRandomHash) % raffle.ticketsSold;
        Ticket storage winningTicket = raffleTickets[raffleId][winningTicketIndex];
        
        raffle.winner = winningTicket.buyer;
        raffle.status = RaffleStatus.ENDED;
        raffle.rewardClaimed = true; // Mark as claimed since we're auto-distributing

        // Automatically distribute reward to winner
        if (raffle.rewardType == RewardType.TOKEN) {
            if (raffle.rewardTokenAddress == address(0)) {
                // Native MON reward
                payable(raffle.winner).transfer(raffle.rewardAmount);
            } else {
                // ERC20 token reward
                IERC20(raffle.rewardTokenAddress).transfer(raffle.winner, raffle.rewardAmount);
            }
        } else {
            // NFT reward
            IERC721(raffle.rewardTokenAddress).transferFrom(address(this), raffle.winner, raffle.rewardAmount);
        }

        emit RaffleEnded(raffleId, raffle.winner, winningTicket.ticketNumber, finalRandomHash);
        emit RewardClaimed(raffleId, raffle.winner, raffle.rewardType, raffle.rewardAmount);
    }

    function claimReward(uint256 raffleId) external view {
        // This function is deprecated since rewards are now automatically distributed
        // when the raffle ends. Keeping for backwards compatibility.
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ENDED, "Raffle has not ended");
        require(raffle.winner == msg.sender, "Not the winner");
        
        // Since rewards are auto-distributed, this will always be true for ended raffles
        require(raffle.rewardClaimed, "Rewards are automatically distributed when raffle ends");
        
        // No action needed - reward was already distributed automatically
        revert("Rewards are automatically distributed - no manual claiming needed");
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
                // Native MON reward
                payable(raffle.creator).transfer(raffle.rewardAmount);
            } else {
                // ERC20 token reward
                IERC20(raffle.rewardTokenAddress).transfer(raffle.creator, raffle.rewardAmount);
            }
        } else {
            // NFT reward
            IERC721(raffle.rewardTokenAddress).transferFrom(address(this), raffle.creator, raffle.rewardAmount);
        }

        emit RaffleCancelled(raffleId, raffle.creator);
    }

    function forceEndExpiredRaffle(uint256 raffleId) external {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(block.timestamp >= raffle.expirationTime, "Raffle has not expired");
        
        if (raffle.ticketsSold == 0) {
            // No tickets sold, cancel the raffle
            raffle.status = RaffleStatus.CANCELLED;
            
            // Return the reward to creator
            if (raffle.rewardType == RewardType.TOKEN) {
                if (raffle.rewardTokenAddress == address(0)) {
                    // Native MON reward
                    payable(raffle.creator).transfer(raffle.rewardAmount);
                } else {
                    // ERC20 token reward
                    IERC20(raffle.rewardTokenAddress).transfer(raffle.creator, raffle.rewardAmount);
                }
            } else {
                // NFT reward
                IERC721(raffle.rewardTokenAddress).transferFrom(address(this), raffle.creator, raffle.rewardAmount);
            }
            
            emit RaffleCancelled(raffleId, raffle.creator);
        } else {
            // End the raffle normally
            _endRaffle(raffleId);
        }
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

    // Admin functions
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

    function withdrawERC20PlatformFees(address token) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "No token fees to withdraw");
        tokenContract.transfer(owner(), balance);
    }
} 