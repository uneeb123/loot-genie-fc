/** @jsxImportSource frog/jsx */

import { SIMPLE_LOTTERY_ADDRESS } from "@/app/utils/lootGenieSimple";
import {
  vars,
  Box,
  Text,
  HStack,
  VStack,
  Rows,
  Columns,
  Row,
  Image,
  Column,
} from "@/app/utils/ui";
import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { neynar as neynarHub } from "frog/hubs";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { neynar, type NeynarVariables } from "frog/middlewares";
// import { SimpleLotteryAbi } from "@/app/utils/abi/SimpleLottery";
import { followingAndRecastedLootGenie } from "@/app/utils/fc";
import { getVerifiedAddressesByFid } from "@/app/utils/degen";
import { Address } from "viem";
import {
  claimTicket,
  getPrize,
  getTimeLeft,
  getUserTickets,
  GIVEAWAY_ADDRESS,
} from "@/app/utils/lootGenieGiveaway";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY as string;

type State = {
  enter: Boolean;
};

const app = new Frog<{ State: State }>({
  ui: { vars },
  assetsPath: "/",
  browserLocation: "/",
  basePath: "/api",
  hub: neynarHub({ apiKey: NEYNAR_API_KEY }),
  title: "Loot Genie",
  initialState: {
    enter: false,
  },
});

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

/*
app.use(async (c, next) => {
  const lottery = await getLotteryDetails();
  c.set("lottery" as never, lottery as never);
  await next();
});
*/

app.use(
  neynar({
    apiKey: NEYNAR_API_KEY,
    features: ["interactor", "cast"],
  })
);

app.frame("/", (c) => {
  return c.res({
    image: "/img",
    intents: [
      <Button action="/enter">CLAIM</Button>,
      <Button action="/tickets">CHECK STATUS</Button>,
    ],
  });
});

app.frame("/enter", async (c) => {
  const { interactor } = c.var as {
    interactor: { fid: number };
  };
  // check if the user has recast and followed
  const userEligible = await followingAndRecastedLootGenie(interactor.fid);
  // const userEligible = true;

  // check if user already has tickets
  const addresses = await getVerifiedAddressesByFid(interactor.fid);
  const addressToDeposit = addresses[0] || SIMPLE_LOTTERY_ADDRESS;
  let ticketCount = await getUserTickets(addressToDeposit as Address);

  return c.res({
    image: "/enter-img",
    intents: userEligible
      ? ticketCount > 0
        ? [
            <Button action="/tickets">CHECK STATUS</Button>,
            <Button.Reset>←</Button.Reset>,
          ]
        : [
            <Button value="claim" action="/tickets">
              CLAIM
            </Button>,
            <Button.Reset>←</Button.Reset>,
          ]
      : [<Button.Reset>FOLLOW AND RECAST TO CLAIM TICKET</Button.Reset>],
  });
});

app.frame("/faq", (c) => {
  return c.res({
    image: "/faq-img",
    intents: [<Button.Reset>←</Button.Reset>],
  });
});

app.frame("/tickets", async (c) => {
  // if claim has been triggered then gift user ticket
  const { buttonValue } = c;
  const { interactor } = c.var as {
    interactor: { fid: number };
  };
  const addresses = await getVerifiedAddressesByFid(interactor.fid);
  const addressToDeposit = addresses[0]; // should have verified address
  let ticketCount = await getUserTickets(addressToDeposit as Address);

  if (buttonValue == "claim") {
    console.log("Claiming...");
    claimTicket(addressToDeposit as Address);
    ticketCount += 1;
  }
  return c.res({
    image: `/tickets-img/${ticketCount}`,
    intents: [<Button.Reset>←</Button.Reset>],
  });
});

/*
app.transaction("/buy", (c) => {
  const { lottery } = c.var as {
    lottery: LotteryDetails;
  };
  const roundIndex = lottery.roundIndex;
  return c.contract({
    abi: SimpleLotteryAbi,
    chainId: chainId,
    functionName: SimpleLotteryMethod.purchaseTickets,
    args: [roundIndex, 1],
    to: SIMPLE_LOTTERY_ADDRESS,
  });
});
*/

// =============================================
//                    IMAGES
// =============================================

