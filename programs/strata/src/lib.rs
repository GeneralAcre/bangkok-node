use anchor_lang::prelude::*;

declare_id!("StrataPresenceProtocol111111111111111111111");

#[program]
pub mod strata {
    use super::*;

    // ─── DAO / Community ────────────────────────────────────────────────

    /// Initialize a new Strata DAO community
    pub fn initialize_community(
        ctx: Context<InitializeCommunity>,
        name: String,
        description: String,
        country: String,
    ) -> Result<()> {
        require!(name.len() <= 64, StrataError::NameTooLong);
        require!(description.len() <= 256, StrataError::DescriptionTooLong);
        require!(country.len() <= 64, StrataError::NameTooLong);

        let community = &mut ctx.accounts.community;
        community.authority    = ctx.accounts.authority.key();
        community.name         = name;
        community.description  = description;
        community.country      = country;
        community.member_count = 0;
        community.event_count  = 0;
        community.total_checkins = 0;
        community.bump         = ctx.bumps.community;
        community.created_at   = Clock::get()?.unix_timestamp;

        emit!(CommunityCreated {
            community: community.key(),
            authority: community.authority,
            name: community.name.clone(),
            country: community.country.clone(),
        });

        Ok(())
    }

    // ─── Member / Identity ──────────────────────────────────────────────

    /// Register as a DAO resident — creates on-chain identity
    pub fn register_member(
        ctx: Context<RegisterMember>,
        username: String,
    ) -> Result<()> {
        require!(username.len() <= 32, StrataError::NameTooLong);

        let member           = &mut ctx.accounts.member;
        member.wallet        = ctx.accounts.wallet.key();
        member.community     = ctx.accounts.community.key();
        member.username      = username;
        member.reputation_score  = 0;
        member.events_attended   = 0;
        member.tier          = MemberTier::Initiate;
        member.bump          = ctx.bumps.member;
        member.joined_at     = Clock::get()?.unix_timestamp;
        member.last_active   = Clock::get()?.unix_timestamp;

        let community = &mut ctx.accounts.community;
        community.member_count = community.member_count.checked_add(1).unwrap();

        emit!(MemberRegistered {
            member: member.key(),
            wallet: member.wallet,
            community: community.key(),
            username: member.username.clone(),
        });

        Ok(())
    }

