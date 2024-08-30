import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
const client = new NeynarAPIClient(NEYNAR_API_KEY);

const allowance = async (wallet: string, fid: string) => {
  const response = await fetch(
    `https://api.degen.tips/airdrop2/allowances?wallet=${wallet}&fid=${fid}`
  );
  const json = await response.json();
  return json;
};

const getVerifiedAddressesByFid = async (fid: number) => {
  const fids = [fid];
  const response = await client.fetchBulkUsers(fids);
  if (!response.users || response.users.length == 0) {
    return [];
  }

  const verifiedAddresses = response.users[0].verified_addresses?.eth_addresses;
  return verifiedAddresses;
};

const isTodaySnapshot = (snapshotTime: string) => {
  const parsedDate = new Date(Date.parse(snapshotTime));
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  return today.getTime() == parsedDate.getTime();
};

const getTodayAllowance = async (wallet: string, fid: string) => {
  const allAllowances = await allowance(wallet, fid);
  if (!allAllowances || allAllowances.length == 0) return 0;

  const todayAllowance = allAllowances.find((allowance: any) =>
    isTodaySnapshot(allowance.snapshot_day)
  );
  if (!todayAllowance || !todayAllowance.remaining_tip_allowance) return 0;

  return Number(todayAllowance.remaining_tip_allowance);
};

export const fetchRemainingTipAllowance = async (fid: number) => {
  const addresses = await getVerifiedAddressesByFid(fid);
  if (!addresses || addresses.length == 0) return 0;

  let totalAllowance = 0;
  await Promise.all(
    addresses.map(async (address) => {
      const todayAllowance = await getTodayAllowance(address, fid.toString());
      totalAllowance += todayAllowance;
    })
  );
  return totalAllowance;
};
