import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  zeroAddress,
} from "viem";
import { base } from "viem/chains";
import { countdownTimer, nFormatter, removeDecimals } from "@/app/utils/helper";
import { getExchangeRates } from "@/app/utils/exchangeRate";
import { privateKeyToAccount } from "viem/accounts";
import { SimpleLotteryAbi } from "@/app/utils/abi/SimpleLottery";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
export const SIMPLE_LOTTERY_ADDRESS = process.env
  .SIMPLE_LOTTERY_ADDRESS as Address;
const PRIVATE_KEY = process.env.PRIVATE_KEY as Address;

// ============================
//    INITIALIZE CLIENTS
// ============================

const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);

const publicClient = createPublicClient({
  chain: base,
  transport: http(ALCHEMY_BASE_URL),
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(ALCHEMY_BASE_URL),
});

export enum SimpleLotteryMethod {
  ticketPrice = "ticketPrice",
  feeBps = "feeBps",
  currentRounderIndex = "currentRoundIndex",
  rounds = "rounds",
  purchaseTickets = "purchaseTickets",
  purchaseTicketsFor = "purchaseTicketsFor",
  giftTickets = "giftTickets",
  claimTicket = "claimTicket",
  getTickets = "getTickets",
}

const readContract = async (
  methodName: SimpleLotteryMethod,
  args: any = undefined
) => {
  return await publicClient.readContract({
    address: SIMPLE_LOTTERY_ADDRESS,
    abi: SimpleLotteryAbi,
    functionName: methodName as any,
    args: args,
  });
};

const writeContract = async (
  methodName: SimpleLotteryMethod,
  args: any = undefined
) => {
  const { request } = await publicClient.simulateContract({
    account,
    address: SIMPLE_LOTTERY_ADDRESS,
    abi: SimpleLotteryAbi,
    functionName: methodName as any,
    args: args,
  });
  return await walletClient.writeContract(request);
};

// ===================================
//    LOTTERY SPECIFIC FUNCTIONALITY
// ===================================

// latest index is current - 1
const getLatestRoundIndex = async () =>
  ((await readContract(SimpleLotteryMethod.currentRounderIndex)) as bigint) -
  BigInt(1);

const LotteryInfo = async (roundIndex: bigint) => {
  const round = (await readContract(SimpleLotteryMethod.rounds, [
    roundIndex,
  ])) as any;
  return {
    active: round[0],
    potSize: round[1],
    startTime: round[2],
    durationInSeconds: round[3],
  };
};

const getTimeLeft = async (startTime: bigint, durationInSeconds: bigint) => {
  const endTime = Number(startTime + durationInSeconds);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeLeftInSeconds = Math.max(endTime - currentTime, 0);
  return countdownTimer(timeLeftInSeconds);
};

const getTicketPrice = async () =>
  (await readContract(SimpleLotteryMethod.ticketPrice)) as bigint;

export interface LotteryDetails {
  prize: string;
  prizeUsd: string;
  ticketPrice: number;
  timeLeft: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  roundIndex: number;
}

export const getLotteryDetails = async (): Promise<LotteryDetails> => {
  const latestRoundIndex = await getLatestRoundIndex();
  const info = await LotteryInfo(latestRoundIndex);
  const prize = removeDecimals(info.potSize);
  const timeLeft = await getTimeLeft(info.startTime, info.durationInSeconds);
  const { degenToUsd } = await getExchangeRates();
  const prizeUsd = nFormatter(prize * degenToUsd, 3);
  // const prizeFormatted = nFormatter(prize, 3);
  const ticketPrice = removeDecimals(await getTicketPrice());
  return {
    prize: prize.toString(),
    prizeUsd,
    ticketPrice,
    timeLeft,
    roundIndex: Number(latestRoundIndex),
  };
};

export const chainId = "eip155:8453";

const giftTicketsToAddress = async (recipient: Address, roundIndex: bigint) => {
  return await writeContract(SimpleLotteryMethod.giftTickets, [
    recipient,
    roundIndex,
    1,
  ]);
};

const currentTicketCount = async (user: Address, roundIndex: bigint) =>
  (await readContract(SimpleLotteryMethod.getTickets, [
    roundIndex,
    user,
  ])) as bigint;

// checks the latest round index and gifts user ticket
export const claimTicket = async (user: Address) => {
  const latestRoundIndex = await getLatestRoundIndex();
  const ticketCountForUser = await currentTicketCount(user, latestRoundIndex);
  if (ticketCountForUser == BigInt(0)) {
    await giftTicketsToAddress(user, latestRoundIndex);
  }
};

export const getUserTickets = async (user: Address) => {
  const latestRoundIndex = await getLatestRoundIndex();
  return Number(await currentTicketCount(user, latestRoundIndex));
};
