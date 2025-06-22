/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const { NadPay, NadRaffle } = require("../generated");

NadPay.PaymentLinkCreated.handler(async ({ event, context }: any) => {
  const entity = {
    id: `${event.chainId}_${event.params.linkId}`,
    linkId: event.params.linkId,
    creator: event.params.creator.toLowerCase(),
    title: event.params.title,
    price: event.params.price,
    totalSales: event.params.totalSales,
    maxPerWallet: event.params.maxPerWallet,
    expireTimestamp: event.params.expireTimestamp,
    createdAt: BigInt(event.block.timestamp),
  };

  context.PaymentLink.set(entity);
});

NadPay.PurchaseMade.handler(async ({ event, context }: any) => {
  const entity = {
    id: `${event.chainId}_${event.params.linkId}_${event.block.timestamp}_${event.params.buyer}`,
    linkId: event.params.linkId,
    buyer: event.params.buyer.toLowerCase(),
    amount: event.params.amount,
    totalPrice: event.params.totalPrice,
    timestamp: BigInt(event.block.timestamp),
    paymentLink_id: `${event.chainId}_${event.params.linkId}`,
  };

  context.Purchase.set(entity);
});

NadRaffle.RaffleCreated.handler(async ({ event, context }: any) => {
  const entity = {
    id: `${event.chainId}_${event.params.raffleId}`,
    raffleId: event.params.raffleId,
    creator: event.params.creator.toLowerCase(),
    title: event.params.title,
    rewardType: Number(event.params.rewardType),
    rewardTokenAddress: event.params.rewardTokenAddress.toLowerCase(),
    rewardAmount: event.params.rewardAmount,
    ticketPrice: event.params.ticketPrice,
    maxTickets: event.params.maxTickets,
    maxTicketsPerWallet: event.params.maxTicketsPerWallet,
    expirationTimestamp: event.params.expirationTimestamp,
    autoDistributeOnSoldOut: event.params.autoDistributeOnSoldOut,
    createdAt: BigInt(event.block.timestamp),
  };

  context.Raffle.set(entity);
});

NadRaffle.TicketPurchased.handler(async ({ event, context }: any) => {
  const entity = {
    id: `${event.chainId}_${event.params.raffleId}_${event.block.timestamp}_${event.params.buyer}`,
    raffleId: event.params.raffleId,
    buyer: event.params.buyer.toLowerCase(),
    amount: event.params.amount,
    timestamp: BigInt(event.block.timestamp),
    raffle_id: `${event.chainId}_${event.params.raffleId}`,
  };

  context.Ticket.set(entity);
});

NadRaffle.RaffleEnded.handler(async ({ event, context }: any) => {
  const entity = {
    id: `${event.chainId}_${event.params.raffleId}_ended`,
    raffleId: event.params.raffleId,
    winner: event.params.winner.toLowerCase(),
    rewardType: Number(event.params.rewardType),
    rewardTokenAddress: event.params.rewardTokenAddress.toLowerCase(),
    rewardAmount: event.params.rewardAmount,
    endedAt: BigInt(event.block.timestamp),
    raffle_id: `${event.chainId}_${event.params.raffleId}`,
  };

  context.Raffle.set(entity);
});

NadRaffle.RewardClaimed.handler(async ({ event, context }: any) => {
  const entity = {
    id: `${event.chainId}_${event.params.raffleId}_claimed`,
    raffleId: event.params.raffleId,
    winner: event.params.winner.toLowerCase(),
    claimedAt: BigInt(event.block.timestamp),
    raffle_id: `${event.chainId}_${event.params.raffleId}`,
  };

  context.Raffle.set(entity);
}); 