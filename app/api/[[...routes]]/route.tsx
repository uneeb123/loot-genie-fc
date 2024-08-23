/** @jsxImportSource frog/jsx */

import { getExchangeRates } from "@/app/utils/exchangeRate";
import { countdownTimer, nFormatter } from "@/app/utils/helper";
import {
  DEGEN_LOTTERY_ADDRESS,
  MethodName,
  chainId,
  getPrize,
  getTimeLeft,
  referrer,
  getTicketPrice,
  ETH_LOTTERY_ADDRESS,
} from "@/app/utils/lootGenie";
import {
  vars,
  Box,
  Text,
  HStack,
  VStack,
  Rows,
  Columns,
  Row,
  Column,
} from "@/app/utils/ui";
import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { neynar } from "frog/hubs";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { DegenLotteryAbi } from "@/app/utils/abi/DegenLottery";
import { LotteryAbi } from "@/app/utils/abi/Lottery";

const app = new Frog({
  ui: { vars },
  assetsPath: "/",
  browserLocation: "/",
  basePath: "/api",
  hub: neynar({ apiKey: "38B3178D-8E63-4CB5-9DD8-6FE7C9D3F0D1" }),
  title: "Loot Genie",
});

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.use(async (c, next) => {
  const prize = await getPrize(false);
  const timeLeft = countdownTimer(await getTimeLeft(false));
  const { ethToUsd } = await getExchangeRates();
  const prizeUsd = Math.floor(prize * ethToUsd);
  const prizeFormatted = nFormatter(prize, 3);
  const ticketPrice = await getTicketPrice(false);
  c.set("prize" as never, prizeFormatted as never);
  c.set("prizeUsd" as never, prizeUsd as never);
  c.set("timeLeft" as never, timeLeft as never);
  c.set("ticketPrice" as never, ticketPrice as never);
  await next();
});

app.frame("/", (c) => {
  return c.res({
    action: "/finish",
    image: "/img",
    intents: [
      <Button.Transaction target="/buy">Enter Lotto</Button.Transaction>,
    ],
  });
});

app.image("/img", (c) => {
  const { prize, timeLeft, prizeUsd } = c.var as {
    prize: string;
    timeLeft: {
      hours: number;
      minutes: number;
      seconds: number;
    };
    prizeUsd: number;
  };
  return c.res({
    image: (
      <Box margin="52">
        <Rows height="100%">
          <Row>
            <Columns>
              <Column>
                <Box marginBottom="2" marginRight="32">
                  <Text size="24">{`Prize`}</Text>
                </Box>
              </Column>
              <Column>
                <Box>
                  <Text size="32">{`${prize} ETH`}</Text>
                </Box>
              </Column>
            </Columns>
          </Row>
          <Row>
            <Columns>
              <Column>
                <Box marginBottom="2" marginRight="32">
                  <Text size="24">{`Prize (in USD)`}</Text>
                </Box>
              </Column>
              <Column>
                <Text size="32">{`$${prizeUsd}`}</Text>
              </Column>
            </Columns>
          </Row>
          <Row>
            <Columns>
              <Column>
                <Box marginBottom="2" marginRight="32">
                  <Text size="24">{`Time Left`}</Text>
                </Box>
              </Column>
              <Column>
                <HStack alignItems="flex-end">
                  {timeLeft.hours && (
                    <>
                      <Text size="32">{`${timeLeft.hours} `}</Text>
                      <Box paddingBottom="6" marginRight="10" marginLeft="4">
                        <Text size="18">{`hr`}</Text>
                      </Box>
                    </>
                  )}
                  {timeLeft.minutes && (
                    <>
                      <Text size="32">{`${timeLeft.minutes} `}</Text>
                      <Box paddingBottom="6" marginRight="10" marginLeft="4">
                        <Text size="18">{`min`}</Text>
                      </Box>
                    </>
                  )}
                  <>
                    <Text size="32">{`${timeLeft.seconds} `}</Text>
                    <Box paddingBottom="6" marginRight="10" marginLeft="4">
                      <Text size="18">{`sec`}</Text>
                    </Box>
                  </>
                </HStack>
              </Column>
            </Columns>
          </Row>
        </Rows>
      </Box>
    ),
    headers: {
      "Cache-Control": "max-age=0",
    },
  });
});

app.transaction("/buy", (c) => {
  const { ticketPrice } = c.var as {
    ticketPrice: number;
  };
  return c.contract({
    abi: LotteryAbi,
    chainId: chainId,
    functionName: MethodName.purchaseTickets,
    args: [referrer],
    to: ETH_LOTTERY_ADDRESS,
    value: BigInt(ticketPrice),
  });
});

app.frame("/finish", (c) => {
  // const { transactionId } = c;
  return c.res({
    image: (
      <Box
        alignHorizontal="center"
        alignVertical="center"
        width="100%"
        height="100%"
      >
        <Text align="center" size="48">
          Success
        </Text>
      </Box>
    ),
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

/* Useful snippet

// increment
app.frame("/lotto/:id", (c) => {
  const id = c.req.param("id");
  const { frameData, status } = c;
  const { buttonValue, buttonIndex } = c;
  let frameDataExists = false;
  if (buttonIndex) {
    frameDataExists = true;
  }
  let fd;
  if (frameDataExists) {
    fd = frameData as FrameData;
  }
  const { deriveState } = c;
  const state = deriveState((previousState: any) => {
    if (buttonValue) previousState.values.push(buttonValue);
  });
  return c.res({
    // this can also be just an image
    image: (
      <div>
        <div>{id}</div>
        <div>{state}</div>
        {fd ? (
          <div>
            <div>{fd.castId.fid}</div>
            <div>{fd.castId.hash}</div>
            <div>{fd.address}</div>
            <div>{fd.network}</div>
            <div>{fd.timestamp}</div>
            <div>{fd.transactionId}</div>
            <div>{fd.url}</div>
          </div>
        ) : (
          <div>No Frame Data</div>
        )}
      </div>
    ),
    intents: [
      <Button value="test">Test</Button>,
      <Button.Link href="https://www.google.com">Link</Button.Link>,
      <Button.Redirect location="https://www.google.com">
        Redirect
      </Button.Redirect>,
    ],
  });
});

*/
