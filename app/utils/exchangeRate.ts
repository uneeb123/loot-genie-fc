const getEthToUsd = async () => {
  const response = await fetch(
    "https://api.coinbase.com/v2/prices/ETH-USD/spot"
  );
  const data = await response.json();
  return data.data.amount;
};

const getDegenToUsd = async () => {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=degen-base&vs_currencies=usd&x_cg_demo_api_key=CG-5F6k6pzstZTcTGCf4qfTfJ4s"
  );
  const data = await response.json();
  return data["degen-base"].usd;
};

export const getExchangeRates = async () => {
  const ethToUsdValue = await getEthToUsd();
  const degenToUsdValue = await getDegenToUsd();
  return {
    ethToUsd: ethToUsdValue,
    degenToUsd: degenToUsdValue,
  };
};
