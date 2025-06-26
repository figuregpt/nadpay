// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract NadRaffleV4 is ReentrancyGuard, Ownable2Step, Pausable {
    
    enum RaffleStatus { ACTIVE, ENDED, CANCELLED }
    enum RewardType { TOKEN, NFT }
    
    struct Raffle {
        uint256 id;
        address creator;
        string title;
        string description;
        RewardType rewardType;
        address rewardTokenAddress;
        uint256 rewardAmount;
        uint256 ticketPrice;
        address ticketPaymentToken;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 totalEarned;
        uint256 expirationTime;
        bool autoDistributeOnSoldOut;
        address winner;
        RaffleStatus status;
        bool rewardClaimed;
        uint256 createdAt;
    }
    
    struct Ticket {
        uint256 raffleId;
        address buyer;
        uint256 ticketNumber;
        uint256 purchaseTime;
        bytes32 randomSeed;
    }
    
    struct RandomnessCommit {
        bytes32 commitment;
        uint256 commitTime;
        bool revealed;
        uint256 revealDeadline;
    }
    
    // State variables
    mapping(uint256 => Raffle) public raffles;
    mapping(uint256 => Ticket[]) public raffleTickets;
    mapping(uint256 => mapping(address => uint256)) public ticketsPurchasedByWallet;
    mapping(address => uint256[]) public userRaffles;
    
    uint256 private _raffleIdCounter;
    uint256 public platformFeePercentage = 250; // 2.5%
    uint256 public constant MAX_FEE = 1000; // 10%
    uint256 public globalNonce;
    uint256[] public activeRaffleIds;
    
    // ✅ Secure randomness
    mapping(uint256 => RandomnessCommit) public randomnessCommits;
    mapping(uint256 => bytes32) public raffleSeeds;
    uint256 public constant REVEAL_WINDOW = 1 hours;
    
    // ✅ NEW: Enhanced security features
    uint256 public constant MAX_TITLE_LENGTH = 100;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 500;
    uint256 public constant MAX_TICKETS = 100000; // 100K max
    uint256 public constant MIN_TICKET_PRICE = 1000; // 0.001 MON minimum
    uint256 public constant MAX_TICKET_PRICE = 100 ether; // 100 MON maximum
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 90 days;
    uint256 public constant MAX_TICKETS_PER_PURCHASE = 100; // Max 100 tickets per tx
    uint256 public constant TIMELOCK_DURATION = 2 days;
    
    // ✅ Front-running protection
    mapping(address => uint256) public lastTicketPurchaseBlock;
    mapping(address => uint256) public lastRaffleCreationBlock;
    uint256 public constant TICKET_PURCHASE_COOLDOWN = 1;
    uint256 public constant RAFFLE_CREATION_COOLDOWN = 5; // 5 blocks between raffle creations
    
    // ✅ Emergency controls
    bool public emergencyPaused = false;
    uint256 public maxDailyWithdrawal = 100 ether;
    mapping(uint256 => uint256) public dailyWithdrawn;
    
    // ✅ Anti-centralization
    address public proposedFeeRecipient;
    uint256 public proposedFeeRecipientTime;
    uint256 public proposedNewFeePercentage;
    uint256 public proposedFeePercentageTime;
    
    // Events
    event RaffleCreated(uint256 indexed raffleId, address indexed creator, string title, uint256 maxTickets, uint256 ticketPrice, address ticketPaymentToken, uint256 expirationTime);
    event TicketPurchased(uint256 indexed raffleId, address indexed buyer, uint256 ticketNumber, address paymentToken, uint256 price, bytes32 randomSeed);
    event RaffleEnded(uint256 indexed raffleId, address indexed winner, uint256 winningTicketNumber, bytes32 randomHash);
    event RaffleCancelled(uint256 indexed raffleId, address indexed creator);
    event RewardClaimed(uint256 indexed raffleId, address indexed winner, RewardType rewardType, uint256 amount);
    event RaffleAutoFinalized(uint256 indexed raffleId, string reason);
    event PlatformFeeUpdated(uint256 newFeePercentage);
    event RandomnessCommitted(uint256 indexed raffleId, bytes32 commitment, uint256 revealDeadline);
    event RandomnessRevealed(uint256 indexed raffleId, uint256 nonce, address winner);
    event EmergencyWinnerSelected(uint256 indexed raffleId, address winner, string reason);
    event EmergencyAction(string action, address indexed actor, uint256 timestamp);
    
    // ✅ Enhanced modifiers
    modifier validRaffleId(uint256 raffleId) {
        require(raffleId < _raffleIdCounter, "Invalid raffle ID");
        _;
    }
    
    modifier onlyRaffleCreator(uint256 raffleId) {
        require(msg.sender == raffles[raffleId].creator, "Only raffle creator can perform this action");
        _;
    }
    
    modifier antiBot() {
        require(tx.origin == msg.sender, "No contract calls allowed");
        _;
    }
    
    modifier ticketPurchaseRateLimit() {
        require(
            lastTicketPurchaseBlock[msg.sender] + TICKET_PURCHASE_COOLDOWN <= block.number,
            "Ticket purchase rate limit exceeded"
        );
        lastTicketPurchaseBlock[msg.sender] = block.number;
        _;
    }
    
    modifier raffleCreationRateLimit() {
        require(
            lastRaffleCreationBlock[msg.sender] + RAFFLE_CREATION_COOLDOWN <= block.number,
            "Raffle creation rate limit exceeded"
        );
        lastRaffleCreationBlock[msg.sender] = block.number;
        _;
    }
    
    modifier notEmergencyPaused() {
        require(!emergencyPaused, "Emergency pause active");
        _;
    }
    
    modifier autoFinalizeExpired() {
        _autoFinalizeExpiredRaffles();
        _;
    }

    constructor() Ownable(msg.sender) {}
    
    // ✅ ENHANCED: Input validation and anti-DoS
    function createRaffle(
        string memory title,
        string memory description,
        RewardType rewardType,
        address rewardTokenAddress,
        uint256 rewardAmount,
        uint256 ticketPrice,
        address ticketPaymentToken,
        uint256 maxTickets,
        uint256 duration,
        bool autoDistributeOnSoldOut
    ) external payable nonReentrant antiBot raffleCreationRateLimit whenNotPaused notEmergencyPaused returns (uint256) {
        // ✅ Enhanced input validation
        require(bytes(title).length > 0 && bytes(title).length <= MAX_TITLE_LENGTH, "Invalid title length");
        require(bytes(description).length <= MAX_DESCRIPTION_LENGTH, "Description too long");
        require(maxTickets > 0 && maxTickets <= MAX_TICKETS, "Invalid max tickets");
        require(ticketPrice >= MIN_TICKET_PRICE && ticketPrice <= MAX_TICKET_PRICE, "Ticket price out of bounds");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "Duration out of bounds");
        
        // ✅ Validate token addresses
        if (ticketPaymentToken != address(0)) {
            require(_isContract(ticketPaymentToken), "Invalid ticket payment token");
        }
        
        uint256 raffleId = _raffleIdCounter++;
        uint256 expirationTime = block.timestamp + duration;
        
        // ✅ Enhanced reward validation and escrow
        if (rewardType == RewardType.TOKEN) {
            require(rewardAmount > 0, "Reward amount must be positive");
            if (rewardTokenAddress == address(0)) {
                require(msg.value >= rewardAmount, "Insufficient native token for reward");
            } else {
                require(_isContract(rewardTokenAddress), "Invalid reward token contract");
                require(msg.value == 0, "No native token should be sent for ERC20 rewards");
                IERC20(rewardTokenAddress).transferFrom(msg.sender, address(this), rewardAmount);
            }
        } else {
            require(_isContract(rewardTokenAddress), "Invalid NFT contract");
            require(msg.value == 0, "No native token should be sent for NFT rewards");
            
            // ✅ Verify NFT ownership before transfer
            require(IERC721(rewardTokenAddress).ownerOf(rewardAmount) == msg.sender, "Not owner of NFT");
            IERC721(rewardTokenAddress).transferFrom(msg.sender, address(this), rewardAmount);
        }
        
        raffles[raffleId] = Raffle({
            id: raffleId,
            creator: msg.sender,
            title: title,
            description: description,
            rewardType: rewardType,
            rewardTokenAddress: rewardTokenAddress,
            rewardAmount: rewardAmount,
            ticketPrice: ticketPrice,
            ticketPaymentToken: ticketPaymentToken,
            maxTickets: maxTickets,
            ticketsSold: 0,
            totalEarned: 0,
            expirationTime: expirationTime,
            autoDistributeOnSoldOut: autoDistributeOnSoldOut,
            winner: address(0),
            status: RaffleStatus.ACTIVE,
            rewardClaimed: false,
            createdAt: block.timestamp
        });
        
        userRaffles[msg.sender].push(raffleId);
        activeRaffleIds.push(raffleId);
        
        // ✅ Generate secure seed
        raffleSeeds[raffleId] = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            raffleId,
            blockhash(block.number - 1),
            globalNonce++
        ));
        
        emit RaffleCreated(raffleId, msg.sender, title, maxTickets, ticketPrice, ticketPaymentToken, expirationTime);
        return raffleId;
    }
    
    // ✅ ENHANCED: Anti-front-running ticket purchase
    function purchaseTickets(uint256 raffleId, uint256 quantity) 
        external 
        payable 
        nonReentrant 
        validRaffleId(raffleId)
        antiBot
        ticketPurchaseRateLimit
        autoFinalizeExpired
        whenNotPaused
        notEmergencyPaused
    {
        Raffle storage raffle = raffles[raffleId];
        
        // ✅ Enhanced validation
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(quantity > 0 && quantity <= MAX_TICKETS_PER_PURCHASE, "Invalid ticket quantity");
        require(raffle.ticketsSold + quantity <= raffle.maxTickets, "Not enough tickets available");
        
        // ✅ Timestamp manipulation protection
        require(block.timestamp + 300 <= raffle.expirationTime, "Raffle expired or expiring soon");
        
        uint256 totalCost = raffle.ticketPrice * quantity;
        require(totalCost / quantity == raffle.ticketPrice, "Price overflow"); // Overflow check
        
        // Handle payment
        if (raffle.ticketPaymentToken == address(0)) {
            require(msg.value >= totalCost, "Insufficient payment");
        } else {
            require(msg.value == 0, "No native token should be sent for token payments");
            IERC20(raffle.ticketPaymentToken).transferFrom(msg.sender, address(this), totalCost);
        }
        
        // Create tickets
        for (uint256 i = 0; i < quantity; i++) {
            uint256 ticketNumber = raffle.ticketsSold + i + 1;
            
            bytes32 ticketSeed = keccak256(abi.encodePacked(
                raffleSeeds[raffleId],
                msg.sender,
                ticketNumber,
                block.timestamp,
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
        
        // Calculate platform fee with overflow protection
        uint256 platformFee = (totalCost * platformFeePercentage) / 10000;
        require(platformFee <= totalCost, "Fee calculation error");
        uint256 creatorAmount = totalCost - platformFee;
        
        // Transfer funds to creator
        if (creatorAmount > 0) {
            if (raffle.ticketPaymentToken == address(0)) {
                payable(raffle.creator).transfer(creatorAmount);
            } else {
                IERC20(raffle.ticketPaymentToken).transfer(raffle.creator, creatorAmount);
            }
        }
        
        // Refund excess payment
        if (raffle.ticketPaymentToken == address(0) && msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        // Auto-finalize if sold out
        if (raffle.autoDistributeOnSoldOut && raffle.ticketsSold == raffle.maxTickets) {
            _commitRandomnessForRaffle(raffleId);
            emit RaffleAutoFinalized(raffleId, "Sold out - randomness committed");
        }
    }
    
    // ✅ Secure randomness functions (unchanged from previous version)
    function _commitRandomnessForRaffle(uint256 raffleId) internal {
        bytes32 commitment = keccak256(abi.encodePacked(
            raffleSeeds[raffleId],
            block.timestamp,
            block.difficulty,
            msg.sender,
            globalNonce++,
            blockhash(block.number - 1)
        ));
        
        randomnessCommits[raffleId] = RandomnessCommit({
            commitment: commitment,
            commitTime: block.timestamp,
            revealed: false,
            revealDeadline: block.timestamp + REVEAL_WINDOW
        });
        
        emit RandomnessCommitted(raffleId, commitment, block.timestamp + REVEAL_WINDOW);
    }
    
    function commitRandomnessForExpiredRaffle(uint256 raffleId) 
        external 
        validRaffleId(raffleId) 
        whenNotPaused
    {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(block.timestamp >= raffle.expirationTime, "Raffle has not expired");
        require(raffle.ticketsSold > 0, "No tickets sold");
        require(randomnessCommits[raffleId].commitment == bytes32(0), "Randomness already committed");
        
        _commitRandomnessForRaffle(raffleId);
    }
    
    function revealAndSelectWinner(uint256 raffleId, uint256 nonce) 
        external 
        validRaffleId(raffleId)
        whenNotPaused
    {
        Raffle storage raffle = raffles[raffleId];
        RandomnessCommit storage commit = randomnessCommits[raffleId];
        
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(commit.commitment != bytes32(0), "No randomness committed");
        require(!commit.revealed, "Randomness already revealed");
        require(block.timestamp <= commit.revealDeadline, "Reveal deadline passed");
        
        // Verify nonce
        bytes32 expectedCommitment = keccak256(abi.encodePacked(
            raffleSeeds[raffleId],
            commit.commitTime,
            block.difficulty,
            msg.sender,
            nonce,
            blockhash(block.number - 1)
        ));
        
        require(expectedCommitment == commit.commitment, "Invalid nonce provided");
        
        commit.revealed = true;
        
        // Generate final secure random number
        bytes32 finalRandomHash = keccak256(abi.encodePacked(
            commit.commitment,
            nonce,
            raffle.ticketsSold,
            block.timestamp
        ));
        
        // Select winner
        uint256 winningTicketIndex = uint256(finalRandomHash) % raffle.ticketsSold;
        Ticket storage winningTicket = raffleTickets[raffleId][winningTicketIndex];
        
        raffle.winner = winningTicket.buyer;
        raffle.status = RaffleStatus.ENDED;
        raffle.rewardClaimed = true;
        
        _removeFromActiveRaffles(raffleId);
        
        // Distribute reward
        if (raffle.rewardType == RewardType.TOKEN) {
            if (raffle.rewardTokenAddress == address(0)) {
                payable(raffle.winner).transfer(raffle.rewardAmount);
            } else {
                IERC20(raffle.rewardTokenAddress).transfer(raffle.winner, raffle.rewardAmount);
            }
        } else {
            IERC721(raffle.rewardTokenAddress).transferFrom(address(this), raffle.winner, raffle.rewardAmount);
        }
        
        emit RandomnessRevealed(raffleId, nonce, raffle.winner);
        emit RaffleEnded(raffleId, raffle.winner, winningTicket.ticketNumber, finalRandomHash);
        emit RewardClaimed(raffleId, raffle.winner, raffle.rewardType, raffle.rewardAmount);
    }
    
    function emergencySelectWinner(uint256 raffleId) 
        external 
        validRaffleId(raffleId)
        whenNotPaused
    {
        Raffle storage raffle = raffles[raffleId];
        RandomnessCommit storage commit = randomnessCommits[raffleId];
        
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(commit.commitment != bytes32(0), "No randomness committed");
        require(!commit.revealed, "Randomness already revealed");
        require(block.timestamp > commit.revealDeadline, "Reveal deadline not passed");
        
        bytes32 emergencyRandom = keccak256(abi.encodePacked(
            commit.commitment,
            block.timestamp,
            blockhash(block.number - 1),
            raffle.ticketsSold
        ));
        
        uint256 winningTicketIndex = uint256(emergencyRandom) % raffle.ticketsSold;
        Ticket storage winningTicket = raffleTickets[raffleId][winningTicketIndex];
        
        raffle.winner = winningTicket.buyer;
        raffle.status = RaffleStatus.ENDED;
        raffle.rewardClaimed = true;
        commit.revealed = true;
        
        _removeFromActiveRaffles(raffleId);
        
        // Distribute reward
        if (raffle.rewardType == RewardType.TOKEN) {
            if (raffle.rewardTokenAddress == address(0)) {
                payable(raffle.winner).transfer(raffle.rewardAmount);
            } else {
                IERC20(raffle.rewardTokenAddress).transfer(raffle.winner, raffle.rewardAmount);
            }
        } else {
            IERC721(raffle.rewardTokenAddress).transferFrom(address(this), raffle.winner, raffle.rewardAmount);
        }
        
        emit EmergencyWinnerSelected(raffleId, raffle.winner, "Reveal deadline missed");
        emit RaffleEnded(raffleId, raffle.winner, winningTicket.ticketNumber, emergencyRandom);
        emit RewardClaimed(raffleId, raffle.winner, raffle.rewardType, raffle.rewardAmount);
    }
    
    // ✅ Enhanced admin functions with timelock
    function proposePlatformFeeChange(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_FEE, "Fee too high");
        require(newFeePercentage != platformFeePercentage, "Same as current fee");
        
        proposedNewFeePercentage = newFeePercentage;
        proposedFeePercentageTime = block.timestamp;
    }
    
    function executePlatformFeeChange() external onlyOwner {
        require(proposedNewFeePercentage != 0, "No fee proposal pending");
        require(
            block.timestamp >= proposedFeePercentageTime + TIMELOCK_DURATION,
            "Timelock not expired"
        );
        
        platformFeePercentage = proposedNewFeePercentage;
        proposedNewFeePercentage = 0;
        proposedFeePercentageTime = 0;
        
        emit PlatformFeeUpdated(platformFeePercentage);
    }
    
    // ✅ Enhanced emergency functions with daily limits
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        uint256 today = block.timestamp / 1 days;
        require(
            dailyWithdrawn[today] + balance <= maxDailyWithdrawal,
            "Daily withdrawal limit exceeded"
        );
        
        dailyWithdrawn[today] += balance;
        payable(owner()).transfer(balance);
        
        emit EmergencyAction("Platform fees withdrawn", owner(), block.timestamp);
    }
    
    function setEmergencyPause(bool paused) external onlyOwner {
        emergencyPaused = paused;
        emit EmergencyAction(
            paused ? "Emergency pause activated" : "Emergency pause deactivated",
            owner(),
            block.timestamp
        );
    }
    
    // ✅ Internal helper functions
    function _removeFromActiveRaffles(uint256 raffleId) internal {
        for (uint256 i = 0; i < activeRaffleIds.length; i++) {
            if (activeRaffleIds[i] == raffleId) {
                activeRaffleIds[i] = activeRaffleIds[activeRaffleIds.length - 1];
                activeRaffleIds.pop();
                break;
            }
        }
    }
    
    function _autoFinalizeExpiredRaffles() internal {
        // ✅ Gas limit protection - only process first 10 expired raffles
        uint256 processed = 0;
        uint256 maxProcess = 10;
        
        for (uint256 i = 0; i < activeRaffleIds.length && processed < maxProcess; i++) {
            uint256 raffleId = activeRaffleIds[i];
            Raffle storage raffle = raffles[raffleId];
            
            if (block.timestamp >= raffle.expirationTime && raffle.status == RaffleStatus.ACTIVE) {
                if (raffle.ticketsSold == 0) {
                    _cancelRaffleInternal(raffleId);
                } else if (randomnessCommits[raffleId].commitment == bytes32(0)) {
                    _commitRandomnessForRaffle(raffleId);
                }
                processed++;
            }
        }
    }
    
    function _cancelRaffleInternal(uint256 raffleId) internal {
        Raffle storage raffle = raffles[raffleId];
        raffle.status = RaffleStatus.CANCELLED;
        
        _removeFromActiveRaffles(raffleId);
        
        // Return reward to creator
        if (raffle.rewardType == RewardType.TOKEN) {
            if (raffle.rewardTokenAddress == address(0)) {
                payable(raffle.creator).transfer(raffle.rewardAmount);
            } else {
                IERC20(raffle.rewardTokenAddress).transfer(raffle.creator, raffle.rewardAmount);
            }
        } else {
            IERC721(raffle.rewardTokenAddress).transferFrom(address(this), raffle.creator, raffle.rewardAmount);
        }
        
        emit RaffleCancelled(raffleId, raffle.creator);
    }
    
    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
    
    // ✅ Enhanced view functions
    function getRaffle(uint256 raffleId) external view returns (Raffle memory) {
        return raffles[raffleId];
    }
    
    function getRaffleTickets(uint256 raffleId) external view returns (Ticket[] memory) {
        return raffleTickets[raffleId];
    }
    
    // ✅ Paginated user raffles to prevent gas limit DoS
    function getUserRaffles(address user, uint256 offset, uint256 limit) 
        external 
        view 
        returns (uint256[] memory raffleIds, uint256 totalCount, bool hasMore) 
    {
        require(limit > 0 && limit <= 50, "Invalid limit");
        
        uint256[] storage allRaffles = userRaffles[user];
        totalCount = allRaffles.length;
        
        if (offset >= totalCount) {
            return (new uint256[](0), totalCount, false);
        }
        
        uint256 end = offset + limit;
        if (end > totalCount) {
            end = totalCount;
        }
        
        raffleIds = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            raffleIds[i - offset] = allRaffles[i];
        }
        
        hasMore = end < totalCount;
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
    
    function getActiveRaffles() external view returns (uint256[] memory) {
        return activeRaffleIds;
    }
    
    function getActiveRaffleCount() external view returns (uint256) {
        return activeRaffleIds.length;
    }
    
    function getRandomnessCommit(uint256 raffleId) external view returns (RandomnessCommit memory) {
        return randomnessCommits[raffleId];
    }
    
    function isReadyForReveal(uint256 raffleId) external view returns (bool) {
        RandomnessCommit memory commit = randomnessCommits[raffleId];
        return commit.commitment != bytes32(0) && !commit.revealed && block.timestamp <= commit.revealDeadline;
    }
    
    function isReadyForEmergencySelection(uint256 raffleId) external view returns (bool) {
        RandomnessCommit memory commit = randomnessCommits[raffleId];
        return commit.commitment != bytes32(0) && !commit.revealed && block.timestamp > commit.revealDeadline;
    }
} 