import { Address, createPublicClient, http, zeroAddress } from "viem";
import { base } from "viem/chains";
import { DegenLotteryAbi } from "./abi/DegenLottery";
import { LotteryAbi } from "./abi/Lottery";

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

const callContractMethod = async (methodName: string, degenToken: boolean) => {
  return await publicClient.readContract({
    address: degenToken ? DEGEN_LOTTERY_ADDRESS : ETH_LOTTERY_ADDRESS,
    abi: degenToken ? DegenLotteryAbi : LotteryAbi,
    functionName: methodName as any,
  });
};

export const getEndTime = async (degenToken: boolean) => {
  const lastLotteryEndTime = (await callContractMethod(
    MethodName.lastLotteryEndTime,
    degenToken
  )) as bigint;
  const roundTripTime = (await callContractMethod(
    MethodName.roundDurationInSeconds,
    degenToken
  )) as bigint;
  const endTime = lastLotteryEndTime + roundTripTime;
  return Number(endTime);
};

export const getTimeLeft = async (degenToken: boolean) => {
  const endTime = await getEndTime(degenToken);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeLeftInSeconds = endTime - currentTime;
  return timeLeftInSeconds;
};

export const getTicketPrice = async (degenToken: boolean) =>
  Number(await callContractMethod(MethodName.ticketPrice, degenToken));

export const getPrize = async (degenToken: boolean) => {
  const ticketsSoldBps = (await callContractMethod(
    MethodName.ticketCountTotalBps,
    degenToken
  )) as bigint;
  const ticketPrice = (await callContractMethod(
    MethodName.ticketPrice,
    degenToken
  )) as bigint;
  const lpPoolTotal = (await callContractMethod(
    MethodName.lpPoolTotal,
    degenToken
  )) as bigint;
  const ticketSalesTotal = (ticketsSoldBps / BigInt(10000)) * ticketPrice;
  const prize = ticketSalesTotal > lpPoolTotal ? ticketSalesTotal : lpPoolTotal;
  // https://stackoverflow.com/questions/54409854/how-to-divide-two-native-javascript-bigints-and-get-a-decimal-result
  return Number((prize * BigInt(1000)) / BigInt(10 ** 18)) / 1000;
};

export const chainId = "eip155:8453";

export const referrer = zeroAddress;
