import {
  PaymentLinkCreated,
  PurchaseMade,
  PaymentLinkDeactivated,
  RaffleCreated,
  TicketPurchased,
  RaffleEnded,
  RewardClaimed,
} from "./Types.gen";

// NadPay Event Handlers
PaymentLinkCreated.handler(async ({ event, context }) => {
  const paymentLink = {
    id: event.params.linkId.toString(),
    creator: event.params.creator,
    title: event.params.title,
    description: "", // Will be fetched separately or added to event
    coverImage: "", 
    price: event.params.price,
    totalSales: event.params.totalSales,
    maxPerWallet: event.params.maxPerWallet,
    salesCount: 0n,
    totalEarned: 0n,
    isActive: true,
    createdAt: BigInt(event.block.timestamp),
    expiresAt: event.params.expiresAt || 0n,
  };

  context.PaymentLink.set(paymentLink);
});

PurchaseMade.handler(async ({ event, context }) => {
  const purchase = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    paymentLink_id: event.params.linkId.toString(),
    buyer: event.params.buyer,
    amount: event.params.amount,
    totalPrice: event.params.totalPrice,
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash,
  };

  context.Purchase.set(purchase);

  // Update payment link stats
  const paymentLink = await context.PaymentLink.get(event.params.linkId.toString());
  if (paymentLink) {
    context.PaymentLink.set({
      ...paymentLink,
      salesCount: paymentLink.salesCount + event.params.amount,
      totalEarned: paymentLink.totalEarned + event.params.totalPrice,
    });
  }
});

PaymentLinkDeactivated.handler(async ({ event, context }) => {
  const paymentLink = await context.PaymentLink.get(event.params.linkId.toString());
  if (paymentLink) {
    context.PaymentLink.set({
      ...paymentLink,
      isActive: false,
    });
  }
});

// NadRaffle Event Handlers
RaffleCreated.handler(async ({ event, context }) => {
  const raffle = {
    id: event.params.raffleId.toString(),
    creator: event.params.creator,
    title: event.params.title,
    description: "", // Will be fetched separately
    imageHash: "",
    rewardType: event.params.rewardType === 0 ? "TOKEN" : "NFT",
    rewardTokenAddress: event.params.rewardTokenAddress,
    rewardAmount: event.params.rewardAmount,
    ticketPrice: event.params.ticketPrice,
    maxTickets: event.params.maxTickets,
    maxTicketsPerWallet: BigInt(0), // Will be added to event
    expirationTime: event.params.expirationTime,
    autoDistributeOnSoldOut: false, // Will be added to event
    ticketsSold: 0n,
    totalEarned: 0n,
    winner: null,
    status: "ACTIVE",
    createdAt: BigInt(event.block.timestamp),
    rewardClaimed: false,
  };

  context.Raffle.set(raffle);
});

TicketPurchased.handler(async ({ event, context }) => {
  const ticket = {
    id: `${event.params.raffleId}-${event.params.ticketNumber}`,
    raffle_id: event.params.raffleId.toString(),
    buyer: event.params.buyer,
    ticketNumber: event.params.ticketNumber,
    amount: event.params.amount,
    purchaseTime: BigInt(event.block.timestamp),
    randomSeed: event.params.randomSeed,
    txHash: event.transaction.hash,
  };

  context.Ticket.set(ticket);

  // Update raffle stats
  const raffle = await context.Raffle.get(event.params.raffleId.toString());
  if (raffle) {
    context.Raffle.set({
      ...raffle,
      ticketsSold: raffle.ticketsSold + 1n,
      totalEarned: raffle.totalEarned + event.params.amount,
    });
  }
});

RaffleEnded.handler(async ({ event, context }) => {
  const raffle = await context.Raffle.get(event.params.raffleId.toString());
  if (raffle) {
    context.Raffle.set({
      ...raffle,
      winner: event.params.winner,
      status: "ENDED",
    });
  }
});

RewardClaimed.handler(async ({ event, context }) => {
  const raffle = await context.Raffle.get(event.params.raffleId.toString());
  if (raffle) {
    context.Raffle.set({
      ...raffle,
      rewardClaimed: true,
    });
  }
}); 