    /// Update reputation (called by authority or Copilot agent)
    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        new_score: u64,
        reason: String,
    ) -> Result<()> {
        require!(reason.len() <= 128, StrataError::DescriptionTooLong);

        let member = &mut ctx.accounts.member;
        let old_score = member.reputation_score;
        member.reputation_score = new_score;
        member.tier = MemberTier::from_score(new_score, member.events_attended);
        member.last_active = Clock::get()?.unix_timestamp;

        emit!(ReputationUpdated {
            member: member.key(),
            old_score,
            new_score,
            reason,
        });

        Ok(())
    }

    // ─── Event Lifecycle ────────────────────────────────────────────────

    /// Create an on-chain event — SOL entry fee escrowed if set
    pub fn create_event(
        ctx: Context<CreateEvent>,
        title: String,
        description: String,
        location: String,
        country: String,
        event_date: i64,
        capacity: u64,
        entry_fee_lamports: u64,
        event_code: String,   // 8-char code embedded in QR
        is_hackathon: bool,
    ) -> Result<()> {
        require!(title.len() <= 64, StrataError::NameTooLong);
        require!(description.len() <= 512, StrataError::DescriptionTooLong);
        require!(location.len() <= 128, StrataError::DescriptionTooLong);
        require!(country.len() <= 64, StrataError::NameTooLong);
        require!(event_code.len() == 8, StrataError::InvalidEventCode);
        require!(capacity > 0, StrataError::InvalidAmount);
        require!(
            event_date > Clock::get()?.unix_timestamp,
            StrataError::InvalidDeadline
        );

        let event = &mut ctx.accounts.event;
        let community = &mut ctx.accounts.community;

        event.community          = community.key();
        event.organizer          = ctx.accounts.organizer.key();
        event.title              = title;
        event.description        = description;
        event.location           = location;
        event.country            = country;
        event.event_date         = event_date;
        event.capacity           = capacity;
        event.attendee_count     = 0;
        event.entry_fee_lamports = entry_fee_lamports;
        event.event_code         = event_code;
        event.status             = EventStatus::Upcoming;
        event.event_index        = community.event_count;
        event.escrow_bump        = ctx.bumps.escrow_vault;
        event.bump               = ctx.bumps.event;
        event.created_at         = Clock::get()?.unix_timestamp;
        event.is_hackathon       = is_hackathon;

        community.event_count = community.event_count.checked_add(1).unwrap();

        emit!(EventCreated {
            event: event.key(),
            community: community.key(),
            organizer: event.organizer,
            title: event.title.clone(),
            location: event.location.clone(),
            country: event.country.clone(),
            event_date,
            capacity,
        });

        Ok(())
    }

    /// Go live — organizer opens check-ins
    pub fn start_event(ctx: Context<ManageEvent>) -> Result<()> {
        let event = &mut ctx.accounts.event;
        require!(
            event.status == EventStatus::Upcoming,
            StrataError::InvalidEventStatus
        );
        event.status = EventStatus::Live;

        emit!(EventStatusChanged {
            event: event.key(),
            status: EventStatus::Live,
        });

        Ok(())
    }

    /// Check in — verify event_code + organizer Ed25519 co-signature → create Attendance record
    /// Transaction must have [Ed25519VerifyIx, CheckInIx] — the Ed25519 ix is verified here.
    pub fn check_in(
        ctx: Context<CheckIn>,
        event_code: String,
        expiry: i64,
    ) -> Result<()> {
        let event = &ctx.accounts.event;
        let clock  = Clock::get()?;

        // Only accept Live events — organizer must explicitly call start_event
        require!(event.status == EventStatus::Live, StrataError::EventNotLive);

        // Event code check (anti-sybil: must physically scan QR)
        require!(event.event_code == event_code, StrataError::InvalidEventCode);

        // Capacity check
        require!(event.attendee_count < event.capacity, StrataError::EventFull);

        // QR expiry: organizer controls validity window when they go live
        require!(clock.unix_timestamp < expiry, StrataError::SignatureExpired);

        // Ed25519 organizer co-signature must be at instruction index 0 in this tx
        {
            let ix_sysvar = ctx.accounts.instructions.to_account_info();
            let ed25519_ix = anchor_lang::solana_program::sysvar::instructions
                ::load_instruction_at_checked(0, &ix_sysvar)
                .map_err(|_| error!(StrataError::MissingOrganizerSignature))?;
            require!(
                ed25519_ix.program_id == anchor_lang::solana_program::ed25519_program::id(),
                StrataError::MissingOrganizerSignature
            );
            let expected_msg = format!("signal_checkin:{}:{}", event_code, expiry);
            verify_ed25519_ix(&ed25519_ix.data, &event.organizer, expected_msg.as_bytes())?;
        }


        // Create attendance record (Proof of Presence)
        let attendance = &mut ctx.accounts.attendance;
        attendance.event          = event.key();
        attendance.attendee       = ctx.accounts.attendee.key();
        attendance.edition        = event.attendee_count.checked_add(1).unwrap();
        attendance.checked_in_at  = clock.unix_timestamp;
        attendance.nft_mint       = None;
        attendance.bump           = ctx.bumps.attendance;

        // Update event count
        let event_mut = &mut ctx.accounts.event;
        event_mut.attendee_count = event_mut.attendee_count.checked_add(1).unwrap();

        // Update member: attendance count + reputation
        let member = &mut ctx.accounts.member;
        member.events_attended = member.events_attended.checked_add(1).unwrap();
        member.last_active     = clock.unix_timestamp;

        let reputation_bonus = reputation_for_attendance(member.events_attended);
        member.reputation_score = member
            .reputation_score
            .checked_add(reputation_bonus)
            .unwrap();
        member.tier = MemberTier::from_score(member.reputation_score, member.events_attended);

        // Update community total
        let community = &mut ctx.accounts.community;
        community.total_checkins = community.total_checkins.checked_add(1).unwrap();

        emit!(AttendanceVerified {
            event: event_mut.key(),
            attendee: attendance.attendee,
            edition: attendance.edition,
            checked_in_at: attendance.checked_in_at,
            reputation_bonus,
            new_tier: member.tier.clone(),
        });

        Ok(())
    }

    /// Record the cNFT mint address against an attendance record (called after Bubblegum mint)
    pub fn record_nft_mint(
        ctx: Context<RecordNftMint>,
        nft_mint: Pubkey,
    ) -> Result<()> {
        let attendance = &mut ctx.accounts.attendance;
        require!(attendance.nft_mint.is_none(), StrataError::NftAlreadyMinted);
        attendance.nft_mint = Some(nft_mint);

        emit!(NftMinted {
            event: attendance.event,
            attendee: attendance.attendee,
            nft_mint,
            edition: attendance.edition,
        });

        Ok(())
    }

    /// End the event — organizer closes check-ins
    pub fn end_event(ctx: Context<ManageEvent>) -> Result<()> {
        let event = &mut ctx.accounts.event;
        require!(
            event.status == EventStatus::Live,
            StrataError::InvalidEventStatus
        );
        event.status = EventStatus::Ended;

        emit!(EventStatusChanged {
            event: event.key(),
            status: EventStatus::Ended,
        });

        Ok(())
    }

    /// Copilot scores the event quality (logged on-chain via this instruction)
    pub fn copilot_score_event(
        ctx: Context<CopilotScoreEvent>,
        score: u8,
        reasoning: String,
    ) -> Result<()> {
        require!(score <= 100, StrataError::InvalidAmount);
        require!(reasoning.len() <= 512, StrataError::DescriptionTooLong);

        emit!(EventCopilotScored {
            event: ctx.accounts.event.key(),
            score,
            reasoning,
        });

        Ok(())
    }
}

