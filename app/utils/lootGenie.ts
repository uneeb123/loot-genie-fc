import { Address, createPublicClient, http, zeroAddress } from "viem";
import { base } from "viem/chains";
import { DegenLotteryAbi } from "./abi/DegenLottery";
import { LotteryAbi } from "./abi/Lottery";
import { countdownTimer, nFormatter } from "./helper";
import { getExchangeRates } from "./exchangeRate";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
// const ALCHEMY_BASE_SEPOLIA_URL = `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
// const ALCHEMY_MAINNET_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
export const DEGEN_LOTTERY_ADDRESS = process.env
  .DEGEN_LOTTERY_ADDRESS as Address;
export const ETH_LOTTERY_ADDRESS = process.env.ETH_LOTTERY_ADDRESS as Address;

const publicClient = createPublicClient({
  chain: base,
  transport: http(ALCHEMY_BASE_URL),
});

export enum SupportedToken {
  ETH = "ETH",
  DEGEN = "DEGEN",
}

export enum MethodName {
  // constants
  ticketPrice = "ticketPrice",
  roundDurationInSeconds = "roundDurationInSeconds",
  feeBps = "feeBps",
  lastLotteryEndTime = "lastLotteryEndTime",
  ticketCountTotalBps = "ticketCountTotalBps",
  lpsInfo = "lpsInfo",
  usersInfo = "usersInfo",
  lpPoolTotal = "lpPoolTotal",
  lpPoolCap = "lpPoolCap",
  referralFeesClaimable = "referralFeesClaimable",
  purchaseTickets = "purchaseTickets",
  withdrawWinnings = "withdrawWinnings",
  lpDeposit = "lpDeposit",
  withdrawAllLP = "withdrawAllLP",
  withdrawReferralFees = "withdrawReferralFees",
  minLpDeposit = "minLpDeposit",
}

const callContractMethod = async (
  methodName: string,
  token: SupportedToken
) => {
  if (token == SupportedToken.DEGEN) {
    return await publicClient.readContract({
      address: DEGEN_LOTTERY_ADDRESS,
      abi: DegenLotteryAbi,
      functionName: methodName as any,
    });
  } else {
    return await publicClient.readContract({
      address: ETH_LOTTERY_ADDRESS,
      abi: LotteryAbi,
      functionName: methodName as any,
    });
  }
};

const getEndTime = async (token: SupportedToken) => {
  const lastLotteryEndTime = (await callContractMethod(
    MethodName.lastLotteryEndTime,
    token
  )) as bigint;
  const roundTripTime = (await callContractMethod(
    MethodName.roundDurationInSeconds,
    token
  )) as bigint;
  const endTime = lastLotteryEndTime + roundTripTime;
  return Number(endTime);
};

const getTimeLeft = async (token: SupportedToken) => {
  const endTime = await getEndTime(token);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeLeftInSeconds = endTime - currentTime;
  return timeLeftInSeconds;
};

const getTicketPrice = async (token: SupportedToken) =>
  Number(await callContractMethod(MethodName.ticketPrice, token));

const getPrize = async (token: SupportedToken) => {
  const ticketsSoldBps = (await callContractMethod(
    MethodName.ticketCountTotalBps,
    token
  )) as bigint;
  const ticketPrice = (await callContractMethod(
    MethodName.ticketPrice,
    token
  )) as bigint;
  const lpPoolTotal = (await callContractMethod(
    MethodName.lpPoolTotal,
    token
  )) as bigint;
  const ticketSalesTotal = (ticketsSoldBps / BigInt(10000)) * ticketPrice;
  const prize = ticketSalesTotal > lpPoolTotal ? ticketSalesTotal : lpPoolTotal;
  // https://stackoverflow.com/questions/54409854/how-to-divide-two-native-javascript-bigints-and-get-a-decimal-result
  return Number((prize * BigInt(1000)) / BigInt(10 ** 18)) / 1000;
};

export interface LotteryDetails {
  prize: string;
  prizeUsd: number;
  ticketPrice: number;
  timeLeft: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

export const getLotteryDetails = async (
  token: SupportedToken
): Promise<LotteryDetails> => {
  const prize = await getPrize(token);
  const timeLeftRaw = await getTimeLeft(token);
  const timeLeft = countdownTimer(timeLeftRaw);
  let prizeUsd = 0;
  const { ethToUsd, degenToUsd } = await getExchangeRates();
  if (token == SupportedToken.DEGEN) {
    prizeUsd = Math.floor(prize * degenToUsd);
  } else {
    prizeUsd = Math.floor(prize * ethToUsd);
  }
  const prizeFormatted = nFormatter(prize, 3);
  const ticketPrice = await getTicketPrice(token);
  return {
    prize: prizeFormatted,
    prizeUsd,
    ticketPrice,
    timeLeft,
  };
};

export const chainId = "eip155:8453";

export const referrer = zeroAddress;
