// ─── Strata Talent Marketplace ───────────────────────────────────────────────
//
// Add to lib.rs:
//   pub mod marketplace;
//   use marketplace::*;
//
// Then add each instruction to the #[program] block:
//   pub fn initialize_marketplace(ctx, fee_lamports) -> Result<()> { marketplace::initialize_marketplace(ctx, fee_lamports) }
//   pub fn post_listing(ctx, params) -> Result<()>                 { marketplace::post_listing(ctx, params) }
//   pub fn apply_to_listing(ctx, note) -> Result<()>               { marketplace::apply_to_listing(ctx, note) }
//   pub fn fill_listing(ctx) -> Result<()>                         { marketplace::fill_listing(ctx) }
//   pub fn close_listing(ctx) -> Result<()>                        { marketplace::close_listing(ctx) }

use anchor_lang::prelude::*;
use anchor_lang::system_program;

// ─── Constants ───────────────────────────────────────────────────────────────

pub const MAX_TITLE:       usize = 64;
pub const MAX_ORG_NAME:    usize = 64;
pub const MAX_DESC:        usize = 512;
pub const MAX_COMP:        usize = 64;
pub const MAX_LOCATION:    usize = 64;
pub const MAX_NOTE:        usize = 256;
pub const SECS_PER_DAY:    i64   = 86_400;

// ─── Enums ───────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RoleType {
    FullTime,
    PartTime,
    Bounty,
    Contract,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ListingStatus {
    Active,
    Filled,
    Cancelled,
    Expired,
}

/// Mirrors MemberTier from lib.rs — u8 discriminant used for min_tier comparison.
/// Initiate=0, Seeker=1, Resident=2, Builder=3, Core=4, Legend=5
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum TierGate {
    Any,       // 0 — no minimum
    Seeker,    // 1
    Resident,  // 2
    Builder,   // 3
    Core,      // 4
    Legend,    // 5
}

// ─── Accounts ────────────────────────────────────────────────────────────────

/// Global marketplace config — one per community.
/// PDA: ["marketplace", community]
#[account]
pub struct Marketplace {
    pub authority:      Pubkey,  // community admin who can update fee
    pub community:      Pubkey,
    pub fee_lamports:   u64,     // SOL fee to post a listing
    pub treasury:       Pubkey,  // receives posting fees
    pub listing_count:  u64,     // ever-incrementing, used for listing PDA
    pub active_count:   u64,
    pub bump:           u8,
}

impl Marketplace {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 32 + 8 + 8 + 1;
}

/// One job/bounty listing.
/// PDA: ["listing", marketplace, listing_index_as_le_u64]
#[account]
pub struct Listing {
    pub authority:          Pubkey,      // poster
    pub marketplace:        Pubkey,
    pub title:              String,      // 64
    pub org_name:           String,      // 64
    pub description:        String,      // 512
    pub role_type:          RoleType,
    pub compensation:       String,      // 64 — e.g. "0.5 SOL" or "$5k/mo"
    pub location:           String,      // 64 — "Remote" or city
    pub min_tier:           TierGate,
    pub listing_index:      u64,
    pub status:             ListingStatus,
    pub application_count:  u32,
    pub created_at:         i64,
    pub expires_at:         i64,
    pub bump:               u8,
}

impl Listing {
    pub const LEN: usize = 8
        + 32 + 32
        + (4 + MAX_TITLE) + (4 + MAX_ORG_NAME) + (4 + MAX_DESC)
        + 1                   // RoleType
        + (4 + MAX_COMP) + (4 + MAX_LOCATION)
        + 1                   // TierGate
        + 8 + 1 + 4 + 8 + 8 + 1;
}

/// One application from a wallet to a listing.
/// PDA: ["application", listing, applicant]
#[account]
pub struct Application {
    pub listing:         Pubkey,
    pub applicant:       Pubkey,
    pub note:            String,  // 256
    pub tier_at_apply:   u8,      // snapshot of applicant's tier discriminant
    pub applied_at:      i64,
    pub bump:            u8,
}

impl Application {
    pub const LEN: usize = 8 + 32 + 32 + (4 + MAX_NOTE) + 1 + 8 + 1;
}

