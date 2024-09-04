import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
const client = new NeynarAPIClient(NEYNAR_API_KEY);

const LOOT_GENIE_FID = 849619;

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

const isFollowingLootGenie = async (fid: number): Promise<boolean> =>
  await checkUserFollowers(LOOT_GENIE_FID, fid);

// checks if any cast by Loot Genie was recasted
const hasRecastedLootGenie = async (fid: number): Promise<boolean> =>
  await checkUserRecastedTarget(fid, LOOT_GENIE_FID);

export const followingAndRecastedLootGenie = async (
  fid: number
): Promise<boolean> => {
  return (await isFollowingLootGenie(fid)) && (await hasRecastedLootGenie(fid));
};
