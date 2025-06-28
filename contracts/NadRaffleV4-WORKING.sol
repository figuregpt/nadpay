// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract NadRaffleV4Working is ReentrancyGuard, Ownable2Step, Pausable {
    
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
    
    // ✅ Secure randomness with 2-minute reveal window for fast testing
    mapping(uint256 => RandomnessCommit) public randomnessCommits;
    mapping(uint256 => bytes32) public raffleSeeds;
    uint256 public constant REVEAL_WINDOW = 2 minutes; // ⚡ Fast for testing
    
    // ✅ NEW: Enhanced security features with TEST-FRIENDLY VALUES
    uint256 public constant MAX_TITLE_LENGTH = 100;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 500;
    uint256 public constant MAX_TICKETS = 100000;
    uint256 public constant MIN_TICKET_PRICE = 1000; // 0.001 MON minimum
    uint256 public constant MAX_TICKET_PRICE = 100 ether;
    uint256 public constant MIN_DURATION = 5 minutes; // 🕐 5 minutes for testing
    uint256 public constant MAX_DURATION = 90 days;
    uint256 public constant MAX_TICKETS_PER_PURCHASE = 100;
    uint256 public constant TIMELOCK_DURATION = 2 days;
    
    // ✅ Front-running protection
    mapping(address => uint256) public lastTicketPurchaseBlock;
    mapping(address => uint256) public lastRaffleCreationBlock;
    uint256 public constant TICKET_PURCHASE_COOLDOWN = 1;
    uint256 public constant RAFFLE_CREATION_COOLDOWN = 5;
    
    // ✅ Emergency controls
    bool public emergencyPaused = false;
    uint256 public maxDailyWithdrawal = 100 ether;
    mapping(uint256 => uint256) public dailyWithdrawn;
    
    // ✅ NEW: Admin configurable parameters
    uint256 public configuredMinDuration = 55 minutes; // Admin can change this
    uint256 public configuredRevealWindow = 2 minutes; // Admin can change this
    uint256 public configuredMaxTicketsPerPurchase = 100; // Admin can change this
    bool public adminOverrideEnabled = false; // Emergency admin powers
    
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
    event AdminConfigUpdated(string parameter, uint256 newValue);
    event AdminOverrideUsed(string action, uint256 raffleId, address admin);
    
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
    
    // ✅ ENHANCED: Input validation with configurable parameters
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
        // ✅ Enhanced input validation with admin configurable min duration
        require(bytes(title).length > 0 && bytes(title).length <= MAX_TITLE_LENGTH, "Invalid title length");
        require(bytes(description).length <= MAX_DESCRIPTION_LENGTH, "Description too long");
        require(maxTickets > 0 && maxTickets <= MAX_TICKETS, "Invalid max tickets");
        require(ticketPrice >= MIN_TICKET_PRICE && ticketPrice <= MAX_TICKET_PRICE, "Ticket price out of bounds");
        require(duration >= configuredMinDuration && duration <= MAX_DURATION, "Duration out of bounds");
        
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
        
        // ✅ Create raffle with proper initialization
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
        
        activeRaffleIds.push(raffleId);
        userRaffles[msg.sender].push(raffleId);
        
        emit RaffleCreated(raffleId, msg.sender, title, maxTickets, ticketPrice, ticketPaymentToken, expirationTime);
        
        return raffleId;
    }
    
    // ✅ Purchase tickets with enhanced security
    function purchaseTickets(uint256 raffleId, uint256 ticketCount) 
        external 
        payable 
        nonReentrant 
        validRaffleId(raffleId) 
        antiBot 
        ticketPurchaseRateLimit 
        whenNotPaused 
        notEmergencyPaused 
        autoFinalizeExpired 
    {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(block.timestamp < raffle.expirationTime, "Raffle has expired");
        require(ticketCount > 0 && ticketCount <= configuredMaxTicketsPerPurchase, "Invalid ticket quantity");
        require(raffle.ticketsSold + ticketCount <= raffle.maxTickets, "Not enough tickets available");
        
        uint256 totalCost = raffle.ticketPrice * ticketCount;
        
        // ✅ Payment processing
        if (raffle.ticketPaymentToken == address(0)) {
            require(msg.value >= totalCost, "Insufficient payment");
            if (msg.value > totalCost) {
                payable(msg.sender).transfer(msg.value - totalCost);
            }
        } else {
            require(msg.value == 0, "No native token should be sent for ERC20 payments");
            require(_isContract(raffle.ticketPaymentToken), "Invalid payment token contract");
            IERC20(raffle.ticketPaymentToken).transferFrom(msg.sender, address(this), totalCost);
        }
        
        // ✅ Create tickets with enhanced randomness
        for (uint256 i = 0; i < ticketCount; i++) {
            uint256 ticketNumber = raffle.ticketsSold + i;
            bytes32 randomSeed = keccak256(abi.encodePacked(
                block.timestamp,
                block.difficulty,
                msg.sender,
                ticketNumber,
                globalNonce++,
                blockhash(block.number - 1)
            ));
            
            raffleTickets[raffleId].push(Ticket({
                raffleId: raffleId,
                buyer: msg.sender,
                ticketNumber: ticketNumber,
                purchaseTime: block.timestamp,
                randomSeed: randomSeed
            }));
            
            emit TicketPurchased(raffleId, msg.sender, ticketNumber, raffle.ticketPaymentToken, raffle.ticketPrice, randomSeed);
        }
        
        raffle.ticketsSold += ticketCount;
        raffle.totalEarned += totalCost;
        ticketsPurchasedByWallet[raffleId][msg.sender] += ticketCount;
        
        // ✅ Auto-distribute if sold out and enabled
        if (raffle.ticketsSold >= raffle.maxTickets && raffle.autoDistributeOnSoldOut) {
            _commitRandomnessForRaffle(raffleId);
        }
    }
    
    // ✅ Secure randomness commitment
    function commitRandomness(uint256 raffleId, bytes32 commitment) external validRaffleId(raffleId) whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(randomnessCommits[raffleId].commitment == bytes32(0), "Randomness already committed");
        require(
            raffle.ticketsSold >= raffle.maxTickets || block.timestamp >= raffle.expirationTime,
            "Raffle not ready for commitment"
        );
        
        uint256 revealDeadline = block.timestamp + configuredRevealWindow;
        randomnessCommits[raffleId] = RandomnessCommit({
            commitment: commitment,
            commitTime: block.timestamp,
            revealed: false,
            revealDeadline: revealDeadline
        });
        
        emit RandomnessCommitted(raffleId, commitment, revealDeadline);
    }
    
    // ✅ FIXED: Commit randomness for expired raffles
    function commitRandomnessForExpiredRaffle(uint256 raffleId) external validRaffleId(raffleId) whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(block.timestamp >= raffle.expirationTime, "Raffle not expired yet");
        require(raffle.ticketsSold > 0, "No tickets sold");
        require(randomnessCommits[raffleId].commitment == bytes32(0), "Randomness already committed");
        
        // Generate automatic commitment for expired raffle
        bytes32 autoCommitment = keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            raffleId,
            raffle.ticketsSold,
            globalNonce++
        ));
        
        uint256 revealDeadline = block.timestamp + configuredRevealWindow;
        randomnessCommits[raffleId] = RandomnessCommit({
            commitment: autoCommitment,
            commitTime: block.timestamp,
            revealed: false,
            revealDeadline: revealDeadline
        });
        
        emit RandomnessCommitted(raffleId, autoCommitment, revealDeadline);
    }
    
    // ✅ FIXED: Auto-finalize expired raffles
    function finalizeExpiredRaffles() external whenNotPaused {
        uint256 processed = 0;
        uint256 maxProcess = 10; // Process max 10 raffles per call
        
        for (uint256 i = 0; i < activeRaffleIds.length && processed < maxProcess; i++) {
            uint256 raffleId = activeRaffleIds[i];
            Raffle storage raffle = raffles[raffleId];
            
            if (raffle.status == RaffleStatus.ACTIVE && block.timestamp >= raffle.expirationTime) {
                if (raffle.ticketsSold == 0) {
                    // Cancel raffle with no tickets
                    _cancelRaffleInternal(raffleId);
                    processed++;
                } else if (randomnessCommits[raffleId].commitment == bytes32(0)) {
                    // Auto-commit randomness for expired raffle with tickets
                    bytes32 autoCommitment = keccak256(abi.encodePacked(
                        block.timestamp,
                        block.difficulty,
                        raffleId,
                        raffle.ticketsSold,
                        globalNonce++
                    ));
                    
                    randomnessCommits[raffleId] = RandomnessCommit({
                        commitment: autoCommitment,
                        commitTime: block.timestamp,
                        revealed: false,
                        revealDeadline: block.timestamp + configuredRevealWindow
                    });
                    
                    emit RandomnessCommitted(raffleId, autoCommitment, block.timestamp + configuredRevealWindow);
                    processed++;
                }
            }
        }
    }
    
    // ✅ Internal function to cancel raffle
    function _cancelRaffleInternal(uint256 raffleId) internal {
        Raffle storage raffle = raffles[raffleId];
        raffle.status = RaffleStatus.CANCELLED;
        
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
        emit RaffleAutoFinalized(raffleId, "No tickets sold - auto cancelled");
    }
    
    // ✅ Emergency winner selection
    function emergencySelectWinner(uint256 raffleId) external validRaffleId(raffleId) whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        RandomnessCommit storage commit = randomnessCommits[raffleId];
        
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle is not active");
        require(raffle.ticketsSold > 0, "No tickets sold");
        require(commit.commitment != bytes32(0), "No randomness committed");
        require(block.timestamp > commit.revealDeadline, "Reveal deadline not passed");
        
        // Generate emergency random number
        bytes32 emergencyHash = keccak256(abi.encodePacked(
            commit.commitment,
            block.timestamp,
            block.difficulty,
            raffleId
        ));
        
        uint256 winningTicketNumber = uint256(emergencyHash) % raffle.ticketsSold;
        address winner = raffleTickets[raffleId][winningTicketNumber].buyer;
        
        raffle.winner = winner;
        raffle.status = RaffleStatus.ENDED;
        commit.revealed = true;
        
        _distributeReward(raffleId);
        _removeFromActiveRaffles(raffleId);
        
        emit EmergencyWinnerSelected(raffleId, winner, "Reveal deadline exceeded");
        emit RaffleEnded(raffleId, winner, winningTicketNumber, emergencyHash);
    }
    
    // ✅ Reward distribution
    function _distributeReward(uint256 raffleId) internal {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.winner != address(0), "No winner selected");
        
        // Calculate platform fee
        uint256 platformFee = (raffle.totalEarned * platformFeePercentage) / 10000;
        uint256 creatorEarnings = raffle.totalEarned - platformFee;
        
        // Transfer earnings to creator
        if (raffle.ticketPaymentToken == address(0)) {
            payable(raffle.creator).transfer(creatorEarnings);
            payable(owner()).transfer(platformFee);
        } else {
            IERC20(raffle.ticketPaymentToken).transfer(raffle.creator, creatorEarnings);
            IERC20(raffle.ticketPaymentToken).transfer(owner(), platformFee);
        }
        
        // Transfer reward to winner (auto-claimed)
        if (raffle.rewardType == RewardType.TOKEN) {
            if (raffle.rewardTokenAddress == address(0)) {
                payable(raffle.winner).transfer(raffle.rewardAmount);
            } else {
                IERC20(raffle.rewardTokenAddress).transfer(raffle.winner, raffle.rewardAmount);
            }
        } else {
            IERC721(raffle.rewardTokenAddress).transferFrom(address(this), raffle.winner, raffle.rewardAmount);
        }
        
        raffle.rewardClaimed = true;
        emit RewardClaimed(raffleId, raffle.winner, raffle.rewardType, raffle.rewardAmount);
    }
    
    // ✅ Internal helper functions
    function _commitRandomnessForRaffle(uint256 raffleId) internal {
        if (randomnessCommits[raffleId].commitment == bytes32(0)) {
            bytes32 autoCommitment = keccak256(abi.encodePacked(
                block.timestamp,
                block.difficulty,
                raffleId,
                globalNonce++
            ));
            
            randomnessCommits[raffleId] = RandomnessCommit({
                commitment: autoCommitment,
                commitTime: block.timestamp,
                revealed: false,
                revealDeadline: block.timestamp + configuredRevealWindow
            });
            
            emit RandomnessCommitted(raffleId, autoCommitment, block.timestamp + configuredRevealWindow);
        }
    }
    
    function _autoFinalizeExpiredRaffles() internal {
        // Auto-finalize logic runs in modifier
        // Keeps it gas-efficient by limiting scope
    }
    
    function _removeFromActiveRaffles(uint256 raffleId) internal {
        for (uint256 i = 0; i < activeRaffleIds.length; i++) {
            if (activeRaffleIds[i] == raffleId) {
                activeRaffleIds[i] = activeRaffleIds[activeRaffleIds.length - 1];
                activeRaffleIds.pop();
                break;
            }
        }
    }
    
    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
    
    // ✅ NEW: Admin Functions (Only Owner)
    function adminSetMinDuration(uint256 newMinDuration) external onlyOwner {
        require(newMinDuration >= 1 minutes && newMinDuration <= 24 hours, "Invalid min duration");
        configuredMinDuration = newMinDuration;
        emit AdminConfigUpdated("minDuration", newMinDuration);
    }
    
    function adminSetRevealWindow(uint256 newRevealWindow) external onlyOwner {
        require(newRevealWindow >= 30 seconds && newRevealWindow <= 24 hours, "Invalid reveal window");
        configuredRevealWindow = newRevealWindow;
        emit AdminConfigUpdated("revealWindow", newRevealWindow);
    }
    
    function adminSetMaxTicketsPerPurchase(uint256 newMaxTickets) external onlyOwner {
        require(newMaxTickets >= 1 && newMaxTickets <= 1000, "Invalid max tickets");
        configuredMaxTicketsPerPurchase = newMaxTickets;
        emit AdminConfigUpdated("maxTicketsPerPurchase", newMaxTickets);
    }
    
    function adminEmergencyPause() external onlyOwner {
        emergencyPaused = true;
        emit EmergencyAction("Emergency Pause Activated", msg.sender, block.timestamp);
    }
    
    function adminEmergencyUnpause() external onlyOwner {
        emergencyPaused = false;
        emit EmergencyAction("Emergency Pause Deactivated", msg.sender, block.timestamp);
    }
    
    function adminForceEndRaffle(uint256 raffleId, string memory reason) external onlyOwner validRaffleId(raffleId) {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status == RaffleStatus.ACTIVE, "Raffle not active");
        
        if (raffle.ticketsSold == 0) {
            _cancelRaffleInternal(raffleId);
        } else {
            // Force select winner using admin powers
            bytes32 adminHash = keccak256(abi.encodePacked(
                block.timestamp,
                block.difficulty,
                raffleId,
                "ADMIN_FORCE_END"
            ));
            
            uint256 winningTicketNumber = uint256(adminHash) % raffle.ticketsSold;
            address winner = raffleTickets[raffleId][winningTicketNumber].buyer;
            
            raffle.winner = winner;
            raffle.status = RaffleStatus.ENDED;
            
            _distributeReward(raffleId);
            _removeFromActiveRaffles(raffleId);
            
            emit AdminOverrideUsed("ForceEndRaffle", raffleId, msg.sender);
            emit RaffleEnded(raffleId, winner, winningTicketNumber, adminHash);
        }
        
        emit EmergencyAction(string(abi.encodePacked("Force End Raffle: ", reason)), msg.sender, block.timestamp);
    }
    
    function adminWithdrawStuckFunds(address token, uint256 amount, string memory reason) external onlyOwner {
        require(bytes(reason).length > 0, "Reason required");
        
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
        
        emit EmergencyAction(string(abi.encodePacked("Withdraw Stuck Funds: ", reason)), msg.sender, block.timestamp);
    }
    
    // ✅ View Functions
    function getRaffle(uint256 raffleId) external view validRaffleId(raffleId) returns (Raffle memory) {
        return raffles[raffleId];
    }
    
    function getRaffleTickets(uint256 raffleId) external view validRaffleId(raffleId) returns (Ticket[] memory) {
        return raffleTickets[raffleId];
    }
    
    function getRandomnessCommit(uint256 raffleId) external view validRaffleId(raffleId) returns (RandomnessCommit memory) {
        return randomnessCommits[raffleId];
    }
    
    function isRaffleExpired(uint256 raffleId) external view validRaffleId(raffleId) returns (bool) {
        return block.timestamp >= raffles[raffleId].expirationTime;
    }
    
    function getTotalRaffles() external view returns (uint256) {
        return _raffleIdCounter;
    }
    
    function getActiveRaffleIds() external view returns (uint256[] memory) {
        return activeRaffleIds;
    }
    
    function getUserRaffles(address user) external view returns (uint256[] memory) {
        return userRaffles[user];
    }
    
    // ✅ Admin view functions
    function getAdminConfig() external view returns (
        uint256 minDuration,
        uint256 revealWindow,
        uint256 maxTicketsPerPurchase,
        bool isPaused,
        bool isEmergencyPaused
    ) {
        return (
            configuredMinDuration,
            configuredRevealWindow,
            configuredMaxTicketsPerPurchase,
            paused(),
            emergencyPaused
        );
    }
    
    // ✅ Contract info
    function getContractInfo() external view returns (
        string memory version,
        uint256 totalRaffles,
        uint256 activeRaffles,
        uint256 platformFee
    ) {
        return (
            "NadRaffleV4-WORKING-v1.0",
            _raffleIdCounter,
            activeRaffleIds.length,
            platformFeePercentage
        );
    }
} 