// ─── Signature helpers ──────────────────────────────────────────────────────

/// Verify that the embedded pubkey and message in an Ed25519Program instruction match
/// expectations. Layout (all u16 LE): num_sigs(2) | pad(2) | sig_off(2) | sig_ix(2) |
/// pk_off(2) | pk_ix(2) | msg_off(2) | msg_sz(2) | msg_ix(2) | [pubkey][sig][message]
fn verify_ed25519_ix(data: &[u8], expected_pubkey: &Pubkey, expected_msg: &[u8]) -> Result<()> {
    require!(data.len() >= 18, StrataError::InvalidOrganizerSignature);
    let num_sigs      = u16::from_le_bytes([data[0], data[1]]);
    require!(num_sigs >= 1, StrataError::MissingOrganizerSignature);
    let pubkey_offset = u16::from_le_bytes([data[8],  data[9]])  as usize;
    let msg_offset    = u16::from_le_bytes([data[12], data[13]]) as usize;
    let msg_size      = u16::from_le_bytes([data[14], data[15]]) as usize;
    require!(data.len() >= pubkey_offset + 32,   StrataError::InvalidOrganizerSignature);
    require!(data.len() >= msg_offset + msg_size, StrataError::InvalidOrganizerSignature);
    require!(
        &data[pubkey_offset..pubkey_offset + 32] == expected_pubkey.as_ref(),
        StrataError::InvalidOrganizerSignature
    );
    require!(
        &data[msg_offset..msg_offset + msg_size] == expected_msg,
        StrataError::InvalidOrganizerSignature
    );
    Ok(())
}

// ─── Reputation helpers ─────────────────────────────────────────────────────

/// Reputation points awarded per attendance (scales with total events attended)
fn reputation_for_attendance(events_attended: u64) -> u64 {
    match events_attended {
        1..=2  => 10,
        3..=5  => 15,
        6..=10 => 20,
        _      => 25,
    }
}

// ─── Account Structures ─────────────────────────────────────────────────────

#[account]
pub struct Community {
    pub authority:       Pubkey,
    pub name:            String,   // max 64
    pub description:     String,   // max 256
    pub country:         String,   // max 64
    pub member_count:    u64,
    pub event_count:     u64,
    pub total_checkins:  u64,
    pub bump:            u8,
    pub created_at:      i64,
}

