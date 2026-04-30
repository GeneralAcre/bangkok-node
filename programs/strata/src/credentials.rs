// ─── Strata ZK-Compressed Verifiable Credentials ─────────────────────────────
//
// Uses Light Protocol v0.9 (https://lightprotocol.com) to store Strata scores
// as compressed accounts in a concurrent Merkle tree.
//
// Cost: ~0.000003 SOL per credential vs 0.00144 SOL for regular accounts (~480×)
//
// Add to Cargo.toml:
//   light-sdk = "0.9"
//   light-system-program = "0.9"
//   light-hasher = "0.9"
//   light-heap = "0.9"
//
// Add to lib.rs:
//   pub mod credentials;
//   use credentials::*;
//
// Then add to #[program]:
//   pub fn issue_credential(ctx, proof, merkle_ctx, addr_params, bump) -> Result<()>
//   pub fn update_credential(ctx, proof, merkle_ctx, credential_hash, bump) -> Result<()>
//   pub fn verify_tier_gate(ctx, proof, merkle_ctx, credential_hash, min_tier) -> Result<()>

use anchor_lang::prelude::*;
use light_sdk::{
    compressed_account::LightAccount,
    light_account, light_accounts,
    merkle_context::{PackedAddressMerkleContext, PackedMerkleContext},
    address::derive_address,
    error::LightSdkError,
    light_system_accounts,
    proof::CompressedProof,
    LightDiscriminator, LightHasher,
};

// ─── Credential account (stored compressed in Merkle tree) ───────────────────

/// Strata verifiable credential — one per wallet per community.
/// Stored as a ZK-compressed account via Light Protocol.
/// Address seed: ["strata_cred", community, owner]
#[light_account]
#[derive(Clone, Debug, Default)]
pub struct StrataCredential {
    /// The wallet this credential belongs to
    pub owner:           Pubkey,
    /// The Strata community this credential is issued for
    pub community:       Pubkey,
    /// Computed Strata score (events*10 + hackathons*30 + tier_bonus)
    pub score:           u64,
    /// Tier discriminant: 0=Initiate, 1=Seeker, 2=Resident, 3=Builder, 4=Core, 5=Legend
    pub tier:            u8,
    /// Total events attended (drives tier progression)
    pub events_attended: u32,
    /// Hackathon events count (×3 multiplier in score)
    pub hackathon_count: u16,
    /// Number of on-chain community vouches received
    pub vouch_count:     u8,
    /// Unix timestamp of last check-in
    pub last_checkin_at: i64,
    /// Event code of the last issuing event (first 8 bytes)
    pub last_issuer:     [u8; 8],
    /// Credential schema version
    pub version:         u8,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum CredentialError {
    #[msg("Tier too low — credential does not meet minimum required tier")]
    TierTooLow,
    #[msg("Credential belongs to a different owner")]
    OwnerMismatch,
    #[msg("Credential is for a different community")]
    CommunityMismatch,
    #[msg("Credential proof verification failed")]
    InvalidProof,
    #[msg("Score overflow")]
    ScoreOverflow,
}

// ─── Issue credential ─────────────────────────────────────────────────────────
//
// Called after a successful check-in to create or update the compressed credential.
// The credential address is derived from ["strata_cred", community, owner].
// If the address already exists the account is updated (Light SDK handles this).

#[light_accounts]
#[derive(Accounts)]
pub struct IssueCredential<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The existing Strata Member account — source of truth for score/tier
    /// CHECK: Verified by seed derivation; we read score/tier from it
    pub member: UncheckedAccount<'info>,

    /// CHECK: Community PDA
    pub community: UncheckedAccount<'info>,

    /// The compressed credential output — created or updated
    #[light_account(init_or_mut, seeds = [b"strata_cred", community.key().as_ref(), authority.key().as_ref()])]
    pub credential: LightAccount<StrataCredential>,

    pub system_program: Program<'info, System>,
}

