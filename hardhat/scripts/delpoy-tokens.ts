import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "hederaTestnet",
  chainType: "l1",
});

const DEFAULT_MEME = "0x5bf5d13184623EEB526490f4dc1238e8e71b96Cc";
const DEFAULT_STABLE = "0x575Ce3448217fE6451654801e776115081F97020";
const DEFAULT_NATIVE = "0x7FB87AAf2F2047a6F74018113326607d725CC715";
const DEFAULT_DEFI = "0xD3a23a772c7987a8BFb724e9330aB5C41B685356";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying contracts with:", deployer.address);

  // const supply = ethers.parseUnits("1000000", 18);

  // Deploy tokens
  // const MemeCoin = await ethers.getContractFactory("MemeCoin");
  // const meme = await MemeCoin.deploy(supply);
  // await meme.waitForDeployment();

  // const StableCoin = await ethers.getContractFactory("StableCoin");
  // const stable = await StableCoin.deploy(supply);
  // await stable.waitForDeployment();

  // const NativeCoin = await ethers.getContractFactory("NativeCoin");
  // const native = await NativeCoin.deploy(supply);
  // await native.waitForDeployment();

  // const DeFiCoin = await ethers.getContractFactory("DeFiCoin");
  // const defi = await DeFiCoin.deploy(supply);
  // await defi.waitForDeployment();
  

  // Deploy SwapAgent
  const SwapAgent = await ethers.getContractFactory("SwapAgent");
  const agent = await SwapAgent.deploy();
  await agent.waitForDeployment();

  // Set swap rates (scaled by 1e18)
  await agent.setRate(DEFAULT_MEME, DEFAULT_STABLE, ethers.parseUnits("0.001", 18));
  await agent.setRate(DEFAULT_MEME, DEFAULT_NATIVE, ethers.parseUnits("0.0005", 18));
  await agent.setRate(DEFAULT_MEME, DEFAULT_DEFI,  ethers.parseUnits("0.00033", 18));

  await agent.setRate(DEFAULT_STABLE, DEFAULT_MEME, ethers.parseUnits("1000", 18));
  await agent.setRate(DEFAULT_STABLE, DEFAULT_NATIVE, ethers.parseUnits("0.5", 18));
  await agent.setRate(DEFAULT_STABLE, DEFAULT_DEFI, ethers.parseUnits("0.333", 18));

  await agent.setRate(DEFAULT_NATIVE, DEFAULT_MEME, ethers.parseUnits("2000", 18));
  await agent.setRate(DEFAULT_NATIVE, DEFAULT_STABLE, ethers.parseUnits("2", 18));
  await agent.setRate(DEFAULT_NATIVE, DEFAULT_DEFI, ethers.parseUnits("0.666", 18));

  await agent.setRate(DEFAULT_DEFI, DEFAULT_MEME, ethers.parseUnits("3000", 18));
  await agent.setRate(DEFAULT_DEFI, DEFAULT_STABLE, ethers.parseUnits("3", 18));
  await agent.setRate(DEFAULT_DEFI, DEFAULT_NATIVE, ethers.parseUnits("1.5", 18));

  console.log("\n💱 All swap rates set successfully!");

  console.log("\n✅ Deployment complete!");
  // console.log("MemeCoin:", await meme.getAddress());
  // console.log("StableCoin:", await stable.getAddress());
  // console.log("NativeCoin:", await native.getAddress());
  // console.log("DeFiCoin:", await defi.getAddress());
  console.log("SwapAgent:", await agent.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
