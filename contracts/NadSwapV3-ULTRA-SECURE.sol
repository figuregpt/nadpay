// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract NadSwapV3 is ReentrancyGuard, Ownable2Step, Pausable {
    
    struct Asset {
        address contractAddress; // address(0) for native MON
        uint256 amount; // amount for ERC20/native, tokenId for ERC721
        uint256 tokenId; // only used for NFTs
        bool isNFT;
    }
    
    struct SwapProposal {
        uint256 id;
        address proposer;
        address targetWallet;
        Asset[] offeredAssets;
        Asset[] requestedAssets;
        uint256 deadline;
        bool isActive;
        bool isAccepted;
        bool isExpired;
        uint256 createdAt;
    }
    
    // State variables
    mapping(uint256 => SwapProposal) public proposals;
    mapping(address => uint256[]) public userProposals;
    mapping(address => uint256[]) public userReceivedProposals;
    
    uint256 public proposalCounter;
    uint256 public proposalFee = 0.001 ether;
    uint256 public proposalDuration = 7 days;
    
    // ✅ Enhanced fee tracking
    uint256 public totalCollectedFees;
    mapping(uint256 => uint256) public escrowedNativeMON;
    
    // ✅ NEW: Enhanced security features
    uint256 public constant MAX_ASSETS_PER_PROPOSAL = 20; // Gas limit protection
    uint256 public constant MIN_PROPOSAL_DURATION = 1 hours;
    uint256 public constant MAX_PROPOSAL_DURATION = 30 days;
    uint256 public constant MAX_PROPOSAL_FEE = 1 ether;
    uint256 public constant TIMELOCK_DURATION = 2 days;
    
    // ✅ Front-running protection
    mapping(address => uint256) public lastProposalBlock;
    mapping(address => uint256) public lastAcceptanceBlock;
    uint256 public constant PROPOSAL_COOLDOWN_BLOCKS = 2;
    uint256 public constant ACCEPTANCE_COOLDOWN_BLOCKS = 1;
    
    // ✅ Emergency controls
    bool public emergencyPaused = false;
    uint256 public maxDailyWithdrawal = 50 ether;
    mapping(uint256 => uint256) public dailyWithdrawn;
    
    // ✅ Anti-centralization
    address public proposedFeeRecipient;
    uint256 public proposedFeeRecipientTime;
    uint256 public proposedNewFee;
    uint256 public proposedFeeTime;
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed targetWallet, uint256 deadline);
    event ProposalAccepted(uint256 indexed proposalId, address indexed proposer, address indexed accepter);
    event ProposalCancelled(uint256 indexed proposalId, address indexed proposer);
    event ProposalExpired(uint256 indexed proposalId, address indexed proposer);
    event AssetsWithdrawn(uint256 indexed proposalId, address indexed user);
    event FeesWithdrawn(uint256 amount, uint256 remainingEscrow);
    event EmergencyAction(string action, address indexed actor, uint256 timestamp);
    
    // ✅ Enhanced modifiers
    modifier antiBot() {
        require(tx.origin == msg.sender, "No contract calls allowed");
        _;
    }
    
    modifier proposalRateLimit() {
        require(
            lastProposalBlock[msg.sender] + PROPOSAL_COOLDOWN_BLOCKS <= block.number,
            "Proposal rate limit exceeded"
        );
        lastProposalBlock[msg.sender] = block.number;
        _;
    }
    
    modifier acceptanceRateLimit() {
        require(
            lastAcceptanceBlock[msg.sender] + ACCEPTANCE_COOLDOWN_BLOCKS <= block.number,
            "Acceptance rate limit exceeded"
        );
        lastAcceptanceBlock[msg.sender] = block.number;
        _;
    }
    
    modifier notEmergencyPaused() {
        require(!emergencyPaused, "Emergency pause active");
        _;
    }

    constructor() Ownable(msg.sender) {}
    
    // ✅ ENHANCED: Input validation and anti-DoS
    function createProposal(
        address _targetWallet,
        Asset[] memory _offeredAssets,
        Asset[] memory _requestedAssets
    ) external payable nonReentrant antiBot proposalRateLimit whenNotPaused notEmergencyPaused {
        // ✅ Enhanced validation
        require(_targetWallet != address(0), "Invalid target wallet");
        require(_targetWallet != msg.sender, "Cannot propose to yourself");
        require(_offeredAssets.length > 0 && _offeredAssets.length <= MAX_ASSETS_PER_PROPOSAL, "Invalid offered assets count");
        require(_requestedAssets.length > 0 && _requestedAssets.length <= MAX_ASSETS_PER_PROPOSAL, "Invalid requested assets count");
        require(msg.value >= proposalFee, "Insufficient proposal fee");
        
        // ✅ Validate assets
        _validateAssets(_offeredAssets);
        _validateAssets(_requestedAssets);
        
        proposalCounter++;
        uint256 deadline = block.timestamp + proposalDuration;
        
        SwapProposal storage newProposal = proposals[proposalCounter];
        newProposal.id = proposalCounter;
        newProposal.proposer = msg.sender;
        newProposal.targetWallet = _targetWallet;
        newProposal.deadline = deadline;
        newProposal.isActive = true;
        newProposal.isAccepted = false;
        newProposal.isExpired = false;
        newProposal.createdAt = block.timestamp;
        
        // Store assets
        for (uint256 i = 0; i < _offeredAssets.length; i++) {
            newProposal.offeredAssets.push(_offeredAssets[i]);
        }
        for (uint256 i = 0; i < _requestedAssets.length; i++) {
            newProposal.requestedAssets.push(_requestedAssets[i]);
        }
        
        userProposals[msg.sender].push(proposalCounter);
        userReceivedProposals[_targetWallet].push(proposalCounter);
        
        totalCollectedFees += proposalFee;
        
        // Calculate and escrow native MON
        uint256 requiredNativeMON = proposalFee;
        for (uint256 i = 0; i < _offeredAssets.length; i++) {
            if (!_offeredAssets[i].isNFT && _offeredAssets[i].contractAddress == address(0)) {
                requiredNativeMON += _offeredAssets[i].amount;
            }
        }
        
        require(msg.value >= requiredNativeMON, "Insufficient MON for offered assets and fee");
        
        uint256 escrowedForThisProposal = requiredNativeMON - proposalFee;
        if (escrowedForThisProposal > 0) {
            escrowedNativeMON[proposalCounter] = escrowedForThisProposal;
        }
        
        // Transfer offered assets to escrow
        for (uint256 i = 0; i < _offeredAssets.length; i++) {
            Asset memory asset = _offeredAssets[i];
            
            if (asset.isNFT) {
                IERC721(asset.contractAddress).transferFrom(msg.sender, address(this), asset.tokenId);
            } else if (asset.contractAddress != address(0)) {
                IERC20(asset.contractAddress).transferFrom(msg.sender, address(this), asset.amount);
            }
        }
        
        if (msg.value > requiredNativeMON) {
            payable(msg.sender).transfer(msg.value - requiredNativeMON);
        }
        
        emit ProposalCreated(proposalCounter, msg.sender, _targetWallet, deadline);
    }
    
    // ✅ ENHANCED: Anti-front-running acceptance
    function acceptProposal(uint256 _proposalId) external payable nonReentrant antiBot acceptanceRateLimit whenNotPaused notEmergencyPaused {
        SwapProposal storage proposal = proposals[_proposalId];
        
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.isActive, "Proposal is not active");
        require(!proposal.isExpired, "Proposal has expired");
        require(msg.sender == proposal.targetWallet, "Only target wallet can accept");
        
        // ✅ Timestamp manipulation protection
        require(block.timestamp + 300 <= proposal.deadline, "Proposal deadline too close");
        
        uint256 requiredNativeMON = 0;
        for (uint256 i = 0; i < proposal.requestedAssets.length; i++) {
            if (!proposal.requestedAssets[i].isNFT && 
                proposal.requestedAssets[i].contractAddress == address(0)) {
                requiredNativeMON += proposal.requestedAssets[i].amount;
            }
        }
        
        require(msg.value >= requiredNativeMON, "Insufficient MON sent");
        
        // Transfer requested assets from accepter to proposer
        for (uint256 i = 0; i < proposal.requestedAssets.length; i++) {
            Asset memory asset = proposal.requestedAssets[i];
            
            if (asset.isNFT) {
                IERC721(asset.contractAddress).transferFrom(msg.sender, proposal.proposer, asset.tokenId);
            } else if (asset.contractAddress != address(0)) {
                IERC20(asset.contractAddress).transferFrom(msg.sender, proposal.proposer, asset.amount);
            } else {
                payable(proposal.proposer).transfer(asset.amount);
            }
        }
        
        // Transfer offered assets from escrow to accepter
        for (uint256 i = 0; i < proposal.offeredAssets.length; i++) {
            Asset memory asset = proposal.offeredAssets[i];
            
            if (asset.isNFT) {
                IERC721(asset.contractAddress).transferFrom(address(this), msg.sender, asset.tokenId);
            } else if (asset.contractAddress != address(0)) {
                IERC20(asset.contractAddress).transfer(msg.sender, asset.amount);
            } else {
                payable(msg.sender).transfer(asset.amount);
            }
        }
        
        escrowedNativeMON[_proposalId] = 0;
        proposal.isActive = false;
        proposal.isAccepted = true;
        
        if (msg.value > requiredNativeMON) {
            payable(msg.sender).transfer(msg.value - requiredNativeMON);
        }
        
        emit ProposalAccepted(_proposalId, proposal.proposer, msg.sender);
    }
    
    // Rest of functions remain similar with enhanced validation...
    function cancelProposal(uint256 _proposalId) external nonReentrant whenNotPaused {
        SwapProposal storage proposal = proposals[_proposalId];
        
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.isActive, "Proposal is not active");
        require(msg.sender == proposal.proposer, "Only proposer can cancel");
        
        _returnEscrowedAssets(_proposalId);
        proposal.isActive = false;
        
        emit ProposalCancelled(_proposalId, proposal.proposer);
    }
    
    function expireProposal(uint256 _proposalId) external nonReentrant {
        SwapProposal storage proposal = proposals[_proposalId];
        
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.isActive, "Proposal is not active");
        require(block.timestamp > proposal.deadline, "Proposal has not expired yet");
        
        _returnEscrowedAssets(_proposalId);
        proposal.isActive = false;
        proposal.isExpired = true;
        
        emit ProposalExpired(_proposalId, proposal.proposer);
    }
    
    function _returnEscrowedAssets(uint256 _proposalId) internal {
        SwapProposal storage proposal = proposals[_proposalId];
        
        for (uint256 i = 0; i < proposal.offeredAssets.length; i++) {
            Asset memory asset = proposal.offeredAssets[i];
            
            if (asset.isNFT) {
                IERC721(asset.contractAddress).transferFrom(address(this), proposal.proposer, asset.tokenId);
            } else if (asset.contractAddress != address(0)) {
                IERC20(asset.contractAddress).transfer(proposal.proposer, asset.amount);
            } else {
                payable(proposal.proposer).transfer(asset.amount);
            }
        }
        
        escrowedNativeMON[_proposalId] = 0;
        emit AssetsWithdrawn(_proposalId, proposal.proposer);
    }
    
    // ✅ Enhanced validation function
    function _validateAssets(Asset[] memory assets) internal view {
        for (uint256 i = 0; i < assets.length; i++) {
            Asset memory asset = assets[i];
            
            if (asset.isNFT) {
                require(asset.contractAddress != address(0), "Invalid NFT contract");
                require(_isContract(asset.contractAddress), "NFT contract does not exist");
                require(asset.amount == asset.tokenId, "NFT amount should equal tokenId");
            } else {
                require(asset.amount > 0, "Asset amount must be positive");
                if (asset.contractAddress != address(0)) {
                    require(_isContract(asset.contractAddress), "Token contract does not exist");
                }
            }
        }
    }
    
    // ✅ Enhanced fee withdrawal with daily limits
    function withdrawFees() external onlyOwner {
        require(totalCollectedFees > 0, "No fees to withdraw");
        
        uint256 contractBalance = address(this).balance;
        uint256 totalEscrowed = getTotalEscrowedMON();
        
        require(contractBalance >= totalEscrowed, "Insufficient balance to maintain escrow");
        
        uint256 availableForWithdrawal = contractBalance - totalEscrowed;
        uint256 withdrawAmount = totalCollectedFees;
        
        if (withdrawAmount > availableForWithdrawal) {
            withdrawAmount = availableForWithdrawal;
        }
        
        // ✅ Daily withdrawal limit
        uint256 today = block.timestamp / 1 days;
        require(
            dailyWithdrawn[today] + withdrawAmount <= maxDailyWithdrawal,
            "Daily withdrawal limit exceeded"
        );
        
        require(withdrawAmount > 0, "No funds available for withdrawal");
        
        totalCollectedFees -= withdrawAmount;
        dailyWithdrawn[today] += withdrawAmount;
        
        payable(owner()).transfer(withdrawAmount);
        
        emit FeesWithdrawn(withdrawAmount, totalEscrowed);
    }
    
    // ✅ Anti-centralization functions
    function proposeNewFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_PROPOSAL_FEE, "Fee too high");
        require(newFee != proposalFee, "Same as current fee");
        
        proposedNewFee = newFee;
        proposedFeeTime = block.timestamp;
    }
    
    function executeNewFee() external onlyOwner {
        require(proposedNewFee != 0, "No fee proposal pending");
        require(
            block.timestamp >= proposedFeeTime + TIMELOCK_DURATION,
            "Timelock not expired"
        );
        
        proposalFee = proposedNewFee;
        proposedNewFee = 0;
        proposedFeeTime = 0;
    }
    
    // View functions
    function getTotalEscrowedMON() public view returns (uint256) {
        uint256 totalEscrowed = 0;
        for (uint256 i = 1; i <= proposalCounter; i++) {
            totalEscrowed += escrowedNativeMON[i];
        }
        return totalEscrowed;
    }
    
    function getProposal(uint256 _proposalId) external view returns (
        uint256 id,
        address proposer,
        address targetWallet,
        uint256 deadline,
        bool isActive,
        bool isAccepted,
        bool isExpired,
        uint256 createdAt
    ) {
        SwapProposal storage proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.targetWallet,
            proposal.deadline,
            proposal.isActive,
            proposal.isAccepted,
            proposal.isExpired,
            proposal.createdAt
        );
    }
    
    function getProposalAssets(uint256 _proposalId) external view returns (
        Asset[] memory offeredAssets,
        Asset[] memory requestedAssets
    ) {
        SwapProposal storage proposal = proposals[_proposalId];
        return (proposal.offeredAssets, proposal.requestedAssets);
    }
    
    // ✅ Paginated user proposals to prevent gas limit DoS
    function getUserProposals(address _user, uint256 offset, uint256 limit) 
        external 
        view 
        returns (uint256[] memory proposalIds, uint256 totalCount, bool hasMore) 
    {
        require(limit > 0 && limit <= 50, "Invalid limit");
        
        uint256[] storage allProposals = userProposals[_user];
        totalCount = allProposals.length;
        
        if (offset >= totalCount) {
            return (new uint256[](0), totalCount, false);
        }
        
        uint256 end = offset + limit;
        if (end > totalCount) {
            end = totalCount;
        }
        
        proposalIds = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            proposalIds[i - offset] = allProposals[i];
        }
        
        hasMore = end < totalCount;
    }
    
    function getTotalProposals() external view returns (uint256) {
        return proposalCounter;
    }
    
    // ✅ Emergency functions
    function setEmergencyPause(bool paused) external onlyOwner {
        emergencyPaused = paused;
        emit EmergencyAction(
            paused ? "Emergency pause activated" : "Emergency pause deactivated",
            owner(),
            block.timestamp
        );
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
} 