import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import * as dotenv from "dotenv";
dotenv.config();

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
const client = new NeynarAPIClient(NEYNAR_API_KEY);

const ASDF_FID = 211333;
const ELU_FID = 414546;
const ANTONIO_FID = 53;
const SONIYAAA_FID = 843387;
const KARAN_FID = 7791;

const getVerifiedAddressesByFid = async (fid: number) => {
  const fids = [fid];
  const response = await client.fetchBulkUsers(fids);
  const verifiedAddresses = response.users[0].verified_addresses.eth_addresses;
  return verifiedAddresses;
};

const fetchAllFollowing = async (fid: number) => {
  let users: Array<number> = [];
  let response = await client.fetchUserFollowingV2(fid);
  users = users.concat(response.users.map((u) => (u as any).user.fid));
  let cursor = response.next.cursor;
  while (cursor != null) {
    response = await client.fetchUserFollowingV2(fid, {
      cursor: cursor,
      sortType: "desc_chron",
    });
    users = users.concat(response.users.map((u) => (u as any).user.fid));
    cursor = response.next.cursor;
  }
  return users;
};

const checkUserFollowers = async (fid: number, targetFid: number) => {
  let fids;
  let response = await client.fetchUserFollowers(fid, {
    viewerFid: targetFid,
  });
  fids = response.result.users.map((u) => u.fid);
  if (fids.includes(targetFid)) return true;

  let cursor = response.result.next.cursor;
  while (cursor != null) {
    response = await client.fetchUserFollowers(fid, {
      viewerFid: targetFid,
      cursor: cursor,
    });
    fids = response.result.users.map((u) => u.fid);
    if (fids.includes(targetFid)) return true;

    cursor = response.result.next.cursor;
  }

  return false;
};

const checkUserRecastedTarget = async (fid: number, targetFid: number) => {
  const response = await client.fetchRepliesAndRecastsForUser(fid);
  const authorFids = response.casts.map((c) => c.author.fid);

  return authorFids.includes(targetFid);
};

async function main() {
  //   console.log(await checkUserFollowers(ASDF_FID, ELU_FID));
  //   console.log(await checkUserFollowers(ASDF_FID, ANTONIO_FID));
  //   console.log(await checkUserFollowers(SONIYAAA_FID, ASDF_FID));
  console.log(await checkUserRecastedTarget(ASDF_FID, KARAN_FID));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