app.image("/img", (c) => {
  return c.res({
    image: (
      <div
        style={{
          color: "white",
          display: "flex",
          fontSize: 60,
          background: "linear-gradient(45deg, #251437, #693A9D)",
          width: "100%",
          height: "100%",
          border: "4px solid white",
          paddingTop: "30px",
          paddingLeft: "50px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
            }}
          >
            <Text size="48" font="montserrat" weight="700">
              LOOT GENIE
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "10px",
            }}
          >
            <Text size="24" color="white" font="montserrat" weight="700">
              {`WE'RE GIVING AWAY`}
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "10px",
            }}
          >
            <Text size="32" font="montserrat" weight="700">
              50,000 DEGEN
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "30px",
              maxWidth: "80%",
            }}
          >
            <Text size="18" color="white" font="montserrat" weight="700">
              {`SIMPLY GIVE US A FOLLOW AND RECAST THIS FRAME IN ORDER TO CLAIM YOUR FREE ENTRY!`}
            </Text>
          </div>
        </div>
        <img
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
          }}
          width="504px"
          height="495px"
          src="/genie1.png"
        />
      </div>
    ),
    headers: {
      "Cache-Control": "max-age=0",
    },
  });
});

app.image("/enter-img", async (c) => {
  const { prize, prizeUsd } = await getPrize();
  const timeLeft = await getTimeLeft();
  const potSizeDegen = prize;
  const potSizeUsd = `$${prizeUsd}`;
  let endTime = "";
  if (timeLeft.days > 0) {
    endTime = `${timeLeft.days} days ${timeLeft.hours} hrs ${timeLeft.minutes} mins`;
  } else if (timeLeft.hours > 0) {
    endTime = `${timeLeft.hours} hrs ${timeLeft.minutes} mins`;
  } else {
    endTime = `${timeLeft.minutes} mins`;
  }

  return c.res({
    image: (
      <div
        style={{
          color: "white",
          display: "flex",
          fontSize: 60,
          background: "linear-gradient(45deg, #251437, #693A9D)",
          width: "100%",
          height: "100%",
          border: "4px solid white",
          paddingTop: "30px",
          paddingLeft: "50px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
            }}
          >
            <Text size="48" font="montserrat" weight="700">
              {`FEELIN' LUCKY?`}
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "10px",
              maxWidth: "80%",
            }}
          >
            <Text size="18" color="white" font="montserrat" weight="700">
              {`ONE LUCKY WINNER WILL BE SELECTED AT RANDOM`}
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "50px",
            }}
          >
            <div
              style={{
                display: "flex",
                marginLeft: "30px",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  marginTop: "10px",
                }}
              >
                <Text size="14" color="white" font="montserrat" weight="800">
                  {`CURRENT POT`}
                </Text>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: "5px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontFamily: "montserrat",
                      fontSize: "1.3em",
                    }}
                  >
                    {potSizeDegen}
                  </div>
                  <img
                    style={{
                      display: "flex",
                      marginTop: "30px",
                      marginLeft: "10px",
                    }}
                    width="44px"
                    height="38px"
                    src="/degen.png"
                  />
                </div>
                <Text size="16" color="white" font="montserrat">
                  {potSizeUsd}
                </Text>
              </div>
            </div>
            <img
              style={{
                position: "absolute",
                top: 0,
                left: 0,
              }}
              width="410px"
              height="205px"
              src="/union.png"
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "50px",
              marginLeft: "10px",
            }}
          >
            <Text size="16" color="white" font="montserrat" weight="800">
              ENDS IN:
            </Text>
            <Text size="24" font="montserrat">
              {endTime}
            </Text>
          </div>
        </div>
        <img
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
          }}
          width="504px"
          height="495px"
          src="/genie1.png"
        />
      </div>
    ),
    headers: {
      "Cache-Control": "max-age=0",
    },
  });
});

