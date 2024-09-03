/*

import {
    DEGEN_LOTTERY_ADDRESS,
    MethodName,
    chainId,
    referrer,
    ETH_LOTTERY_ADDRESS,
    SupportedToken,
    getLotteryDetails,
    LotteryDetails,
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
    Image,
    Column,
  } from "@/app/utils/ui";
  import { Button, Frog } from "frog";
  import { devtools } from "frog/dev";
  import { neynar as neynarHub } from "frog/hubs";
  import { handle } from "frog/next";
  import { serveStatic } from "frog/serve-static";
  import { DegenLotteryAbi } from "@/app/utils/abi/DegenLottery";
  import { LotteryAbi } from "@/app/utils/abi/Lottery";
  import { neynar, type NeynarVariables } from "frog/middlewares";
  
  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY as string;
  
  type State = {
    token: SupportedToken;
  };
  
  const app = new Frog<{ State: State }>({
    ui: { vars },
    assetsPath: "/",
    browserLocation: "/",
    basePath: "/api",
    hub: neynarHub({ apiKey: "38B3178D-8E63-4CB5-9DD8-6FE7C9D3F0D1" }),
    title: "Loot Genie",
    initialState: {
      token: SupportedToken.ETH,
    },
  });
  
  // Uncomment to use Edge Runtime
  // export const runtime = 'edge'
  
  app.use(async (c, next) => {
    const ethLottery = await getLotteryDetails(SupportedToken.ETH);
    const degenLottery = await getLotteryDetails(SupportedToken.DEGEN);
    c.set("ethLottery" as never, ethLottery as never);
    c.set("degenLottery" as never, degenLottery as never);
    await next();
  });
  
  app.use(
    neynar({
      apiKey: NEYNAR_API_KEY,
      features: ["interactor", "cast"],
    })
  );
  
  app.frame("/", (c) => {
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
                {`WE'RE GIVING AWAY DEGEN`}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "10px",
              }}
            >
              <Text size="32" font="montserrat" weight="700">
                FOR FREE!
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
      intents: [<Button action="/enter">Enter Lotto</Button>],
    });
  });
  
  app.frame("/token/:token/", (c) => {
    const token = c.req.param("token");
    const degenToken = token.toUpperCase() == "DEGEN";
    return c.res({
      image: `/token/${token}/img`,
      intents: [
        // degenToken ? (
        //   <Button.Transaction target="/token/degen/approveAndBuy">
        //     Check Allowance
        //   </Button.Transaction>
        // ) : (
        <Button.Transaction target={`/token/${token}/buy`} action="/finish">
          Enter Lotto
        </Button.Transaction>,
        // ),
      ],
    });
  });
  
  app.image("/token/:token/img", (c) => {
    const token = c.req.param("token");
    const degenToken = token.toUpperCase() == "DEGEN";
    const { ethLottery, degenLottery } = c.var as {
      degenLottery: LotteryDetails;
      ethLottery: LotteryDetails;
    };
    const lottery = degenToken ? degenLottery : ethLottery;
    const { prize, prizeUsd, timeLeft } = lottery;
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
                    <Text size="32">{`${prize} ${
                      degenToken ? "DEGEN" : "ETH"
                    }`}</Text>
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
  
  app.transaction("/token/:token/buy", (c) => {
    const token = c.req.param("token");
    const degenToken = token.toUpperCase() == "DEGEN";
    const { ethLottery, degenLottery } = c.var as {
      degenLottery: LotteryDetails;
      ethLottery: LotteryDetails;
    };
    if (degenToken) {
      const ticketPrice = ethLottery.ticketPrice;
      return c.contract({
        abi: DegenLotteryAbi,
        chainId: chainId,
        functionName: MethodName.purchaseTickets,
        args: [referrer, BigInt(ticketPrice)],
        to: DEGEN_LOTTERY_ADDRESS,
      });
    } else {
      const ticketPrice = ethLottery.ticketPrice;
      return c.contract({
        abi: LotteryAbi,
        chainId: chainId,
        functionName: MethodName.purchaseTickets,
        args: [referrer],
        to: ETH_LOTTERY_ADDRESS,
        value: BigInt(ticketPrice),
      });
    }
  });
  
  // app.transaction("/token/:token/approveAndBuy", (c) => {
  //   console.log(c);
  //   // either approve or buy
  //   return c.res({
  //     chainId: chainId,
  //   });
  // });
  
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
