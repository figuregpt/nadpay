/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  NadPay,
  NadPay_PaymentLinkCreated,
  NadPay_PurchaseMade,
  NadRaffle,
  NadRaffle_RaffleCreated,
  NadRaffle_RaffleEnded,
  NadRaffle_RewardClaimed,
  NadRaffle_TicketPurchased,
} from "generated";

NadPay.PaymentLinkCreated.handler(async ({ event, context }) => {
  const entity: NadPay_PaymentLinkCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    linkId: event.params.linkId,
    creator: event.params.creator,
    price: event.params.price,
    title: event.params.title,
    description: event.params.description,
  };

  context.NadPay_PaymentLinkCreated.set(entity);
});

NadPay.PurchaseMade.handler(async ({ event, context }) => {
  const entity: NadPay_PurchaseMade = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    linkId: event.params.linkId,
    buyer: event.params.buyer,
    amount: event.params.amount,
    totalPrice: event.params.totalPrice,
  };

  context.NadPay_PurchaseMade.set(entity);
});

NadRaffle.RaffleCreated.handler(async ({ event, context }) => {
  const entity: NadRaffle_RaffleCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    raffleId: event.params.raffleId,
    creator: event.params.creator,
    title: event.params.title,
    description: event.params.description,
    ticketPrice: event.params.ticketPrice,
    endTime: event.params.endTime,
    rewardTokenAddress: event.params.rewardTokenAddress,
    rewardAmount: event.params.rewardAmount,
    rewardType: event.params.rewardType,
  };

  context.NadRaffle_RaffleCreated.set(entity);
});

NadRaffle.RaffleEnded.handler(async ({ event, context }) => {
  const entity: NadRaffle_RaffleEnded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    raffleId: event.params.raffleId,
    winner: event.params.winner,
    totalTickets: event.params.totalTickets,
    totalAmount: event.params.totalAmount,
  };

  context.NadRaffle_RaffleEnded.set(entity);
});

NadRaffle.RewardClaimed.handler(async ({ event, context }) => {
  const entity: NadRaffle_RewardClaimed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    raffleId: event.params.raffleId,
    winner: event.params.winner,
    rewardAmount: event.params.rewardAmount,
  };

  context.NadRaffle_RewardClaimed.set(entity);
});

NadRaffle.TicketPurchased.handler(async ({ event, context }) => {
  const entity: NadRaffle_TicketPurchased = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    raffleId: event.params.raffleId,
    buyer: event.params.buyer,
    amount: event.params.amount,
  };

  context.NadRaffle_TicketPurchased.set(entity);
});