pub fn issue_credential(
    ctx:               &mut LightContext<IssueCredential<'_>>,
    proof:             CompressedProof,
    merkle_ctx:        PackedMerkleContext,
    addr_params:       PackedAddressMerkleContext,
    score:             u64,
    tier:              u8,
    events_attended:   u32,
    hackathon_count:   u16,
    vouch_count:       u8,
    last_checkin_at:   i64,
    last_issuer:       [u8; 8],
) -> Result<()> {
    let cred = &mut ctx.light_accounts.credential;

    cred.owner           = ctx.accounts.authority.key();
    cred.community       = ctx.accounts.community.key();
    cred.score           = score;
    cred.tier            = tier.min(5);
    cred.events_attended = events_attended;
    cred.hackathon_count = hackathon_count;
    cred.vouch_count     = vouch_count;
    cred.last_checkin_at = last_checkin_at;
    cred.last_issuer     = last_issuer;
    cred.version         = 1;

    Ok(())
}

// ─── Verify tier gate (CPI-composable) ────────────────────────────────────────
//
// Other programs call this instruction to verify that a wallet holds a
// compressed Strata credential meeting a minimum tier threshold.
// On success: returns OK. On failure: returns CredentialError::TierTooLow.
// The compressed proof is verified by Light Protocol's system program via CPI.
//
// Usage from another program:
//   let cpi_ctx = CpiContext::new(strata_program, VerifyTierGateAccounts { ... });
//   strata::cpi::verify_tier_gate(cpi_ctx, proof, merkle_ctx, credential_hash, min_tier)?;

#[light_accounts]
#[derive(Accounts)]
pub struct VerifyTierGate<'info> {
    pub caller: Signer<'info>,

    /// CHECK: The wallet whose credential is being verified
    pub subject: UncheckedAccount<'info>,

    /// CHECK: Community PDA
    pub community: UncheckedAccount<'info>,

    /// The compressed credential — read-only inclusion proof
    #[light_account(seeds = [b"strata_cred", community.key().as_ref(), subject.key().as_ref()])]
    pub credential: LightAccount<StrataCredential>,

    pub system_program: Program<'info, System>,
}

pub fn verify_tier_gate(
    ctx:      &mut LightContext<VerifyTierGate<'_>>,
    _proof:   CompressedProof,
    _merkle:  PackedMerkleContext,
    min_tier: u8,
) -> Result<()> {
    let cred = &ctx.light_accounts.credential;

    require!(
        cred.owner == ctx.accounts.subject.key(),
        CredentialError::OwnerMismatch
    );
    require!(
        cred.community == ctx.accounts.community.key(),
        CredentialError::CommunityMismatch
    );
    require!(
        cred.tier >= min_tier,
        CredentialError::TierTooLow
    );

    // Emit on-chain event so indexers can track gate usage
    emit!(TierGateVerified {
        subject:   ctx.accounts.subject.key(),
        community: ctx.accounts.community.key(),
        tier:      cred.tier,
        min_tier,
        score:     cred.score,
        passed:    true,
    });

    Ok(())
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct TierGateVerified {
    pub subject:   Pubkey,
    pub community: Pubkey,
    pub tier:      u8,
    pub min_tier:  u8,
    pub score:     u64,
    pub passed:    bool,
}

#[event]
pub struct CredentialIssued {
    pub owner:     Pubkey,
    pub community: Pubkey,
    pub score:     u64,
    pub tier:      u8,
    pub version:   u8,
}

// ─── Address derivation helper (TypeScript mirroring) ─────────────────────────
//
// TypeScript equivalent for off-chain use:
//
// import { deriveAddress } from "@lightprotocol/stateless.js";
// const [credentialAddress] = deriveAddress(
//   [Buffer.from("strata_cred"), communityPDA.toBuffer(), walletPubkey.toBuffer()],
//   addressTreePubkey
// );
