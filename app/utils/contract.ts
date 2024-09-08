import { Address, createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { SimpleLotteryAbi } from "@/app/utils/abi/SimpleLottery";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
export const SIMPLE_LOTTERY_ADDRESS = process.env
  .SIMPLE_LOTTERY_ADDRESS as Address;
const PRIVATE_KEY = process.env.PRIVATE_KEY as Address;

const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);

export const publicClient = createPublicClient({
  chain: base,
  transport: http(ALCHEMY_BASE_URL),
});

export const walletClient = createWalletClient({
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

export const readContract = async (
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

export const writeContract = async (
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

export const chainId = "eip155:8453";