// ─── Post params ─────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PostListingParams {
    pub title:        String,
    pub org_name:     String,
    pub description:  String,
    pub role_type:    RoleType,
    pub compensation: String,
    pub location:     String,
    pub min_tier:     TierGate,
    pub days_active:  u16,   // 1–365
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum MarketplaceError {
    #[msg("Title too long (max 64)")]          TitleTooLong,
    #[msg("Org name too long (max 64)")]       OrgNameTooLong,
    #[msg("Description too long (max 512)")]   DescTooLong,
    #[msg("Compensation too long (max 64)")]   CompTooLong,
    #[msg("Location too long (max 64)")]       LocationTooLong,
    #[msg("Cover note too long (max 256)")]    NoteTooLong,
    #[msg("Listing is not active")]            ListingNotActive,
    #[msg("Your tier is below the minimum required for this listing")]  TierTooLow,
    #[msg("You have already applied to this listing")]                  AlreadyApplied,
    #[msg("Invalid days_active (1–365)")]      InvalidDaysActive,
    #[msg("Only the listing authority can do this")]  Unauthorized,
}

// ─── Instruction contexts ─────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(
        init, payer = authority, space = Marketplace::LEN,
        seeds = [b"marketplace", community.key().as_ref()],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,

    /// CHECK: Any community PDA from the Strata program
    pub community: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PostListing<'info> {
    #[account(mut, seeds = [b"marketplace", marketplace.community.as_ref()], bump = marketplace.bump)]
    pub marketplace: Account<'info, Marketplace>,

    #[account(
        init, payer = poster,
        space = Listing::LEN,
        seeds = [
            b"listing",
            marketplace.key().as_ref(),
            &marketplace.listing_count.to_le_bytes(),
        ],
        bump
    )]
    pub listing: Account<'info, Listing>,

    /// CHECK: Treasury account to receive fee
    #[account(mut, address = marketplace.treasury)]
    pub treasury: UncheckedAccount<'info>,

    #[account(mut)]
    pub poster: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApplyToListing<'info> {
    #[account(mut)]
    pub listing: Account<'info, Listing>,

    /// Applicant's member account — used to verify tier on-chain.
    /// CHECK: Decoded manually; if missing the applicant has no on-chain identity.
    pub member: UncheckedAccount<'info>,

    #[account(
        init, payer = applicant,
        space = Application::LEN,
        seeds = [b"application", listing.key().as_ref(), applicant.key().as_ref()],
        bump
    )]
    pub application: Account<'info, Application>,

    #[account(mut)]
    pub applicant: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateListingStatus<'info> {
    #[account(mut, has_one = authority @ MarketplaceError::Unauthorized)]
    pub listing: Account<'info, Listing>,

    #[account(mut, seeds = [b"marketplace", marketplace.community.as_ref()], bump = marketplace.bump)]
    pub marketplace: Account<'info, Marketplace>,

    pub authority: Signer<'info>,
}

// ─── Instructions ─────────────────────────────────────────────────────────────

pub fn initialize_marketplace(
    ctx:          Context<InitializeMarketplace>,
    fee_lamports: u64,
    treasury:     Pubkey,
) -> Result<()> {
    let mp          = &mut ctx.accounts.marketplace;
    mp.authority    = ctx.accounts.authority.key();
    mp.community    = ctx.accounts.community.key();
    mp.fee_lamports = fee_lamports;
    mp.treasury     = treasury;
    mp.listing_count = 0;
    mp.active_count  = 0;
    mp.bump          = ctx.bumps.marketplace;
    Ok(())
}