#[account]
pub struct Member {
    pub wallet:            Pubkey,
    pub community:         Pubkey,
    pub username:          String,   // max 32
    pub reputation_score:  u64,
    pub events_attended:   u64,
    pub tier:              MemberTier,
    pub bump:              u8,
    pub joined_at:         i64,
    pub last_active:       i64,
}

#[account]
pub struct Event {
    pub community:          Pubkey,
    pub organizer:          Pubkey,
    pub title:              String,   // max 64
    pub description:        String,   // max 512
    pub location:           String,   // max 128
    pub country:            String,   // max 64
    pub event_date:         i64,
    pub capacity:           u64,
    pub attendee_count:     u64,
    pub entry_fee_lamports: u64,
    pub event_code:         String,   // exactly 8 chars — embedded in QR
    pub status:             EventStatus,
    pub event_index:        u64,
    pub escrow_bump:        u8,
    pub bump:               u8,
    pub created_at:         i64,
    pub is_hackathon:       bool,
}

/// Created once per (event, attendee) — the on-chain Proof of Presence
#[account]
pub struct Attendance {
    pub event:          Pubkey,
    pub attendee:       Pubkey,
    pub edition:        u64,          // attendance number (1st, 2nd … Nth person)
    pub checked_in_at:  i64,
    pub nft_mint:       Option<Pubkey>, // set after Bubblegum cNFT minted
    pub bump:           u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EventStatus {
    Upcoming,
    Live,
    Ended,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MemberTier {
    Initiate,    // 0 events
    Seeker,      // 1–2
    Resident,    // 3–5
    Builder,     // 6–10
    Core,        // 11–20
    Legend,      // 21+
}

impl MemberTier {
    pub fn from_score(_score: u64, events: u64) -> Self {
        match events {
            0      => MemberTier::Initiate,
            1..=2  => MemberTier::Seeker,
            3..=5  => MemberTier::Resident,
            6..=10 => MemberTier::Builder,
            11..=20 => MemberTier::Core,
            _      => MemberTier::Legend,
        }
    }
}

// ─── Contexts ───────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeCommunity<'info> {
    #[account(
        init, payer = authority,
        space = 8 + 32 + (4+64) + (4+256) + (4+64) + 8 + 8 + 8 + 1 + 8,
        seeds = [b"community", authority.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub community: Account<'info, Community>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct RegisterMember<'info> {
    #[account(mut)]
    pub community: Account<'info, Community>,
    #[account(
        init, payer = wallet,
        space = 8 + 32 + 32 + (4+32) + 8 + 8 + 1 + 1 + 8 + 8,
        seeds = [b"member", community.key().as_ref(), wallet.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(has_one = authority)]
    pub community: Account<'info, Community>,
    #[account(
        mut,
        constraint = member.community == community.key() @ StrataError::MemberNotInCommunity,
    )]
    pub member: Account<'info, Member>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(title: String, _description: String, _location: String, _country: String,
              _event_date: i64, _capacity: u64, _entry_fee_lamports: u64, event_code: String,
              _is_hackathon: bool)]
pub struct CreateEvent<'info> {
    #[account(mut)]
    pub community: Account<'info, Community>,
    #[account(
        init, payer = organizer,
        space = 8 + 32 + 32 + (4+64) + (4+512) + (4+128) + (4+64)
              + 8 + 8 + 8 + 8 + (4+8) + 1 + 8 + 1 + 1 + 8 + 1,
        seeds = [b"event", community.key().as_ref(), &community.event_count.to_le_bytes()],
        bump
    )]
    pub event: Account<'info, Event>,
    /// CHECK: PDA escrow vault for entry fees
    #[account(
        mut,
        seeds = [b"event_escrow", community.key().as_ref(), &community.event_count.to_le_bytes()],
        bump
    )]
    pub escrow_vault: SystemAccount<'info>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageEvent<'info> {
    #[account(
        mut,
        constraint = event.organizer == organizer.key() @ StrataError::Unauthorized,
    )]
    pub event: Account<'info, Event>,
    pub organizer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(event_code: String)]