app.image("/tickets-img/:count", async (c) => {
  const { count } = c.req.param();
  const ticketCount = isNaN(Number(count)) ? 0 : Number(count);

  const timeLeft = await getTimeLeft();
  let endTime = "";
  if (timeLeft.days > 0) {
    endTime = `${timeLeft.days} days ${timeLeft.hours} hrs ${timeLeft.minutes} mins`;
  } else if (timeLeft.hours > 0) {
    endTime = `${timeLeft.hours} hrs ${timeLeft.minutes} mins`;
  } else {
    endTime = `${timeLeft.minutes} mins`;
  }

  const title = ticketCount > 0 ? "EPIC! GOOD LUCK" : "HURRY!";
  const ticketText = ticketCount == 1 ? "TICKET" : "TICKETS";

  return c.res({
    image: (
      <div
        style={{
          color: "white",
          display: "flex",
          fontSize: 60,
          background: "linear-gradient(45deg, #251437, #693A9D)",
          width: "100%",
          height: "100%",
          border: "4px solid white",
          paddingTop: "30px",
          paddingLeft: "50px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
            }}
          >
            <Text size="48" font="montserrat" weight="700">
              {title}
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "10px",
              maxWidth: "80%",
            }}
          >
            <Text size="18" color="white" font="montserrat" weight="700">
              {`YOU HAVE`}
            </Text>
            <div
              style={{
                display: "flex",
                marginLeft: "10px",
                marginRight: "10px",
              }}
            >
              <Text size="18" font="montserrat" weight="700">
                {ticketCount.toString()}
              </Text>
            </div>
            <Text size="18" color="white" font="montserrat" weight="700">
              {ticketText}
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "50px",
              maxWidth: "80%",
            }}
          >
            <Text size="18" color="white" font="montserrat" weight="800">
              THE RAFFLE ENDS IN:
            </Text>
            <Text size="32" font="montserrat" weight="400">
              {endTime}
            </Text>
            <div
              style={{
                display: "flex",
                marginTop: "50px",
                maxWidth: "80%",
              }}
            >
              <Text size="18" color="white" font="montserrat" weight="600">
                {`WE'LL DIRECT MESSAGE THE RESULTS, STAY TUNED!`}
              </Text>
            </div>
          </div>
        </div>
        <img
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
          }}
          width="504px"
          height="495px"
          src="/genie1transparent.png"
        />
      </div>
    ),
    headers: {
      "Cache-Control": "max-age=0",
    },
  });
});

app.image("/faq-img", (c) => {
  return c.res({
    image: (
      <div
        style={{
          color: "white",
          display: "flex",
          fontSize: 60,
          background: "linear-gradient(45deg, #251437, #693A9D)",
          width: "100%",
          height: "100%",
          border: "4px solid white",
          paddingTop: "30px",
          paddingLeft: "50px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADING */}
          <div
            style={{
              display: "flex",
            }}
          >
            <Text size="48" font="montserrat" weight="700">
              FAQ
            </Text>
          </div>
          {/* Q&A */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "80%",
              marginTop: "25px",
            }}
          >
            <div
              style={{
                display: "flex",
                marginTop: "10px",
              }}
            >
              <Text size="16" font="montserrat" weight="700">
                {`How much do I win?`}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "10px",
              }}
            >
              <Text size="14" color="white" font="montserrat" weight="700">
                {`It varies from lottery to lottery. There is no upper limit to the prize. It depends on how many tickets people have bought.`}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "10px",
              }}
            >
              <Text size="16" font="montserrat" weight="700">
                {`How can I participate?`}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "10px",
              }}
            >
              <Text size="14" color="white" font="montserrat" weight="700">
                {`You can participate by buying tickets or claiming free tickets.`}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "10px",
              }}
            >
              <Text size="16" font="montserrat" weight="700">
                {`How will I know if I won or not?`}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "10px",
              }}
            >
              <Text size="14" color="white" font="montserrat" weight="700">
                {`You will receive a DM in your inbox about the results of each lottery you participate in.`}
              </Text>
            </div>
          </div>
        </div>
        <img
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
          }}
          width="504px"
          height="495px"
          src="/genie1transparent.png"
        />
      </div>
    ),
    headers: {
      "Cache-Control": "max-age=0",
    },
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// NOTE: That if you are using the devtools and enable Edge Runtime, you will need to copy the devtools
// static assets to the public folder. You can do this by adding a script to your package.json:
// ```json
// {
//   scripts: {
//     "copy-static": "cp -r ./node_modules/frog/_lib/ui/.frog ./public/.frog"
//   }
// }
// ```
// Next, you'll want to set up the devtools to use the correct assets path:
// ```ts
// devtools(app, { assetsPath: '/.frog' })
// ```
