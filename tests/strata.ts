/**
 * Strata Integration Tests
 * Tests the full bounty lifecycle: create community → register members →
 * create bounty → claim → submit → approve → verify payouts & reputation
 */

import * as anchor from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("strata", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = anchor.workspace.Strata as any;

  // Test keypairs
  const communityAuthority = provider.wallet;
  const alice = Keypair.generate(); // bounty creator
  const bob = Keypair.generate();   // bounty claimant

  const COMMUNITY_NAME = "TestDAO";
  let communityPDA: PublicKey;
  let communityBump: number;
  let aliceMemberPDA: PublicKey;
  let bobMemberPDA: PublicKey;
  let bountyPDA: PublicKey;
  let escrowPDA: PublicKey;

  // ── Setup: Airdrop SOL to test wallets ──

  before(async () => {
    // Derive PDAs
    [communityPDA, communityBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("community"),
        communityAuthority.publicKey.toBuffer(),
        Buffer.from(COMMUNITY_NAME),
      ],
      program.programId
    );

    [aliceMemberPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPDA.toBuffer(), alice.publicKey.toBuffer()],
      program.programId
    );

    [bobMemberPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPDA.toBuffer(), bob.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop SOL
    const airdropAlice = await provider.connection.requestAirdrop(
      alice.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropAlice);

    const airdropBob = await provider.connection.requestAirdrop(
      bob.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropBob);
  });

  // ── Test 1: Initialize Community ──

  it("initializes a community", async () => {
    await program.methods
      .initializeCommunity(COMMUNITY_NAME, "A test DAO for Strata hackathon")
      .accounts({
        community: communityPDA,
        authority: communityAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const community = await program.account.community.fetch(communityPDA);
    assert.equal(community.name, COMMUNITY_NAME);
    assert.equal(community.memberCount.toNumber(), 0);
    assert.equal(community.bountyCount.toNumber(), 0);
    assert.equal(
      community.authority.toBase58(),
      communityAuthority.publicKey.toBase58()
    );
  });

  // ── Test 2: Register Members ──

  it("registers Alice as a member", async () => {
    await program.methods
      .registerMember("alice_dev", ["rust", "solana", "typescript"])
      .accounts({
        community: communityPDA,
        member: aliceMemberPDA,
        wallet: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([alice])
      .rpc();

    const member = await program.account.member.fetch(aliceMemberPDA);
    assert.equal(member.username, "alice_dev");
    assert.equal(member.skills.length, 3);
    assert.equal(member.reputationScore.toNumber(), 0);

    const community = await program.account.community.fetch(communityPDA);
    assert.equal(community.memberCount.toNumber(), 1);
  });

  it("registers Bob as a member", async () => {
    await program.methods
      .registerMember("bob_builder", ["react", "defi", "anchor"])
      .accounts({
        community: communityPDA,
        member: bobMemberPDA,
        wallet: bob.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bob])
      .rpc();

    const member = await program.account.member.fetch(bobMemberPDA);
    assert.equal(member.username, "bob_builder");

    const community = await program.account.community.fetch(communityPDA);
    assert.equal(community.memberCount.toNumber(), 2);
  });

  // ── Test 3: Create Bounty with Escrow ──

  it("Alice creates a bounty with 1 SOL escrow", async () => {
    const bountyIndex = 0;
    const indexBuffer = Buffer.alloc(8);
    indexBuffer.writeBigUInt64LE(BigInt(bountyIndex));

    [bountyPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bounty"), communityPDA.toBuffer(), indexBuffer],
      program.programId
    );

    [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), communityPDA.toBuffer(), indexBuffer],
      program.programId
    );

    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24h from now
    const amountLamports = new anchor.BN(1 * LAMPORTS_PER_SOL);

    const aliceBalanceBefore = await provider.connection.getBalance(alice.publicKey);

    await program.methods
      .createBounty(
        "Build Strata Frontend",
        "Create a React dashboard for the Strata bounty system with wallet connection",
        ["react", "typescript"],
        new anchor.BN(deadline),
        amountLamports
      )
      .accounts({
        community: communityPDA,
        bounty: bountyPDA,
        escrowVault: escrowPDA,
        creatorMember: aliceMemberPDA,
        creator: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([alice])
      .rpc();

    // Verify bounty state
    const bounty = await program.account.bounty.fetch(bountyPDA);
    assert.equal(bounty.title, "Build Strata Frontend");
    assert.equal(bounty.amountLamports.toNumber(), LAMPORTS_PER_SOL);
    assert.ok(bounty.status.open);
    assert.isNull(bounty.claimant);

    // Verify escrow received funds
    const escrowBalance = await provider.connection.getBalance(escrowPDA);
    assert.equal(escrowBalance, LAMPORTS_PER_SOL);

    // Verify community stats
    const community = await program.account.community.fetch(communityPDA);
    assert.equal(community.bountyCount.toNumber(), 1);
    assert.equal(community.totalFunded.toNumber(), LAMPORTS_PER_SOL);
  });

  // ── Test 4: Claim Bounty ──

  it("Bob claims the bounty", async () => {
    await program.methods
      .claimBounty()
      .accounts({
        bounty: bountyPDA,
        claimantMember: bobMemberPDA,
        claimant: bob.publicKey,
      })
      .signers([bob])
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPDA);
    assert.ok(bounty.status.inProgress);
    assert.equal(bounty.claimant.toBase58(), bob.publicKey.toBase58());
  });

  // ── Test 5: Submit Work ──

  it("Bob submits work", async () => {
    await program.methods
      .submitBounty("https://github.com/bob/strata-frontend/pull/1")
      .accounts({
        bounty: bountyPDA,
        claimant: bob.publicKey,
      })
      .signers([bob])
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPDA);
    assert.ok(bounty.status.underReview);
    assert.equal(
      bounty.submissionUri,
      "https://github.com/bob/strata-frontend/pull/1"
    );
  });

  // ── Test 6: Copilot Review ──

  it("Copilot (authority) reviews the submission", async () => {
    await program.methods
      .copilotReview(true, "Code quality good. Tests pass. PR meets requirements.")
      .accounts({
        community: communityPDA,
        bounty: bountyPDA,
        authority: communityAuthority.publicKey,
      })
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPDA);
    assert.isTrue(bounty.copilotApproved);
  });

  // ── Test 7: Approve & Pay Out ──

  it("Alice approves bounty, Bob receives SOL + reputation", async () => {
    const bobBalanceBefore = await provider.connection.getBalance(bob.publicKey);
    const bobMemberBefore = await program.account.member.fetch(bobMemberPDA);

    await program.methods
      .approveBounty()
      .accounts({
        community: communityPDA,
        bounty: bountyPDA,
        escrowVault: escrowPDA,
        claimant: bob.publicKey,
        claimantMember: bobMemberPDA,
        approver: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([alice])
      .rpc();

    // Verify bounty completed
    const bounty = await program.account.bounty.fetch(bountyPDA);
    assert.ok(bounty.status.completed);

    // Verify Bob received SOL
    const bobBalanceAfter = await provider.connection.getBalance(bob.publicKey);
    assert.equal(bobBalanceAfter - bobBalanceBefore, LAMPORTS_PER_SOL);

    // Verify Bob's reputation increased
    const bobMemberAfter = await program.account.member.fetch(bobMemberPDA);
    assert.isAbove(
      bobMemberAfter.reputationScore.toNumber(),
      bobMemberBefore.reputationScore.toNumber()
    );
    assert.equal(bobMemberAfter.bountiesCompleted.toNumber(), 1);
    assert.equal(bobMemberAfter.totalEarned.toNumber(), LAMPORTS_PER_SOL);

    // Verify community stats
    const community = await program.account.community.fetch(communityPDA);
    assert.equal(community.totalPaidOut.toNumber(), LAMPORTS_PER_SOL);

    console.log("\n✅ Full lifecycle complete!");
    console.log(`   Bob's reputation: ${bobMemberAfter.reputationScore.toNumber()}`);
    console.log(`   Bob's earnings: ${bobMemberAfter.totalEarned.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Community funded: ${community.totalFunded.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Community paid out: ${community.totalPaidOut.toNumber() / LAMPORTS_PER_SOL} SOL`);
  });

  // ── Test 8: Error Cases ──

  it("rejects claiming own bounty", async () => {
    // Create a second bounty by Alice
    const bountyIndex = 1;
    const indexBuffer = Buffer.alloc(8);
    indexBuffer.writeBigUInt64LE(BigInt(bountyIndex));

    const [bounty2PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bounty"), communityPDA.toBuffer(), indexBuffer],
      program.programId
    );
    const [escrow2PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), communityPDA.toBuffer(), indexBuffer],
      program.programId
    );

    const deadline = Math.floor(Date.now() / 1000) + 86400;

    await program.methods
      .createBounty(
        "Self-claim test",
        "Testing self-claim rejection",
        ["test"],
        new anchor.BN(deadline),
        new anchor.BN(0.1 * LAMPORTS_PER_SOL)
      )
      .accounts({
        community: communityPDA,
        bounty: bounty2PDA,
        escrowVault: escrow2PDA,
        creatorMember: aliceMemberPDA,
        creator: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([alice])
      .rpc();

    // Alice tries to claim her own bounty
    try {
      await program.methods
        .claimBounty()
        .accounts({
          bounty: bounty2PDA,
          claimantMember: aliceMemberPDA,
          claimant: alice.publicKey,
        })
        .signers([alice])
        .rpc();
      assert.fail("Should have thrown CannotClaimOwnBounty");
    } catch (err: any) {
      assert.include(err.message, "CannotClaimOwnBounty");
    }
  });
});
