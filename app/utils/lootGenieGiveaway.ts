import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  zeroAddress,
} from "viem";
import { base } from "viem/chains";
import { countdownTimer, nFormatter, removeDecimals } from "./helper";
import { getExchangeRates } from "./exchangeRate";
import { privateKeyToAccount } from "viem/accounts";
import { GiveawayAbi } from "./abi/Giveaway";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
export const GIVEAWAY_ADDRESS = process.env.GIVEAWAY_ADDRESS as Address;
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

export enum GiveawayMethod {
  // read
  startTime = "startTime",
  durationInSeconds = "durationInSeconds",
  winner = "winner",
  tickets = "tickets",
  entryCount = "entryCount",
  giveawayAmount = "giveawayAmount",
  // write
  submitEntry = "submitEntry",
}

const readContract = async (
  methodName: GiveawayMethod,
  args: any = undefined
) => {
  return await publicClient.readContract({
    address: GIVEAWAY_ADDRESS,
    abi: GiveawayAbi,
    functionName: methodName as any,
    args: args,
  });
};

const writeContract = async (
  methodName: GiveawayMethod,
  args: any = undefined
) => {
  const { request } = await publicClient.simulateContract({
    account,
    address: GIVEAWAY_ADDRESS,
    abi: GiveawayAbi,
    functionName: methodName as any,
    args: args,
  });
  return await walletClient.writeContract(request);
};

// ===================================
//    LOTTERY SPECIFIC FUNCTIONALITY
// ===================================

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const getPrize = async () => {
  const giveawayAmount = (await readContract(
    GiveawayMethod.giveawayAmount
  )) as bigint;
  const prize = removeDecimals(giveawayAmount);
  const { degenToUsd } = await getExchangeRates();
  const prizeUsd = nFormatter(prize * degenToUsd, 3);
  return {
    prize: prize.toString(),
    prizeUsd,
  };
};

export const getTimeLeft = async (): Promise<TimeLeft> => {
  const durationInSeconds = (await readContract(
    GiveawayMethod.durationInSeconds
  )) as bigint;
  const startTime = (await readContract(GiveawayMethod.startTime)) as bigint;

  const endTime = Number(startTime + durationInSeconds);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeLeftInSeconds = Math.max(endTime - currentTime, 0);
  return countdownTimer(timeLeftInSeconds);
};

export const chainId = "eip155:8453";

const submitEntry = async (recipient: Address) => {
  return await writeContract(GiveawayMethod.submitEntry, [recipient]);
};

const currentTicketCount = async (user: Address) =>
  (await readContract(GiveawayMethod.tickets, [user])) as bigint;

// checks the latest round index and gifts user ticket
export const claimTicket = async (user: Address) => {
  const ticketCountForUser = await currentTicketCount(user);
  if (ticketCountForUser == BigInt(0)) {
    await submitEntry(user);
  }
};

export const getUserTickets = async (user: Address) => {
  return Number(await currentTicketCount(user));
};
