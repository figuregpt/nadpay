// Auto-generated raffle contract configuration
// Do not edit manually - run 'npm run generate-raffle-abi' to regenerate

export const NADRAFFLE_CONTRACT = {
  "address": "0xEb986befCE41E18df72697471C5ae82B1205BaAd",
  "abi": [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newFee",
        "type": "uint256"
      }
    ],
    "name": "PlatformFeeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "RaffleCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "enum NadRaffle.RewardType",
        "name": "rewardType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "rewardTokenAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ticketPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxTickets",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expirationTime",
        "type": "uint256"
      }
    ],
    "name": "RaffleCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "winningTicket",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "randomHash",
        "type": "bytes32"
      }
    ],
    "name": "RaffleEnded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum NadRaffle.RewardType",
        "name": "rewardType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "RewardClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ticketNumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "randomSeed",
        "type": "bytes32"
      }
    ],
    "name": "TicketPurchased",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_FEE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      }
    ],
    "name": "cancelRaffle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      }
    ],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imageHash",
        "type": "string"
      },
      {
        "internalType": "enum NadRaffle.RewardType",
        "name": "rewardType",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "rewardTokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ticketPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxTickets",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxTicketsPerWallet",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expirationTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "autoDistributeOnSoldOut",
        "type": "bool"
      }
    ],
    "name": "createRaffle",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      }
    ],
    "name": "endRaffle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      }
    ],
    "name": "forceEndExpiredRaffle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      }
    ],
    "name": "getRaffle",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "imageHash",
            "type": "string"
          },
          {
            "internalType": "enum NadRaffle.RewardType",
            "name": "rewardType",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "rewardTokenAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "rewardAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "ticketPrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxTickets",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxTicketsPerWallet",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expirationTime",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "autoDistributeOnSoldOut",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "ticketsSold",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarned",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "winner",
            "type": "address"
          },
          {
            "internalType": "enum NadRaffle.RaffleStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "rewardClaimed",
            "type": "bool"
          }
        ],
        "internalType": "struct NadRaffle.Raffle",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      }
    ],
    "name": "getRaffleTickets",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "raffleId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "ticketNumber",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "purchaseTime",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "randomSeed",
            "type": "bytes32"
          }
        ],
        "internalType": "struct NadRaffle.Ticket[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalRaffles",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserRaffles",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserTickets",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      }
    ],
    "name": "isRaffleExpired",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFeePercentage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      }
    ],
    "name": "purchaseTickets",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "raffleTickets",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "raffleId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "ticketNumber",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "purchaseTime",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "randomSeed",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "raffles",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imageHash",
        "type": "string"
      },
      {
        "internalType": "enum NadRaffle.RewardType",
        "name": "rewardType",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "rewardTokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ticketPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxTickets",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxTicketsPerWallet",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expirationTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "autoDistributeOnSoldOut",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "ticketsSold",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalEarned",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "internalType": "enum NadRaffle.RaffleStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "rewardClaimed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newFeePercentage",
        "type": "uint256"
      }
    ],
    "name": "setPlatformFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "ticketsPurchasedByWallet",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userRaffles",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawPlatformFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
} as const;

// Type definitions for the contract
export type RewardType = "TOKEN" | "NFT";
export type RaffleStatus = "ACTIVE" | "ENDED" | "CANCELLED";

export type Raffle = {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  imageHash: string;
  rewardType: number; // 0 = TOKEN, 1 = NFT
  rewardTokenAddress: string;
  rewardAmount: bigint;
  ticketPrice: bigint;
  maxTickets: bigint;
  maxTicketsPerWallet: bigint;
  expirationTime: bigint;
  autoDistributeOnSoldOut: boolean;
  ticketsSold: bigint;
  totalEarned: bigint;
  winner: string;
  status: number; // 0 = ACTIVE, 1 = ENDED, 2 = CANCELLED
  createdAt: bigint;
  rewardClaimed: boolean;
};

export type Ticket = {
  raffleId: bigint;
  buyer: string;
  ticketNumber: bigint;
  purchaseTime: bigint;
  randomSeed: string;
};

export const REWARD_TYPES = {
  TOKEN: 0,
  NFT: 1
} as const;

export const RAFFLE_STATUS = {
  ACTIVE: 0,
  ENDED: 1,
  CANCELLED: 2
} as const;
