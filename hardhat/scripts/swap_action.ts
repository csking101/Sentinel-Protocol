// swap.js
import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "hederaTestnet",
  chainType: "l1",
});

async function main() {
  const [owner] = await ethers.getSigners();

  // replace these with your deployed addresses
  const memeAddress = "0x5bf5d13184623EEB526490f4dc1238e8e71b96Cc";     // MemeCoin
  const stableAddress = "0x575Ce3448217fE6451654801e776115081F97020";   // StableCoin
  const nativeAddress = "0x7FB87AAf2F2047a6F74018113326607d725CC715";   // NativeCoin
  const defiAddress = "0xD3a23a772c7987a8BFb724e9330aB5C41B685356";   // DeFiCoin
  const agentAddress = "0x7deF1dDf0074D9315BFC848c0c2d61F46ff80266";    // SwapAgent

  const MemeCoin = await ethers.getContractAt("MemeCoin", memeAddress);
  const StableCoin = await ethers.getContractAt("StableCoin", stableAddress);
  const NativeCoin = await ethers.getContractAt("NativeCoin", nativeAddress);
  const DeFiCoin = await ethers.getContractAt("DeFiCoin", defiAddress);
  const SwapAgent = await ethers.getContractAt("SwapAgent", agentAddress);

//   console.log(`Owner: ${owner.address}`);
//   console.log(`User: ${user.address}`);

//   // 1️⃣ Give user some MemeCoin (from owner)
//   const mintAmount = ethers.parseUnits("1000", 18);
//   await MemeCoin.connect(owner).transfer(user.address, mintAmount);
//   console.log("✅ Transferred 1000 MEME to user");

  // 2️⃣ Check balances before swap
  const memeBefore = await MemeCoin.balanceOf(owner.address);
  const stableBefore = await StableCoin.balanceOf(owner.address);
  const nativeBefore = await NativeCoin.balanceOf(owner.address);
  const defiBefore = await DeFiCoin.balanceOf(owner.address);
//   console.log(`💰 Before Swap -> MEME: ${ethers.formatUnits(memeBefore, 18)}, STABLE: ${ethers.formatUnits(stableBefore, 18)}`);
    console.log(`💰 Before Swap -> MEME: ${ethers.formatUnits(memeBefore, 18)}, STABLE: ${ethers.formatUnits(stableBefore, 18)}, NATIVE: ${ethers.formatUnits(nativeBefore, 18)}, DEFI: ${ethers.formatUnits(defiBefore, 18)}`);

// Give the SwapAgent 1000 STABLE tokens to start swaps
// await StableCoin.connect(owner).transfer(agentAddress, ethers.parseUnits("1000", 18));
// console.log("✅ Funded SwapAgent with 1000 STABLE for swaps");

  // 3️⃣ Approve SwapAgent to spend MEME tokens
  const approveAmount = ethers.parseUnits("1000000", 18);
  await MemeCoin.connect(owner).approve(agentAddress, approveAmount);
  await StableCoin.connect(owner).approve(agentAddress, approveAmount);
  await NativeCoin.connect(owner).approve(agentAddress, approveAmount);
  await DeFiCoin.connect(owner).approve(agentAddress, approveAmount);
//   console.log("✅ Approved SwapAgent to spend user's MEME tokens");

  // 4️⃣ Perform swap MEME -> STABLE
  const swapAmount = ethers.parseUnits("100", 18);
  const tx = await SwapAgent.connect(owner).swapTokens(
    defiAddress,
    stableAddress,
    owner.address,
    swapAmount,
    { gasLimit: 150000 }
  );
  await tx.wait();
  console.log("🔁 Swap complete!");

  // 5️⃣ Check balances after swap
  const memeAfter = await MemeCoin.balanceOf(owner.address);
  const stableAfter = await StableCoin.balanceOf(owner.address);
  const nativeAfter = await NativeCoin.balanceOf(owner.address);
  const defiAfter = await DeFiCoin.balanceOf(owner.address);

//   console.log(`💹 After Swap -> MEME: ${ethers.formatUnits(memeAfter, 18)}, STABLE: ${ethers.formatUnits(stableAfter, 18)}`);
    console.log(`💹 After Swap -> MEME: ${ethers.formatUnits(memeAfter, 18)}, STABLE: ${ethers.formatUnits(stableAfter, 18)}, NATIVE: ${ethers.formatUnits(nativeAfter, 18)}, DEFI: ${ethers.formatUnits(defiAfter, 18)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