pub struct CheckIn<'info> {
    #[account(mut)]
    pub community: Account<'info, Community>,
    #[account(
        mut,
        constraint = event.community == community.key() @ StrataError::EventNotInCommunity,
    )]
    pub event: Account<'info, Event>,
    /// Proof-of-Presence record — one per (event, attendee wallet)
    #[account(
        init, payer = attendee,
        space = 8 + 32 + 32 + 8 + 8 + (1+32) + 1,
        seeds = [b"attendance", event.key().as_ref(), attendee.key().as_ref()],
        bump
    )]
    pub attendance: Account<'info, Attendance>,
    #[account(
        mut,
        constraint = member.wallet == attendee.key() @ StrataError::InvalidMember,
        constraint = member.community == community.key() @ StrataError::MemberNotInCommunity,
    )]
    pub member: Account<'info, Member>,
    #[account(mut)]
    pub attendee: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: Instructions sysvar — organizer Ed25519 co-signature must be at ix[0]
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RecordNftMint<'info> {
    #[account(
        mut,
        constraint = attendance.attendee == authority.key() @ StrataError::Unauthorized,
    )]
    pub attendance: Account<'info, Attendance>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CopilotScoreEvent<'info> {
    #[account(has_one = authority)]
    pub community: Account<'info, Community>,
    #[account(
        constraint = event.community == community.key() @ StrataError::EventNotInCommunity,
    )]
    pub event: Account<'info, Event>,
    pub authority: Signer<'info>,
}

// ─── On-Chain Events ────────────────────────────────────────────────────────

#[event]
pub struct CommunityCreated {
    pub community: Pubkey,
    pub authority: Pubkey,
    pub name:      String,
    pub country:   String,
}

#[event]
pub struct MemberRegistered {
    pub member:    Pubkey,
    pub wallet:    Pubkey,
    pub community: Pubkey,
    pub username:  String,
}

#[event]
pub struct ReputationUpdated {
    pub member:    Pubkey,
    pub old_score: u64,
    pub new_score: u64,
    pub reason:    String,
}

#[event]
pub struct EventCreated {
    pub event:      Pubkey,
    pub community:  Pubkey,
    pub organizer:  Pubkey,
    pub title:      String,
    pub location:   String,
    pub country:    String,
    pub event_date: i64,
    pub capacity:   u64,
}

#[event]
pub struct EventStatusChanged {
    pub event:  Pubkey,
    pub status: EventStatus,
}

/// The core event — emitted every check-in, permanently on-chain
#[event]
pub struct AttendanceVerified {
    pub event:            Pubkey,
    pub attendee:         Pubkey,
    pub edition:          u64,
    pub checked_in_at:    i64,
    pub reputation_bonus: u64,
    pub new_tier:         MemberTier,
}

#[event]
pub struct NftMinted {
    pub event:    Pubkey,
    pub attendee: Pubkey,
    pub nft_mint: Pubkey,
    pub edition:  u64,
}

#[event]
pub struct EventCopilotScored {
    pub event:     Pubkey,
    pub score:     u8,
    pub reasoning: String,
}

// ─── Errors ─────────────────────────────────────────────────────────────────

#[error_code]
pub enum StrataError {
    #[msg("Name exceeds maximum length")]
    NameTooLong,
    #[msg("Description exceeds maximum length")]
    DescriptionTooLong,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Date must be in the future")]
    InvalidDeadline,
    #[msg("Event code must be exactly 8 characters")]
    InvalidEventCode,
    #[msg("Event is not currently live")]
    EventNotLive,
    #[msg("Event is at full capacity")]
    EventFull,
    #[msg("Invalid event status for this operation")]
    InvalidEventStatus,
    #[msg("Member does not belong to this community")]
    MemberNotInCommunity,
    #[msg("Invalid member account")]
    InvalidMember,
    #[msg("Event does not belong to this community")]
    EventNotInCommunity,
    #[msg("NFT already minted for this attendance")]
    NftAlreadyMinted,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("QR code has expired — organizer must go live again to refresh")]
    SignatureExpired,
    #[msg("Missing organizer co-signature — Ed25519 instruction must be ix[0]")]
    MissingOrganizerSignature,
    #[msg("Invalid organizer signature or message mismatch")]
    InvalidOrganizerSignature,
}
