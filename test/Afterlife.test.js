const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const ARC_USDC = "0x3600000000000000000000000000000000000000";
const U = (n) => ethers.parseUnits(String(n), 6);
const MIN = 60;

describe("Afterlife", () => {
  let usdc, af, owner, a, b, c, rando;

  let snap;
  beforeEach(async () => {
    // isolate tests: the mock lives at a fixed address so storage must be reverted between tests
    if (snap) { await network.provider.send("evm_revert", [snap]); }
    snap = await network.provider.send("evm_snapshot");
    [owner, a, b, c, rando] = await ethers.getSigners();
    // Put the mock at the REAL Arc USDC address so the contract is exercised against 0x3600...0000
    const Mock = await ethers.getContractFactory("MockUSDC");
    const tmp = await Mock.deploy();
    const code = await ethers.provider.getCode(await tmp.getAddress());
    await network.provider.send("hardhat_setCode", [ARC_USDC, code]);
    usdc = await ethers.getContractAt("MockUSDC", ARC_USDC);
    const Af = await ethers.getContractFactory("Afterlife");
    af = await Af.deploy(ARC_USDC, MIN);
    await usdc.mint(owner.address, U(1000));
    await usdc.mint(rando.address, U(1000));
    await usdc.approve(await af.getAddress(), ethers.MaxUint256);
  });

  const mk = (opts = {}) =>
    af.createVault(
      opts.name ?? "My vault",
      opts.ben ?? [a.address, b.address],
      opts.shares ?? [6000, 4000],
      opts.window ?? 120,
      opts.deposit ?? U(10)
    );

  describe("create", () => {
    it("creates, funds in one tx and exposes state", async () => {
      await expect(mk()).to.emit(af, "VaultCreated").and.to.emit(af, "Deposited");
      const v = await af.getVault(1);
      expect(v.owner).to.equal(owner.address);
      expect(v.status).to.equal(1n);
      expect(v.balance).to.equal(U(10));
      expect(v.beneficiaries).to.deep.equal([a.address, b.address]);
      expect(await usdc.balanceOf(await af.getAddress())).to.equal(U(10));
      expect(await af.vaultsOfOwner(owner.address)).to.deep.equal([1n]);
      expect(await af.vaultsOfBeneficiary(a.address)).to.deep.equal([1n]);
    });
    it("can be created unfunded", async () => {
      await mk({ deposit: 0n });
      expect((await af.getVault(1)).balance).to.equal(0n);
    });
    it("validates inputs", async () => {
      await expect(mk({ name: "" })).to.be.revertedWithCustomError(af, "BadName");
      await expect(mk({ window: 59 })).to.be.revertedWithCustomError(af, "BadWindow");
      await expect(mk({ window: 3651 * 86400 })).to.be.revertedWithCustomError(af, "BadWindow");
      await expect(mk({ shares: [5000, 4000] })).to.be.revertedWithCustomError(af, "BadBeneficiaries");
      await expect(mk({ shares: [10000, 0], })).to.be.revertedWithCustomError(af, "BadBeneficiaries");
      await expect(mk({ ben: [a.address, a.address] })).to.be.revertedWithCustomError(af, "BadBeneficiaries");
      await expect(mk({ ben: [a.address, ethers.ZeroAddress] })).to.be.revertedWithCustomError(af, "BadBeneficiaries");
      await expect(mk({ ben: [a.address, owner.address] })).to.be.revertedWithCustomError(af, "BadBeneficiaries");
      await expect(mk({ ben: [], shares: [] })).to.be.revertedWithCustomError(af, "BadBeneficiaries");
      const many = Array.from({ length: 11 }, () => ethers.Wallet.createRandom().address);
      await expect(mk({ ben: many, shares: Array(11).fill(0).map((_, i) => (i < 10 ? 909 : 910)) })).to.be.revertedWithCustomError(af, "BadBeneficiaries");
    });
    it("reverts if funding without allowance", async () => {
      await usdc.approve(await af.getAddress(), 0);
      await expect(mk()).to.be.revertedWithCustomError(af, "TransferFailed");
    });
  });

  describe("heartbeat, deposit, withdraw", () => {
    beforeEach(mk);
    it("anyone can top up", async () => {
      await usdc.connect(rando).approve(await af.getAddress(), U(5));
      await expect(af.connect(rando).deposit(1, U(5))).to.emit(af, "Deposited");
      expect((await af.getVault(1)).balance).to.equal(U(15));
    });
    it("rejects zero deposits", async () => {
      await expect(af.deposit(1, 0)).to.be.revertedWithCustomError(af, "ZeroAmount");
    });
    it("only owner can check in; check in resets the timer", async () => {
      await expect(af.connect(a).checkIn(1)).to.be.revertedWithCustomError(af, "NotOwner");
      await time.increase(100);
      await af.checkIn(1);
      await time.increase(100);
      expect(await af.isExpired(1)).to.equal(false);
      await time.increase(30);
      expect(await af.isExpired(1)).to.equal(true);
    });
    it("owner can withdraw part and it counts as heartbeat", async () => {
      await time.increase(100);
      const before = await usdc.balanceOf(owner.address);
      await af.withdraw(1, U(4));
      expect((await usdc.balanceOf(owner.address)) - before).to.equal(U(4));
      expect((await af.getVault(1)).balance).to.equal(U(6));
      await time.increase(100);
      expect(await af.isExpired(1)).to.equal(false);
      await expect(af.withdraw(1, U(7))).to.be.revertedWithCustomError(af, "ZeroAmount");
      await expect(af.connect(a).withdraw(1, 1)).to.be.revertedWithCustomError(af, "NotOwner");
    });
    it("owner can update beneficiaries and close", async () => {
      await af.setBeneficiaries(1, [c.address], [10000]);
      expect((await af.getVault(1)).beneficiaries).to.deep.equal([c.address]);
      const before = await usdc.balanceOf(owner.address);
      await expect(af.close(1)).to.emit(af, "Closed");
      expect((await usdc.balanceOf(owner.address)) - before).to.equal(U(10));
      expect((await af.getVault(1)).status).to.equal(3n);
      await expect(af.checkIn(1)).to.be.revertedWithCustomError(af, "BadStatus");
      await expect(af.deposit(1, 1)).to.be.revertedWithCustomError(af, "BadStatus");
    });
  });

  describe("release & claim", () => {
    beforeEach(mk);
    it("cannot release while owner is alive", async () => {
      await expect(af.connect(rando).release(1)).to.be.revertedWithCustomError(af, "StillAlive");
      await time.increase(100);
      await expect(af.release(1)).to.be.revertedWithCustomError(af, "StillAlive");
    });
    it("owner can revive an expired vault until someone releases it", async () => {
      await time.increase(500);
      expect(await af.isExpired(1)).to.equal(true);
      await af.checkIn(1);
      expect(await af.isExpired(1)).to.equal(false);
      await expect(af.release(1)).to.be.revertedWithCustomError(af, "StillAlive");
    });
    it("anyone releases after the window; beneficiaries get exact shares; owner is locked out", async () => {
      await time.increase(121);
      await expect(af.connect(rando).release(1)).to.emit(af, "Released").withArgs(1, rando.address, U(10));
      await expect(af.checkIn(1)).to.be.revertedWithCustomError(af, "BadStatus");
      await expect(af.withdraw(1, 1)).to.be.revertedWithCustomError(af, "BadStatus");
      await expect(af.deposit(1, 1)).to.be.revertedWithCustomError(af, "BadStatus");
      await expect(af.release(1)).to.be.revertedWithCustomError(af, "BadStatus");

      await expect(af.connect(a).claim(1, 0)).to.emit(af, "Claimed").withArgs(1, 0, a.address, U(6));
      expect(await usdc.balanceOf(a.address)).to.equal(U(6));
      await expect(af.claim(1, 0)).to.be.revertedWithCustomError(af, "AlreadyClaimed");
      await expect(af.claim(1, 5)).to.be.revertedWithCustomError(af, "BadIndex");
      // a third party (relayer/friend) triggers B's payout: funds still go to B
      await af.connect(rando).claim(1, 1);
      expect(await usdc.balanceOf(b.address)).to.equal(U(4));
      expect(await usdc.balanceOf(await af.getAddress())).to.equal(0n);
      expect((await af.getVault(1)).claimedAmount).to.equal(U(10));
    });
    it("claimAll pays everyone in one tx", async () => {
      await time.increase(121);
      await af.release(1);
      await af.connect(rando).claimAll(1);
      expect(await usdc.balanceOf(a.address)).to.equal(U(6));
      expect(await usdc.balanceOf(b.address)).to.equal(U(4));
      await expect(af.release(1)).to.be.revertedWithCustomError(af, "BadStatus");
    });
    it("cannot claim before release", async () => {
      await expect(af.claim(1, 0)).to.be.revertedWithCustomError(af, "BadStatus");
      await expect(af.claimAll(1)).to.be.revertedWithCustomError(af, "BadStatus");
    });
    it("empty vault cannot be released", async () => {
      await af.createVault("empty", [a.address], [10000], 120, 0);
      await time.increase(121);
      await expect(af.release(2)).to.be.revertedWithCustomError(af, "NothingToRelease");
    });
    it("rounding dust goes to the last beneficiary; shares always sum to the total", async () => {
      await af.createVault("thirds", [a.address, b.address, c.address], [3333, 3333, 3334], 120, 1n + U(0)); // 1 micro-USDC
      await usdc.connect(rando).approve(await af.getAddress(), 10n);
      await af.connect(rando).deposit(2, 9n); // balance 10 micro-USDC
      await time.increase(121);
      await af.release(2);
      const s = [await af.shareOf(2, 0), await af.shareOf(2, 1), await af.shareOf(2, 2)];
      expect(s[0] + s[1] + s[2]).to.equal(10n);
      expect(s).to.deep.equal([3n, 3n, 4n]);
    });
    it("a blocklisted beneficiary cannot brick the others (claimAll skips; claim retries)", async () => {
      await time.increase(121);
      await af.release(1);
      await usdc.setBlocklisted(a.address, true);
      await af.claimAll(1);
      expect(await usdc.balanceOf(a.address)).to.equal(0n);
      expect(await usdc.balanceOf(b.address)).to.equal(U(4));
      await expect(af.claim(1, 0)).to.be.reverted; // still blocked, whole claim reverts, state untouched
      expect((await af.getVault(1)).claimedFlags).to.deep.equal([false, true]);
      await usdc.setBlocklisted(a.address, false);
      await af.claim(1, 0);
      expect(await usdc.balanceOf(a.address)).to.equal(U(6));
    });
    it("vault views: beneficiary discovery", async () => {
      expect(await af.vaultsOfBeneficiary(b.address)).to.deep.equal([1n]);
      expect(await af.vaultsOfBeneficiary(c.address)).to.deep.equal([]);
      await af.setBeneficiaries(1, [c.address], [10000]);
      expect(await af.vaultsOfBeneficiary(c.address)).to.deep.equal([1n]);
    });
  });

  describe("multiple vaults are independent", () => {
    it("one owner, two vaults, one released", async () => {
      await mk({ name: "A", window: 60 });
      await mk({ name: "B", window: 3600 });
      await time.increase(61);
      await af.release(1);
      await expect(af.release(2)).to.be.revertedWithCustomError(af, "StillAlive");
      expect((await af.getVault(2)).balance).to.equal(U(10));
      expect(await af.vaultsOfOwner(owner.address)).to.deep.equal([1n, 2n]);
    });
  });
});
