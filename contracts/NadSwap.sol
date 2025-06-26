// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract NadSwap {
    uint256 public constant PROPOSAL_DURATION = 1 hours;
    uint256 public proposalFee = 0.1 ether; // 0.1 MON
    uint256 public nextProposalId = 1;
    address public owner;
    
    // Reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    struct Asset {
        address contractAddress;
        uint256 tokenId; // For NFTs
        uint256 amount; // For ERC20 tokens (0 for NFTs)
        bool isNFT;
    }
    
    struct Proposal {
        uint256 id;
        address proposer;
        address targetWallet;
        Asset[] offeredAssets;
        Asset[] requestedAssets;
        uint256 deadline;
        bool isActive;
        bool isAccepted;
        bool isExpired;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256[]) public userProposals;
    mapping(address => uint256[]) public userReceivedProposals;
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed targetWallet,
        uint256 deadline
    );
    
    event ProposalAccepted(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed accepter
    );
    
    event ProposalCancelled(
        uint256 indexed proposalId,
        address indexed proposer
    );
    
    event ProposalExpired(
        uint256 indexed proposalId,
        address indexed proposer
    );
    
    constructor() {
        owner = msg.sender;
        _status = _NOT_ENTERED;
    }
    
    function createProposal(
        address _targetWallet,
        Asset[] memory _offeredAssets,
        Asset[] memory _requestedAssets
    ) external payable nonReentrant {
        require(msg.value >= proposalFee, "Insufficient proposal fee");
        require(_targetWallet != address(0), "Invalid target wallet");
        require(_targetWallet != msg.sender, "Cannot propose to yourself");
        require(_offeredAssets.length > 0, "Must offer at least one asset");
        require(_requestedAssets.length > 0, "Must request at least one asset");
        
        uint256 proposalId = nextProposalId++;
        
        // Transfer offered assets to escrow
        for (uint256 i = 0; i < _offeredAssets.length; i++) {
            Asset memory asset = _offeredAssets[i];
            
            if (asset.isNFT) {
                require(asset.amount == 0, "NFT amount should be 0");
                IERC721(asset.contractAddress).transferFrom(
                    msg.sender,
                    address(this),
                    asset.tokenId
                );
            } else {
                require(asset.tokenId == 0, "Token ID should be 0 for ERC20");
                require(asset.amount > 0, "Token amount must be greater than 0");
                IERC20(asset.contractAddress).transferFrom(
                    msg.sender,
                    address(this),
                    asset.amount
                );
            }
        }
        
        // Create proposal
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.targetWallet = _targetWallet;
        proposal.deadline = block.timestamp + PROPOSAL_DURATION;
        proposal.isActive = true;
        proposal.isAccepted = false;
        proposal.isExpired = false;
        
        // Copy assets
        for (uint256 i = 0; i < _offeredAssets.length; i++) {
            proposal.offeredAssets.push(_offeredAssets[i]);
        }
        for (uint256 i = 0; i < _requestedAssets.length; i++) {
            proposal.requestedAssets.push(_requestedAssets[i]);
        }
        
        // Update mappings
        userProposals[msg.sender].push(proposalId);
        userReceivedProposals[_targetWallet].push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, _targetWallet, proposal.deadline);
    }
    
    function acceptProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.targetWallet == msg.sender, "Not authorized to accept");
        require(proposal.isActive, "Proposal not active");
        require(!proposal.isExpired, "Proposal expired");
        require(block.timestamp <= proposal.deadline, "Proposal deadline passed");
        
        // Transfer requested assets from accepter to proposer
        for (uint256 i = 0; i < proposal.requestedAssets.length; i++) {
            Asset memory asset = proposal.requestedAssets[i];
            
            if (asset.isNFT) {
                IERC721(asset.contractAddress).transferFrom(
                    msg.sender,
                    proposal.proposer,
                    asset.tokenId
                );
            } else {
                IERC20(asset.contractAddress).transferFrom(
                    msg.sender,
                    proposal.proposer,
                    asset.amount
                );
            }
        }
        
        // Transfer offered assets from escrow to accepter
        for (uint256 i = 0; i < proposal.offeredAssets.length; i++) {
            Asset memory asset = proposal.offeredAssets[i];
            
            if (asset.isNFT) {
                IERC721(asset.contractAddress).transferFrom(
                    address(this),
                    msg.sender,
                    asset.tokenId
                );
            } else {
                IERC20(asset.contractAddress).transferFrom(
                    address(this),
                    msg.sender,
                    asset.amount
                );
            }
        }
        
        // Update proposal status
        proposal.isActive = false;
        proposal.isAccepted = true;
        
        emit ProposalAccepted(_proposalId, proposal.proposer, msg.sender);
    }
    
    function cancelProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.proposer == msg.sender, "Not authorized to cancel");
        require(proposal.isActive, "Proposal not active");
        require(!proposal.isExpired, "Proposal already expired");
        
        // Return offered assets to proposer
        _returnAssetsToProposer(_proposalId);
        
        // Update proposal status
        proposal.isActive = false;
        
        emit ProposalCancelled(_proposalId, msg.sender);
    }
    
    function expireProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.isActive, "Proposal not active");
        require(block.timestamp > proposal.deadline, "Proposal not expired yet");
        require(!proposal.isExpired, "Proposal already expired");
        
        // Return offered assets to proposer
        _returnAssetsToProposer(_proposalId);
        
        // Update proposal status
        proposal.isActive = false;
        proposal.isExpired = true;
        
        emit ProposalExpired(_proposalId, proposal.proposer);
    }
    
    function _returnAssetsToProposer(uint256 _proposalId) internal {
        Proposal storage proposal = proposals[_proposalId];
        
        // Return offered assets from escrow to proposer
        for (uint256 i = 0; i < proposal.offeredAssets.length; i++) {
            Asset memory asset = proposal.offeredAssets[i];
            
            if (asset.isNFT) {
                IERC721(asset.contractAddress).transferFrom(
                    address(this),
                    proposal.proposer,
                    asset.tokenId
                );
            } else {
                IERC20(asset.contractAddress).transferFrom(
                    address(this),
                    proposal.proposer,
                    asset.amount
                );
            }
        }
    }
    
    // View functions
    function getProposal(uint256 _proposalId) external view returns (
        uint256 id,
        address proposer,
        address targetWallet,
        uint256 deadline,
        bool isActive,
        bool isAccepted,
        bool isExpired
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.targetWallet,
            proposal.deadline,
            proposal.isActive,
            proposal.isAccepted,
            proposal.isExpired
        );
    }
    
    function getProposalAssets(uint256 _proposalId) external view returns (
        Asset[] memory offeredAssets,
        Asset[] memory requestedAssets
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.offeredAssets, proposal.requestedAssets);
    }
    
    function getUserProposals(address _user) external view returns (uint256[] memory) {
        return userProposals[_user];
    }
    
    function getUserReceivedProposals(address _user) external view returns (uint256[] memory) {
        return userReceivedProposals[_user];
    }
    
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256[] memory activeProposals = new uint256[](nextProposalId - 1);
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextProposalId; i++) {
            if (proposals[i].isActive && block.timestamp <= proposals[i].deadline) {
                activeProposals[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeProposals[i];
        }
        
        return result;
    }
    
    function getTotalProposals() external view returns (uint256) {
        return nextProposalId - 1;
    }
    
    // Admin functions
    function setProposalFee(uint256 _newFee) external onlyOwner {
        proposalFee = _newFee;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // Emergency function to handle stuck assets
    function emergencyWithdraw(
        address _token,
        uint256 _tokenId,
        bool _isNFT
    ) external onlyOwner {
        if (_isNFT) {
            IERC721(_token).transferFrom(address(this), owner, _tokenId);
        } else {
            IERC20(_token).transfer(owner, IERC20(_token).balanceOf(address(this)));
        }
    }
} 