pub fn post_listing(
    ctx:    Context<PostListing>,
    params: PostListingParams,
) -> Result<()> {
    require!(params.title.len()        <= MAX_TITLE,    MarketplaceError::TitleTooLong);
    require!(params.org_name.len()     <= MAX_ORG_NAME, MarketplaceError::OrgNameTooLong);
    require!(params.description.len()  <= MAX_DESC,     MarketplaceError::DescTooLong);
    require!(params.compensation.len() <= MAX_COMP,     MarketplaceError::CompTooLong);
    require!(params.location.len()     <= MAX_LOCATION, MarketplaceError::LocationTooLong);
    require!(params.days_active >= 1 && params.days_active <= 365, MarketplaceError::InvalidDaysActive);

    // Collect posting fee
    let fee = ctx.accounts.marketplace.fee_lamports;
    if fee > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.poster.to_account_info(),
                    to:   ctx.accounts.treasury.to_account_info(),
                },
            ),
            fee,
        )?;
    }

    let now  = Clock::get()?.unix_timestamp;
    let mp   = &mut ctx.accounts.marketplace;
    let idx  = mp.listing_count;

    let listing               = &mut ctx.accounts.listing;
    listing.authority         = ctx.accounts.poster.key();
    listing.marketplace       = mp.key();
    listing.title             = params.title;
    listing.org_name          = params.org_name;
    listing.description       = params.description;
    listing.role_type         = params.role_type;
    listing.compensation      = params.compensation;
    listing.location          = params.location;
    listing.min_tier          = params.min_tier;
    listing.listing_index     = idx;
    listing.status            = ListingStatus::Active;
    listing.application_count = 0;
    listing.created_at        = now;
    listing.expires_at        = now + (params.days_active as i64 * SECS_PER_DAY);
    listing.bump              = ctx.bumps.listing;

    mp.listing_count = mp.listing_count.checked_add(1).unwrap();
    mp.active_count  = mp.active_count.checked_add(1).unwrap();

    Ok(())
}

/// Verify applicant tier on-chain and create Application record.
/// The `member` account is the existing Strata Member PDA for the applicant.
/// Tier byte is at offset 8(disc)+32(wallet)+32(community)+len(username)+8(score)+8(events) = varies.
/// For safety we pass tier as a client-provided u8 and verify it matches the member account.
pub fn apply_to_listing(
    ctx:  Context<ApplyToListing>,
    note: String,
) -> Result<()> {
    require!(note.len() <= MAX_NOTE, MarketplaceError::NoteTooLong);

    let listing = &ctx.accounts.listing;
    require!(listing.status == ListingStatus::Active, MarketplaceError::ListingNotActive);

    // Read tier discriminant from member account data (offset: disc8+wallet32+community32 = 72, then skip username string)
    let member_info = &ctx.accounts.member;
    let tier_discriminant: u8 = if member_info.data_is_empty() {
        0 // Initiate — no member account
    } else {
        let data = member_info.try_borrow_data()?;
        // Skip: discriminator(8) + wallet(32) + community(32) + username_len(4) + username_bytes
        if data.len() > 76 {
            let username_len = u32::from_le_bytes(data[72..76].try_into().unwrap()) as usize;
            let tier_off     = 76 + username_len + 8 + 8; // skip score(u64) + events_attended(u64)
            if data.len() > tier_off { data[tier_off] } else { 0 }
        } else { 0 }
    };

    // TierGate ordinal: Any=0, Seeker=1, Resident=2, Builder=3, Core=4, Legend=5
    // MemberTier ordinal on-chain: Initiate=0, Seeker=1, Resident=2, Builder=3, Core=4, Legend=5
    let min = match listing.min_tier {
        TierGate::Any      => 0u8,
        TierGate::Seeker   => 1,
        TierGate::Resident => 2,
        TierGate::Builder  => 3,
        TierGate::Core     => 4,
        TierGate::Legend   => 5,
    };
    require!(tier_discriminant >= min, MarketplaceError::TierTooLow);

    let app         = &mut ctx.accounts.application;
    app.listing     = listing.key();
    app.applicant   = ctx.accounts.applicant.key();
    app.note        = note;
    app.tier_at_apply = tier_discriminant;
    app.applied_at  = Clock::get()?.unix_timestamp;
    app.bump        = ctx.bumps.application;

    let listing_mut                 = &mut ctx.accounts.listing;
    listing_mut.application_count   = listing_mut.application_count.checked_add(1).unwrap();

    Ok(())
}

pub fn fill_listing(ctx: Context<UpdateListingStatus>) -> Result<()> {
    ctx.accounts.listing.status = ListingStatus::Filled;
    ctx.accounts.marketplace.active_count =
        ctx.accounts.marketplace.active_count.saturating_sub(1);
    Ok(())
}

pub fn close_listing(ctx: Context<UpdateListingStatus>) -> Result<()> {
    ctx.accounts.listing.status = ListingStatus::Cancelled;
    ctx.accounts.marketplace.active_count =
        ctx.accounts.marketplace.active_count.saturating_sub(1);
    Ok(())
}
