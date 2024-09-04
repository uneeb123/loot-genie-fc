import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import * as dotenv from "dotenv";
dotenv.config();

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
const client = new NeynarAPIClient(NEYNAR_API_KEY);

const JACEK_FID = 15983;
const KENNY_FID = 2210;
const GARRETT_FID = 2802;
const DEGENPAD = 434908;
const EDIT_FID = 230147;
const ELU_FID = 414546;

const airdrop2 = async (fid: string) => {
  const response = await fetch(
    `https://api.degen.tips/airdrop2/tips?fid=${fid}`
  );
  const json = await response.json();
  console.log(json);
};

const getPointsByAddress = async (address: string) => {
  const response = await fetch(
    `https://api.degen.tips/airdrop2/current/points?wallet=${address}`
  );
  const json = await response.json();
  // assume that this returns only one object
  const points = Number(json[0].points);
  console.log(points);
  return points;
};

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
  const verifiedAddresses = response.users[0].verified_addresses.eth_addresses;
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
  const todayAllowance = allAllowances.find((allowance: any) =>
    isTodaySnapshot(allowance.snapshot_day)
  );
  return todayAllowance && todayAllowance.remaining_tip_allowance
    ? Number(todayAllowance.remaining_tip_allowance)
    : 0;
};

async function main() {
  //   await airdrop2(JACEK_FID.toString());
  const addresses = await getVerifiedAddressesByFid(ELU_FID);
  console.log(addresses);
  let totalAllowance = 0;
  await Promise.all(
    addresses.map(async (address) => {
      const response = await getTodayAllowance(address, ELU_FID.toString());
      console.log(response);
    })
  );
  await allowance(addresses[1], EDIT_FID.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
