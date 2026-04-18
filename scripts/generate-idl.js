#!/usr/bin/env node
/**
 * Generates target/idl/strata.json and app/src/idl/strata.json
 * Computes Anchor discriminators via SHA-256("global:<instruction_name>")
 * Run: node scripts/generate-idl.js <PROGRAM_ID>
 */

const crypto = require("crypto");
const fs     = require("fs");
const path   = require("path");

const PROGRAM_ID = process.argv[2];
if (!PROGRAM_ID) {
  console.error("Usage: node scripts/generate-idl.js <PROGRAM_ID>");
  process.exit(1);
}

function disc(name) {
  return Array.from(
    crypto.createHash("sha256").update(`global:${name}`).digest().slice(0, 8)
  );
}

function accountDisc(name) {
  return Array.from(
    crypto.createHash("sha256").update(`account:${name}`).digest().slice(0, 8)
  );
}

const IDL = {
  address: PROGRAM_ID,
  metadata: {
    name: "strata",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Strata — On-Chain Proof of Presence Protocol",
  },
  instructions: [
    {
      name: "initializeCommunity",
      discriminator: disc("initialize_community"),
      accounts: [
        { name: "community", writable: true, pda: { seeds: [{ kind: "const", value: [99,111,109,109,117,110,105,116,121] }, { kind: "account", path: "authority" }, { kind: "arg", path: "name" }] } },
        { name: "authority", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "name",        type: "string" },
        { name: "description", type: "string" },
        { name: "country",     type: "string" },
      ],
    },
    {
      name: "registerMember",
      discriminator: disc("register_member"),
      accounts: [
        { name: "community", writable: true },
        { name: "member", writable: true, pda: { seeds: [{ kind: "const", value: [109,101,109,98,101,114] }, { kind: "account", path: "community" }, { kind: "account", path: "wallet" }] } },
        { name: "wallet", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "username", type: "string" },
      ],
    },
    {
      name: "updateReputation",
      discriminator: disc("update_reputation"),
      accounts: [
        { name: "community" },
        { name: "member", writable: true },
        { name: "authority", signer: true },
      ],
      args: [
        { name: "newScore", type: "u64" },
        { name: "reason",   type: "string" },
      ],
    },
    {
      name: "createEvent",
      discriminator: disc("create_event"),
      accounts: [
        { name: "community", writable: true },
        { name: "event", writable: true, pda: { seeds: [{ kind: "const", value: [101,118,101,110,116] }, { kind: "account", path: "community" }, { kind: "const", value: [] }] } },
        { name: "escrowVault", writable: true },
        { name: "organizer", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "title",              type: "string" },
        { name: "description",        type: "string" },
        { name: "location",           type: "string" },
        { name: "country",            type: "string" },
        { name: "eventDate",          type: "i64" },
        { name: "capacity",           type: "u64" },
        { name: "entryFeeLamports",   type: "u64" },
        { name: "eventCode",          type: "string" },
      ],
    },
    {
      name: "startEvent",
      discriminator: disc("start_event"),
      accounts: [
        { name: "event", writable: true },
        { name: "organizer", signer: true },
      ],
      args: [],
    },
    {
      name: "checkIn",
      discriminator: disc("check_in"),
      accounts: [
        { name: "community", writable: true },
        { name: "event", writable: true },
        { name: "attendance", writable: true, pda: { seeds: [{ kind: "const", value: [97,116,116,101,110,100,97,110,99,101] }, { kind: "account", path: "event" }, { kind: "account", path: "attendee" }] } },
        { name: "member", writable: true },
        { name: "attendee", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "eventCode", type: "string" },
      ],
    },
    {
      name: "recordNftMint",
      discriminator: disc("record_nft_mint"),
      accounts: [
        { name: "attendance", writable: true },
        { name: "authority", signer: true },
      ],
      args: [
        { name: "nftMint", type: "pubkey" },
      ],
    },
    {
      name: "endEvent",
      discriminator: disc("end_event"),
      accounts: [
        { name: "event", writable: true },
        { name: "organizer", signer: true },
      ],
      args: [],
    },
    {
      name: "copilotScoreEvent",
      discriminator: disc("copilot_score_event"),
      accounts: [
        { name: "community" },
        { name: "event" },
        { name: "authority", signer: true },
      ],
      args: [
        { name: "score",     type: "u8" },
        { name: "reasoning", type: "string" },
      ],
    },
  ],
  accounts: [
    {
      name: "Community",
      discriminator: accountDisc("Community"),
    },
    {
      name: "Member",
      discriminator: accountDisc("Member"),
    },
    {
      name: "Event",
      discriminator: accountDisc("Event"),
    },
    {
      name: "Attendance",
      discriminator: accountDisc("Attendance"),
    },
  ],
  types: [
    {
      name: "Community",
      type: {
        kind: "struct",
        fields: [
          { name: "authority",     type: "pubkey" },
          { name: "name",          type: "string" },
          { name: "description",   type: "string" },
          { name: "country",       type: "string" },
          { name: "memberCount",   type: "u64" },
          { name: "eventCount",    type: "u64" },
          { name: "totalCheckins", type: "u64" },
          { name: "bump",          type: "u8" },
          { name: "createdAt",     type: "i64" },
        ],
      },
    },
    {
      name: "Member",
      type: {
        kind: "struct",
        fields: [
          { name: "wallet",          type: "pubkey" },
          { name: "community",       type: "pubkey" },
          { name: "username",        type: "string" },
          { name: "reputationScore", type: "u64" },
          { name: "eventsAttended",  type: "u64" },
          { name: "tier",            type: { defined: { name: "MemberTier" } } },
          { name: "bump",            type: "u8" },
          { name: "joinedAt",        type: "i64" },
          { name: "lastActive",      type: "i64" },
        ],
      },
    },
    {
      name: "Event",
      type: {
        kind: "struct",
        fields: [
          { name: "community",        type: "pubkey" },
          { name: "organizer",        type: "pubkey" },
          { name: "title",            type: "string" },
          { name: "description",      type: "string" },
          { name: "location",         type: "string" },
          { name: "country",          type: "string" },
          { name: "eventDate",        type: "i64" },
          { name: "capacity",         type: "u64" },
          { name: "attendeeCount",    type: "u64" },
          { name: "entryFeeLamports", type: "u64" },
          { name: "eventCode",        type: "string" },
          { name: "status",           type: { defined: { name: "EventStatus" } } },
          { name: "eventIndex",       type: "u64" },
          { name: "escrowBump",       type: "u8" },
          { name: "bump",             type: "u8" },
          { name: "createdAt",        type: "i64" },
        ],
      },
    },
    {
      name: "Attendance",
      type: {
        kind: "struct",
        fields: [
          { name: "event",       type: "pubkey" },
          { name: "attendee",    type: "pubkey" },
          { name: "edition",     type: "u64" },
          { name: "checkedInAt", type: "i64" },
          { name: "nftMint",     type: { option: "pubkey" } },
          { name: "bump",        type: "u8" },
        ],
      },
    },
    {
      name: "EventStatus",
      type: {
        kind: "enum",
        variants: [
          { name: "Upcoming" },
          { name: "Live" },
          { name: "Ended" },
          { name: "Cancelled" },
        ],
      },
    },
    {
      name: "MemberTier",
      type: {
        kind: "enum",
        variants: [
          { name: "Initiate" },
          { name: "Seeker" },
          { name: "Resident" },
          { name: "Builder" },
          { name: "Core" },
          { name: "Legend" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "NameTooLong",         msg: "Name exceeds maximum length" },
    { code: 6001, name: "DescriptionTooLong",  msg: "Description exceeds maximum length" },
    { code: 6002, name: "InvalidAmount",       msg: "Invalid amount" },
    { code: 6003, name: "InvalidDeadline",     msg: "Date must be in the future" },
    { code: 6004, name: "InvalidEventCode",    msg: "Event code must be exactly 8 characters" },
    { code: 6005, name: "EventNotLive",        msg: "Event is not currently live" },
    { code: 6006, name: "EventFull",           msg: "Event is at full capacity" },
    { code: 6007, name: "InvalidEventStatus",  msg: "Invalid event status for this operation" },
    { code: 6008, name: "MemberNotInCommunity",msg: "Member does not belong to this community" },
    { code: 6009, name: "InvalidMember",       msg: "Invalid member account" },
    { code: 6010, name: "EventNotInCommunity", msg: "Event does not belong to this community" },
    { code: 6011, name: "NftAlreadyMinted",    msg: "NFT already minted for this attendance" },
    { code: 6012, name: "Unauthorized",        msg: "Unauthorized" },
  ],
};

// Write to target/idl/
const targetDir = path.join(__dirname, "..", "target", "idl");
fs.mkdirSync(targetDir, { recursive: true });
const targetPath = path.join(targetDir, "strata.json");
fs.writeFileSync(targetPath, JSON.stringify(IDL, null, 2));
console.log("✓ Wrote", targetPath);

// Write to app/src/idl/
const appDir = path.join(__dirname, "..", "app", "src", "idl");
fs.mkdirSync(appDir, { recursive: true });
const appPath = path.join(appDir, "strata.json");
fs.writeFileSync(appPath, JSON.stringify(IDL, null, 2));
console.log("✓ Wrote", appPath);

console.log("\nIDL generated successfully.");
console.log("Discriminators:");
[
  "initialize_community","register_member","update_reputation",
  "create_event","start_event","check_in",
  "record_nft_mint","end_event","copilot_score_event",
].forEach(n => console.log(`  ${n}: [${disc(n).join(",")}]`));
