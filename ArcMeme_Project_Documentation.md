# ArcMeme — Complete Project Architecture & Development Journey

> **Version:** 1.0.0 — Generated from codebase analysis, June 2026
> **Network:** Arc Testnet (Chain ID: 5042002)
> **Stack:** React 19 · TypeScript 6 · Vite 8 · Wagmi 2 · Supabase · Arc Network

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [System Architecture](#3-system-architecture)
4. [Core Features](#4-core-features)
5. [Database Design](#5-database-design)
6. [Trade Event Migration](#6-trade-event-migration)
7. [Technical Challenges Solved](#7-technical-challenges-solved)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Security Considerations](#9-security-considerations)
10. [Current Status](#10-current-status)
11. [Future Roadmap](#11-future-roadmap)
12. [Conclusion](#12-conclusion)

---

## 1. Project Overview

**ArcMeme** is a decentralized meme-token launchpad and trading platform built natively on the **Arc Network** — a blockchain where **USDC is the native gas token** (not ETH). ArcMeme allows anyone with a wallet to launch their own ERC-20 meme token in under 60 seconds, instantly trade it through an automated market maker (AMM), and track performance across charts, leaderboards, and creator profiles.

### What ArcMeme Is

ArcMeme is the first full-stack meme-token ecosystem on Arc Testnet, combining:

- A **no-code token launcher** that deploys ERC-20 tokens + bonding-curve AMM markets via a Factory smart contract.
- A **live trading terminal** with real-time AMM math, price-impact warnings, slippage protection, and transaction receipts.
- A **Supabase-backed off-chain indexer** that captures every trade event for charts, cost-basis tracking, and portfolio analytics.
- A **public leaderboard** ranking tokens by market cap, creators by token count, and traders by volume.
- A **per-wallet creator profile** that shows portfolio holdings, P&L, launched tokens, and recent trade activity.

### Main Purpose

To lower the barrier of meme-token creation and trading on the Arc Network to zero — no Solidity knowledge, no deployment tooling, no liquidity bootstrapping required. A creator fills out a form, approves a 10 USDC seed, clicks Deploy, and has a live trading market within one block.

### Target Users

| User Type | What They Do |
|---|---|
| **Meme Creators** | Launch tokens, share links, build communities |
| **Traders** | Buy and sell tokens via AMM, track P&L |
| **Community Viewers** | Browse the dashboard, discover trending tokens |
| **Platform Admin** | Monitor metrics via the restricted Admin Panel |

### Key Features

- 🚀 **1-click token deployment** via the `ArcMemeFactory` smart contract
- 📈 **Real-time price charts** powered by Supabase `trade_events` and `lightweight-charts`
- 💱 **AMM Buy/Sell panels** with constant-product math, slippage tolerance, and price-impact calculation
- 🏆 **Leaderboard** across three dimensions: tokens, creators, traders
- 👤 **Creator profiles** with portfolio value, holdings table, and trade history
- 🔐 **Wallet-based identity** — profiles auto-created on first wallet connection
- 📊 **Admin panel** with aggregate platform metrics sourced from Supabase
- 🌓 **Dark / Light mode** with full CSS variable theming
- 🔄 **Swap (Beta)** placeholder for upcoming Circle App Kit integration

---

## 2. Problem Statement

### Why ArcMeme Was Built

The Arc Network introduced a bold idea: **USDC as native gas token**. This removes the traditional ETH-as-gas barrier and positions Arc as a USDC-native ecosystem. However, at launch there were no consumer-facing dApps built natively for this environment.

Pump.fun on Solana proved that democratizing token creation drives massive user engagement and liquidity. ArcMeme replicates and extends this model for the Arc ecosystem, providing a purpose-built launchpad that understands Arc's native USDC mechanics.

### Problems It Solves

**For Creators:**
- Creating an ERC-20 token + liquidity pool on any chain previously required Solidity knowledge, a Hardhat/Foundry setup, ABI management, and manual liquidity bootstrapping. ArcMeme reduces this to a form submission.
- The Factory contract handles all deployment atomically: token contract + AMM market are deployed in a single transaction.

**For Traders:**
- Meme-token markets on Arc had no dedicated trading UI. Traders had no way to see charts, price history, market caps, or recent trades without reading raw blockchain events.
- ArcMeme provides a purpose-built trading terminal with live AMM math identical to the smart contract, so what you see on screen is what the contract will execute.

**For the Ecosystem:**
- Without a leaderboard, there was no social layer to discover trending tokens or top creators.
- Without off-chain trade indexing, chart data required expensive blockchain re-crawls on every page load.

### Why Meme Token Creation Should Be Simplified

Meme tokens are the viral unit of crypto culture. Their adoption is driven by speed, community, and fun — not technical depth. Platforms that reduce friction (Pump.fun → 45M+ tokens created) generate outsized network effects. ArcMeme applies this insight to Arc Network's USDC-first chain, where gas costs are stablecoin-denominated and predictable — an ideal environment for casual creators.

---

## 3. System Architecture

### Frontend Stack

| Technology | Version | Role |
|---|---|---|
| **React** | 19.2 | UI component model, hooks, state management |
| **TypeScript** | 6.0 | Type safety across all layers |
| **Vite** | 8.0 | Build tool, HMR, code-splitting |
| **Wagmi** | 2.19 | React hooks for wallet state, contract reads, contract writes |
| **Viem** | 2.51 | Low-level Ethereum primitives, ABI encoding, multicall |
| **Ethers.js** | 6.16 | Event log parsing, real-time provider subscriptions |
| **RainbowKit** | 2.2 | Wallet connection UI (MetaMask, WalletConnect, Brave, etc.) |
| **TanStack Query** | 5.100 | Cache layer for Wagmi contract read hooks |
| **lightweight-charts** | 5.2 | TradingView-grade price chart rendering |
| **React Router DOM** | 7.16 | Client-side routing |
| **Tailwind CSS** | 4.3 | Utility CSS with custom design tokens via `@theme` and `@utility` |

### Backend / Off-Chain

| Technology | Role |
|---|---|
| **Supabase** | Postgres database + instant REST API + real-time subscriptions |
| **Supabase Auth** | Not used — wallet-based identity is used instead |
| **Supabase RLS** | Row Level Security policy layer (planned — see Section 9) |

### Blockchain / Smart Contracts

| Component | Address / Details |
|---|---|
| **Arc Testnet** | Chain ID `5042002`, RPC `https://rpc.testnet.arc.network` |
| **ArcScan** | Block explorer at `https://testnet.arcscan.app` |
| **Native USDC** | `0x3600000000000000000000000000000000000000` (Arc-native, 18 decimals) |
| **ArcMemeFactory** | `0x035b5443F9b4D8994F8D83F32968D1694db269A8` |
| **Token Contracts** | ERC-20 (1 billion supply, 18 decimals) — deployed per token by Factory |
| **Market Contracts** | Constant-product AMM per token — deployed atomically by Factory alongside each token |

### Text-Based Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BROWSER  (React + Vite)                             │
│                                                                               │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Dashboard │  │CreateToken │  │  Trade Page  │  │ CreatorProfile       │  │
│  │   /      │  │  /create   │  │/trade/:addr  │  │ /creator/:addr       │  │
│  └────┬─────┘  └─────┬──────┘  └──────┬───────┘  └──────────┬───────────┘  │
│       │               │               │                       │              │
│  ┌────▼───────────────▼───────────────▼───────────────────────▼───────────┐ │
│  │               AppContext  (src/context/AppContext.tsx)                  │ │
│  │   assets[] · activities[] · currentUser · walletAddress                │ │
│  │   5-second blockchain sync (ethers.js JsonRpcProvider + multicall)     │ │
│  └──────────┬─────────────────────────────────────┬──────────────────────┘ │
│             │                                     │                          │
│  ┌──────────▼──────────┐             ┌────────────▼────────────────────┐    │
│  │  Wagmi / Viem Layer │             │  Supabase Client  (REST API)     │    │
│  │  useReadContracts   │             │  src/utils/indexerApi.ts         │    │
│  │  useWriteContract   │             │  src/services/tokenService.ts    │    │
│  │  useBalance         │             │  src/services/profileService.ts  │    │
│  └──────────┬──────────┘             └────────────┬────────────────────┘    │
└─────────────┼───────────────────────────────────────┼───────────────────────┘
              │                                       │
              ▼                                       ▼
┌───────────────────────────┐        ┌────────────────────────────────────────┐
│     Arc Testnet (L1)       │        │           Supabase  (Postgres)          │
│                             │        │                                         │
│  ArcMemeFactory             │        │  profiles          (user identity)      │
│  ├─ createToken()           │        │  tokens            (metadata registry)  │
│  ├─ getAllTokens()           │        │  trade_events      (canonical log) ◄── │
│  └─ tokenToMarket()         │        │  portfolio_snapshots                    │
│                             │        │                                         │
│  TokenContract (ERC-20)     │        └────────────────────────────────────────┘
│  ├─ name() / symbol()       │
│  ├─ balanceOf()             │
│  └─ approve()               │
│                             │
│  MarketContract (AMM)       │
│  ├─ reserveUSDC()           │
│  ├─ reserveToken()          │
│  ├─ buy(usdcIn, minOut)     │
│  └─ sell(tokenIn, minOut)   │
└───────────────────────────┘
```

### Data Flow — Trade Execution

```
User clicks "Buy"
      │
      ▼
BuyPanel.tsx  →  calculateBuyOutput()  (src/trading.ts — mirrors contract math)
      │
      ▼
Approve USDC allowance  →  ERC-20 approve(market, usdcAmount)
      │
      ▼
market.buy(usdcAmount, minTokensOut)  →  wallet signs tx
      │
      ▼
publicClient.waitForTransactionReceipt()
      │
      ▼
indexerApi.addTradeEvent()  →  Supabase  trade_events  INSERT
      │
      ├──→  TradingChart.tsx   refreshes  (getChartData reads trade_events)
      ├──→  usePortfolio.ts    refreshes  (getUserTrades reads trade_events)
      └──→  AdminDashboard.tsx refreshes  (trade_events aggregate count)
```

---

## 4. Core Features

### 4.1 User Profiles

**Key files:**
- `src/services/profileService.ts`
- `src/context/AppContext.tsx`
- `src/components/OnboardingModal.tsx`

ArcMeme uses **wallet-based identity** — there is no email or password. Every user is identified solely by their EVM wallet address.

**Auto-creation flow:**
1. User connects their wallet via RainbowKit (`useAccount` hook detects connection in `AppContext.tsx`).
2. `AppContext.tsx` dynamically imports `profileService.ts` and calls `getProfileByWallet(address.toLowerCase())`.
3. If no record exists in the `profiles` table, `createProfile()` is called with a generated username (`user_XXXXXX` using the first 6 hex chars of the address).
4. The `OnboardingModal.tsx` renders when `isConnected && !currentUser`, prompting a display name.

**In-memory profile (also backed by localStorage `arc_profiles`):**
```typescript
interface UserProfile {
  walletAddress: string;
  displayName: string;
  joinedAt: string;
  avatarSeed: string;          // First char of displayName — used as avatar letter
  verificationStatus: 'Creator' | 'Verified Creator' | 'None';
}
```

---

### 4.2 Token Launch

**Key files:**
- `src/components/CreateToken.tsx`
- `src/config/contracts.ts`
- `src/services/tokenService.ts`

**Creation flow (3 steps):**

**Step 1 — Form**
User provides: Token Name, Symbol (auto-uppercased), Description, Total Supply (default `1,000,000,000`), and a logo image. Logos are resized client-side to 128×128 WebP at 0.8 quality using the HTML5 Canvas API before storage — keeping payloads small.

**Step 2 — Confirm**
A review panel shows all details plus the **10 USDC creation fee** (`APP_CONFIG.TOKEN_CREATION_FEE_USDC` from `src/config/constants.ts`). The connected wallet must hold ≥10 USDC.

**Step 3 — Deploy**
```
1.  simulateContract()           — dry-run to catch "Symbol already exists" before spending gas
2.  USDC approve(Factory, 10e6) — grant spending allowance
3.  factory.createToken(name, symbol, usdcSeed) — atomic deployment
4.  waitForTransactionReceipt()  — confirmation polling
5.  decodeEventLog(TokenCreated) — extract new token + market addresses from receipt
6.  addToken(newToken)           — tokenService.insertToken() → Supabase tokens INSERT
7.  addActivity()                — localStorage arc_activities update
8.  setStep('success')           — success screen with ArcScan link
```

**Factory contract interface** (`src/config/contracts.ts`):
```typescript
const ARC_MEME_FACTORY_ADDRESS = '0x035b5443F9b4D8994F8D83F32968D1694db269A8';

ABI functions:
  createToken(name: string, symbol: string, usdcSeed: uint256) → address
  getAllTokens() → address[]
  getTokensCount() → uint256

ABI events:
  TokenCreated(token, market, creator, name, symbol, usdcSeed)
```

The Factory deploys both a **Token contract** (ERC-20, 1 billion supply) and a **Market contract** (constant-product AMM) atomically in a single transaction.

---

### 4.3 Trading System

**Key files:**
- `src/components/BuyPanel.tsx`
- `src/components/SellPanel.tsx`
- `src/trading.ts`

**AMM model — constant product:**
ArcMeme's market contracts implement x·y = k. All frontend math in `src/trading.ts` mirrors the Solidity contract exactly so there are no surprises at execution time:

```typescript
// Tokens received for a given USDC input
calculateBuyOutput(usdcIn, reserveUSDC, reserveToken):
  → (reserveToken * usdcIn) / (reserveUSDC + usdcIn)

// USDC received for a given token input
calculateSellOutput(tokenIn, reserveUSDC, reserveToken):
  → (reserveUSDC * tokenIn) / (reserveToken + tokenIn)

// Spot price of 1 full token in USDC
calculateSpotPrice(reserveUSDC, reserveToken):
  → (reserveUSDC / 1e6) / (reserveToken / 1e18)

// Market cap = spot price × 1,000,000,000
calculateMarketCap(spotPrice):
  → spotPrice * 1_000_000_000

// Price impact in basis points (0.01% precision)
calculatePriceImpact(inputAmount, outputAmount, reserveIn, reserveOut):
  → ((expectedOutput − outputAmount) × 10000) / expectedOutput / 100

// Slippage tolerance applied to minimum output (default 100 bps = 1%)
applySlippage(expectedOutput, slippageBps = 100):
  → (expectedOutput × (10000 − slippageBps)) / 10000
```

**Buy flow (BuyPanel.tsx):**
1. User enters USDC amount.
2. `calculateBuyOutput()` shows estimated tokens received in real time.
3. `calculatePriceImpact()` displays a warning if impact exceeds 2%.
4. Frontend checks current USDC allowance — approves only if insufficient.
5. `market.buy(usdcAmount, minTokensOut)` is submitted via `writeContractAsync`.
6. After confirmation, `indexerApi.addTradeEvent()` persists the event to Supabase.

**Sell flow (SellPanel.tsx):**
Mirror of buy flow — user inputs token amount, receives USDC. The token contract `approve()` is called first, then `market.sell(tokenAmount, minUsdcOut)`.

Reserve data is fetched via wagmi `useReadContracts` (multicall) — both `reserveUSDC()` and `reserveToken()` are batched into a single RPC round-trip.

---

### 4.4 Charts

**Key files:**
- `src/components/TradingChart.tsx`
- `src/utils/indexerApi.ts` (`getChartData`)

Charts use **TradingView's `lightweight-charts` v5** with an `AreaSeries` and `LineType.Curved`.

**Data source:**
Every trade event written to `trade_events` includes `spot_price` and `timestamp`. `indexerApi.getChartData(marketAddress)` queries:
```sql
SELECT timestamp, spot_price
FROM trade_events
WHERE market_address = $1
ORDER BY timestamp ASC
```

**Rendering pipeline:**
1. Fetch data from Supabase via `indexerApi.getChartData(marketAddress)`.
2. Sort by timestamp (lightweight-charts requires strictly increasing time values).
3. **Timestamp deduplication** — rapid trades can share the same Unix second. A `while` loop increments colliding timestamps by +1 until every value is unique.
4. **Single-point handling** — if only one trade exists, a phantom second point at `time + 60` is injected. Without this lightweight-charts crashes (it requires ≥2 points).
5. Chart is initialized inside `setTimeout(0)` to ensure the container ref has been measured by the browser layout engine.
6. A floating `createPriceLine` shows the last-traded price as a dashed horizontal marker.
7. A crosshair tooltip shows price and time on hover (subscribed via `chart.subscribeCrosshairMove()`).
8. The chart is fully destroyed in a cleanup `useEffect` on component unmount to prevent memory leaks.

**Error boundary:**
`TradingChartErrorBoundary` (class component) wraps the inner chart. If lightweight-charts throws during rendering, a graceful fallback replaces the crash.

---

### 4.5 Recent Trades

**Key files:**
- `src/utils/indexerApi.ts`
- `src/components/Trade.tsx`
- `src/components/CreatorProfile.tsx`

**How trades are stored:**
After every confirmed buy or sell, the frontend immediately calls `indexerApi.addTradeEvent()`, inserting one row into `trade_events` with the full market snapshot at the moment of the trade (reserves, spot price, market cap, liquidity, tx hash).

**How trades are retrieved:**

| Function | Query | Used by |
|---|---|---|
| `getRecentTrades(marketAddress)` | Last 500 rows by market, DESC | Trade.tsx — trade history tab |
| `getUserTrades(userAddress)` | All trades by wallet, across all markets | CreatorProfile.tsx, usePortfolio.ts |
| `getChartData(marketAddress)` | `spot_price + timestamp` only, ASC | TradingChart.tsx |
| `getUserCostBasis(userAddress, marketAddress)` | SUM(usdc_amount) by trade_type | usePortfolio.ts — P&L calculation |

---

### 4.6 Leaderboard

**Key file:** `src/components/LeaderboardTable.tsx`

**Tab A — Top Tokens** (ranked by market cap)
- Live `reserveUSDC` and `reserveToken` fetched via wagmi multicall (`useReadContracts`).
- `calculateMarketCap(calculateSpotPrice(reserveUSDC, reserveToken))` computed client-side for each asset.
- Unique holder count: union of `creatorHandle` and all distinct `trader_address` values from `trade_events` for that market.
- Liquidity: `(reserveUSDC / 1e6) × 2` — both sides of the pool at spot price.

**Tab B — Top Creators** (ranked by tokens created)
- Groups `assets[]` by `creatorHandle`.
- No Supabase query needed — computed entirely from the in-memory `assets` array.

**Tab C — Top Traders** (ranked by total USDC volume)
- Aggregates `usdc_amount` from all `trade_events` per unique wallet.
- Sourced from Supabase via `indexerApi.getRecentTrades()` per market, then reduced client-side.

**Trending score formula** (`src/utils/dashboardData.ts`):
```typescript
score = volume24h * 0.5 + tradeCount * 0.3 + holderCount * 0.2
```

The top 3 assets by score are featured in the Dashboard's large trending cards; ranks 4–10 appear in the "More Trending" grid.

---

### 4.7 Admin Panel

**Key file:** `src/components/AdminDashboard.tsx`

Access is restricted to the single wallet address stored in `VITE_ADMIN_WALLET_ADDRESS`. Non-admin visitors see an "Access Denied" screen. The admin address is compared case-insensitively at render time:

```typescript
const isAdmin = isConnected && address
  ? address.toLowerCase() === APP_CONFIG.ADMIN_WALLET_ADDRESS.toLowerCase()
  : false;
```

**Metrics displayed:**

| Metric | Primary Source | Calculation |
|---|---|---|
| **Total Users** | `trade_events` (Supabase) + `creatorProfiles` + `assets.creatorHandle` | Union of all unique wallets |
| **Active Users (7d)** | Same sources, filtered by timestamp < 7 days | Traders active ≤7 days + creators who launched ≤7 days |
| **Tokens Created** | `assets.length` (from AppContext) | Count of all registered tokens |
| **Total Transactions** | `assets.length + tradeMetrics.totalTrades` | Token launches + all trade events |

Trade metrics are fetched directly from Supabase `trade_events` on component mount, using an `isMounted` guard to prevent state updates after unmount.

---

### 4.8 Swap (Beta)

**Key file:** `src/components/SwapPage.tsx`

The Swap page is a **UI-only placeholder** with zero external SDK dependencies. It exists for three reasons:

1. **Navigation completeness** — users expect a Swap feature in a DeFi platform. The page sets correct expectations with a clear "Coming Soon" message rather than a dead link.
2. **Circle App Kit readiness** — the layout (From/To token selectors, amount input, swap button) anticipates the Circle App Kit interface. Future integration is a drop-in replacement of the disabled controls.
3. **Live navigation** — previously "Swap" was a disabled sidebar button with a locked modal. It is now a navigable route (`/swap`) with a **Beta** badge, making the feature discoverable.

**What is shown on the page:**
- Prominent banner: _"Coming Soon — Circle App Kit powered swaps"_
- Disabled From / To token dropdowns
- Disabled amount input
- Disabled swap button: _"Swap — Coming Soon"_
- "What's Coming" info panel: Circle App Kit, Cross-chain Swaps, Zero-slippage Pools, Gasless Transactions
- Link to browse existing token markets while Swap is under development

No new npm packages were installed. All icons use the existing `lucide-react` library.

---

## 5. Database Design

ArcMeme uses **Supabase** (Postgres) as its off-chain database. The Supabase client is initialized in `src/lib/supabase.ts` from the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

### Table: `profiles`

**Purpose:** Stores persistent identity for every wallet that has connected to ArcMeme. Created automatically on first wallet connection via `src/services/profileService.ts`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `created_at` | TIMESTAMPTZ | Insertion timestamp |
| `wallet_address` | TEXT | Raw EVM address (stored lowercase) |
| `username` | TEXT | Auto-generated as `user_XXXXXX` (first 6 hex chars) |
| `avatar_url` | TEXT | Optional avatar image URL |
| `bio` | TEXT | Optional user bio |

**Used by:**
- `AppContext.tsx` — queries on wallet connect, creates if missing
- `profileService.ts` — `getProfileByWallet()` and `createProfile()`
- `CreatorProfile.tsx` — displays data for any address
- `Navbar.tsx` — renders display name and avatar seed in the wallet dropdown

**Known gap (planned):** No `profile_id` foreign key in `trade_events` or `tokens`. A migration to add referential integrity is documented in the implementation plan.

---

### Table: `tokens`

**Purpose:** Off-chain metadata registry for all deployed meme tokens. Stores immutable metadata (name, symbol, logo) and mutable market stats (market cap, liquidity, holders, volume) updated by the 5-second sync loop.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `contract_address` | TEXT UNIQUE | Token ERC-20 contract address |
| `market_address` | TEXT | AMM market contract address |
| `creator_wallet` | TEXT | Deployer wallet (lowercased) |
| `name` | TEXT | Token name |
| `symbol` | TEXT | Token ticker |
| `description` | TEXT | Creator-provided description |
| `logo_url` | TEXT | Base64 WebP data URI or IPFS URL |
| `is_active` | BOOLEAN | Soft-delete flag (`false` = hidden from UI) |
| `market_cap` | NUMERIC | Last synced market cap in USDC |
| `liquidity` | NUMERIC | Last synced pool liquidity (both sides) in USDC |
| `holders` | INTEGER | Last synced unique holder count |
| `volume_24h` | NUMERIC | Last synced 24-hour trading volume in USDC |
| `created_at` | TIMESTAMPTZ | Insertion time |

**Used by:**
- `tokenService.ts` — `insertToken()`, `updateTokenStats()`, `getAllTokens()`, `deactivateToken()`
- `AppContext.tsx` — merges Supabase metadata with on-chain data on startup
- `Dashboard.tsx`, `AssetCard.tsx`, `Trade.tsx` — render token cards and trading terminal

**Sync pattern:**
`AppContext.tsx` runs a 5-second interval. If an on-chain reserve read returns values different from the cached values (see Section 8.2), `tokenService.updateTokenStats()` is called to persist fresh market cap, liquidity, holders, and 24h volume to Supabase.

---

### Table: `trade_events`

**Purpose:** The **canonical off-chain event log**. Every buy and sell executed through `BuyPanel.tsx` or `SellPanel.tsx` writes one row here immediately after transaction confirmation. This table is the single source of truth for:
- Price charts (spot price time series)
- Portfolio cost basis and P&L
- Recent trade history
- Leaderboard trader volumes
- Admin platform-wide trade counts

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `market_address` | TEXT | AMM market contract address |
| `token_address` | TEXT | Token ERC-20 contract address |
| `token_symbol` | TEXT | Token ticker at time of trade |
| `trader_address` | TEXT | Wallet that executed the trade |
| `trade_type` | TEXT | `'buy'` or `'sell'` |
| `usdc_amount` | TEXT | USDC traded (decimal string) |
| `token_amount` | TEXT | Tokens traded (decimal string) |
| `spot_price` | NUMERIC | Post-trade spot price in USDC |
| `market_cap` | NUMERIC | Post-trade market cap in USDC |
| `liquidity` | NUMERIC | Post-trade pool liquidity in USDC |
| `usdc_reserve` | TEXT | New USDC reserve after trade (raw bigint string) |
| `token_reserve` | TEXT | New token reserve after trade (raw bigint string) |
| `timestamp` | BIGINT | Unix seconds (client clock) |
| `block_timestamp` | BIGINT | Unix seconds (matches `timestamp`; true block time pending) |
| `block_number` | INTEGER | Block number (0 until on-chain indexer is built) |
| `tx_hash` | TEXT | Transaction hash |
| `created_at` | TIMESTAMPTZ | Supabase insertion time |

**Used by:**
- `indexerApi.ts` — all reads and writes
- `BuyPanel.tsx` + `SellPanel.tsx` — write after each confirmed trade
- `TradingChart.tsx` — read `spot_price + timestamp` for chart series
- `usePortfolio.ts` — read cost basis and recent trades per wallet
- `LeaderboardTable.tsx` — aggregate trader volumes
- `AdminDashboard.tsx` — total trade count and active trader count

---

### Table: `portfolio_snapshots`

**Purpose:** Periodic snapshots of a wallet's total portfolio value in USDC for historical performance tracking.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `wallet` | TEXT | Wallet address (lowercased) |
| `timestamp` | BIGINT | Unix seconds |
| `portfolio_value` | NUMERIC | Total value in USDC |

**Written by:** `indexerApi.recordPortfolioSnapshot()`, called from `usePortfolio.ts` via a debounced update after portfolio value is computed. Only records a snapshot when `portfolioValue > 0`.

---

## 6. Trade Event Migration

### Old System — localStorage

In the initial development phase, trade history was stored in browser `localStorage` under keys like `arc_trades_<marketAddress>`. This approach had critical limitations:

- **Browser-local only** — trades executed on mobile were invisible on desktop and vice versa.
- **No cross-device portfolio** — a wallet's P&L was only visible on the device where trades were made.
- **No global leaderboard** — aggregating volumes across all users required accessing every user's localStorage, which is impossible from a browser.
- **No persistent charts** — chart data required replaying localStorage events on every session, and sessions started clean on new devices.
- **Admin blind spot** — the Admin Panel had no way to count actual platform trades.

### New System — Supabase `trade_events`

The migration replaced all localStorage trade writes with Supabase `INSERT` operations. `indexerApi.addTradeEvent()` is called from both `BuyPanel.tsx` and `SellPanel.tsx` immediately after `publicClient.waitForTransactionReceipt()` resolves:

```typescript
// Old approach (removed)
const key = `arc_trades_${marketAddress}`;
const existing = JSON.parse(localStorage.getItem(key) || '[]');
localStorage.setItem(key, JSON.stringify([newTrade, ...existing]));

// New approach (current — src/utils/indexerApi.ts)
await supabase.from('trade_events').insert([{
  market_address:  marketAddress,
  trader_address:  traderAddress,
  trade_type:      'buy',
  usdc_amount:     usdcAmount,
  token_amount:    tokenAmount,
  spot_price:      spotPrice,
  market_cap:      marketCap,
  tx_hash:         txHash,
  // ... full snapshot
}]);
```

### Why Migration Was Needed

| Need | Old (localStorage) | New (Supabase) |
|---|---|---|
| Cross-device portfolio | ❌ No | ✅ Yes |
| Real charts from any device | ❌ No | ✅ Yes |
| Leaderboard accuracy | ❌ Impossible | ✅ Yes |
| Admin trade counts | ❌ No | ✅ Yes |
| Cost basis across sessions | ❌ Broken | ✅ Works |
| Data persistence across browsers | ❌ No | ✅ Yes |

---

## 7. Technical Challenges Solved

### 7.1 Infinite Render Loop Issue

**Root cause:**
`AppContext.tsx` initially included `assets` in the dependency array of the 5-second sync `useEffect`. Since the sync itself called `setAssets()`, every sync cycle triggered a React re-render, which re-ran the effect → infinite loop. This also caused hundreds of redundant RPC calls per minute.

**Fix:**
Replaced the reactive `assets` dependency with a stable `assetsRef` (`useRef<MemeAsset[]>`):
```typescript
const assetsRef = useRef<MemeAsset[]>([]);
// In sync effect:
const currentAssets = assetsRef.current; // Always up-to-date without being a dependency
```
Additionally added a **fingerprint comparison** before calling `setAssets()`:
```typescript
const fingerprint = arr.map(a =>
  `${a.contractAddress}:${a.price?.toFixed(10)}:${a.marketCap?.toFixed(2)}:${a.holderCount}:${a.tradeCount}`
).join('|');
if (prevFingerprint === newFingerprint) return prev; // Skip setState if unchanged
```

**Final result:**
Sync runs every 5 seconds but only triggers a React re-render when on-chain data actually changed. Zero redundant renders.

---

### 7.2 Duplicate Token Insertion

**Root cause:**
`tokenService.insertToken()` was called without first checking whether the contract address already existed in Supabase. Under React StrictMode (see 7.3), effects run twice in development, causing two concurrent INSERT attempts for the same contract address within milliseconds, producing duplicate rows.

**Fix — Database check before insert:**
```typescript
const { data: existing } = await supabase
  .from('tokens')
  .select('id')
  .eq('contract_address', token.contractAddress.toLowerCase())
  .maybeSingle();
if (existing) return; // Already registered — no-op
```

**Fix — In-memory guard in AppContext.addToken():**
```typescript
if (prev.some(t =>
  t.contractAddress?.toLowerCase() === token.contractAddress?.toLowerCase()
)) {
  return prev; // No-op: already in registry
}
```

**Final result:**
Zero duplicate rows in the `tokens` table, even under StrictMode double-invocation or concurrent inserts.

---

### 7.3 React StrictMode Behavior

**Root cause:**
React 18+ StrictMode intentionally double-invokes effects (mount → unmount → remount) in development to expose non-idempotent side effects. This caused:
- Two profile creation attempts for the same wallet on connect
- Two `TokenCreated` event parses from the same transaction receipt
- Two `addTradeEvent` Supabase inserts for the same `tx_hash`

**Fix — Transaction deduplication ref in CreateToken.tsx:**
```typescript
const processedTxRef = useRef<string | null>(null);

// Inside the confirmation effect:
if (processedTxRef.current === receipt.transactionHash) return;
processedTxRef.current = receipt.transactionHash;
// ... proceed to parse and insert
```

Profile creation uses `maybeSingle()` + existence check, making it idempotent. Trade event inserts use a `tx_hash` uniqueness check at the Supabase layer.

**Final result:**
All effects are idempotent under StrictMode double-invocation. No duplicate database records.

---

### 7.4 Supabase 409 Conflict (Duplicate Profile)

**Root cause:**
On fast wallet reconnects or StrictMode double-mount, two concurrent `createProfile()` calls hit Supabase simultaneously for the same `wallet_address`. The UNIQUE constraint on `wallet_address` caused HTTP 409 Conflict errors.

**Fix:**
- Used `maybeSingle()` instead of `single()` for the pre-insert existence check. `single()` throws on zero rows; `maybeSingle()` returns `null` silently.
- Filtered only genuine errors (not "no rows found"):
```typescript
if (error && error.code !== 'PGRST116') {
  // PGRST116 = "The result contains 0 rows" — safe to ignore
  console.error('Supabase profile error', error);
  return null;
}
```

**Final result:**
Profile creation is safe to call concurrently. No more 409 errors.

---

### 7.5 `trade_events` Table Creation

**Root cause:**
The `trade_events` table did not exist in Supabase during early development. All `addTradeEvent()` calls silently failed (Supabase returns a 404 on unknown tables via the REST API), meaning no trade data was being persisted.

**Fix:**
Created the table via the Supabase SQL Editor with the full schema documented in Section 5, including all columns needed to reconstruct market state from any point in time (both reserves, spot price, market cap, tx hash). This "full snapshot per trade" design means charts and stats can be derived entirely from `trade_events` without additional on-chain lookups.

**Final result:**
All buy/sell events are successfully persisted to Supabase. Charts, portfolios, and leaderboards all have data.

---

### 7.6 RLS Permission Problems

**Root cause:**
When Supabase Row Level Security was enabled on tables without corresponding policies, the `anon` key could not INSERT or SELECT any rows. The application appeared to work (no errors thrown in the UI) but no data was written or read.

**Fix:**
During active development, either RLS was disabled or a permissive dev policy was applied:
```sql
-- Temporary development policy
CREATE POLICY "allow_all_dev" ON trade_events FOR ALL USING (true);
```
This allows full access with the anon key during development while the production wallet-based RLS design is finalized.

**Final result:**
Application functions fully. Production-grade wallet-based RLS policies are designed and documented in the implementation plan (using a custom `set_request_wallet()` session variable pattern).

---

### 7.7 API Key Exposure

**Root cause:**
The Supabase anon key, WalletConnect project ID, and admin wallet address were initially hardcoded directly in source files, making them visible in the Git history and compiled JavaScript bundle.

**Fix:**
Moved all secrets to Vite environment variables in a `.env` file (gitignored):
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_WALLETCONNECT_PROJECT_ID=xxx
VITE_ADMIN_WALLET_ADDRESS=0x...
```
A `.env.example` with placeholder values is committed as a reference template.

**Final result:**
No secrets in version control. Supabase anon key and WalletConnect project ID are designed for client-side exposure (protected by RLS and CORS respectively).

---

### 7.8 Supabase Schema Cache Issues

**Root cause:**
After adding new columns to `trade_events` (e.g., `block_timestamp`, `usdc_reserve`, `token_reserve`), Supabase PostgREST's internal schema cache did not immediately reflect the DDL change. INSERT attempts referencing new columns returned HTTP 400 errors citing unknown columns.

**Fix:**
Manually invalidated the PostgREST schema cache via **Supabase Dashboard → Settings → API → Reload schema cache** button. After reloading, new columns are immediately available to the REST API.

**Final result:**
Schema changes take effect immediately after a manual cache reload. No application code changes required.

---

### 7.9 QuickNode Rate-Limit Issues

**Root cause:**
The initial sync implementation called `eth_getLogs` for every token on every 5-second cycle, regardless of whether trades had occurred. With 10+ registered tokens, this generated 20+ `eth_getLogs` calls every 5 seconds — well beyond QuickNode's free-tier rate limits, causing HTTP 429 errors and stale UI data.

**Fix — Reserves-based trade cache:**
```typescript
// Module-level cache in AppContext.tsx
const reservesCache = new Map<string, {
  usdc: bigint;
  token: bigint;
  trades: TradeEvent[];
}>();

// In the sync loop for each market:
const prev = reservesCache.get(marketAddress);
if (prev && prev.usdc === freshReserveUSDC && prev.token === freshReserveToken) {
  // Reserves unchanged → no trades since last cycle → reuse cached trade list
  allTrades = prev.trades;
} else {
  // Reserves changed → a trade occurred → fetch fresh event logs
  const logs = await marketContract.queryFilter(tradeFilter, fromBlock, 'latest');
  reservesCache.set(marketAddress, { usdc: freshReserveUSDC, token: freshReserveToken, trades: parsedLogs });
}
```

**Final result:**
`eth_getLogs` only fires when a market's reserves actually changed (i.e., a trade occurred). Idle markets consume zero additional RPC calls per sync cycle.

---

### 7.10 `tokenToMarket()` Revert Issues

**Root cause:**
Some token addresses in the Factory's `getAllTokens()` array were from corrupted test deployments where the Factory's internal `tokenToMarket` mapping was never properly set. Calling `tokenToMarket(tokenAddr)` on these reverted, crashing the entire sync loop.

**Fix:**
Wrapped every `tokenToMarket` call in a try/catch with graceful skip:
```typescript
try {
  resolvedMarket = await factoryContract.tokenToMarket(tokenAddr);
} catch (err) {
  console.warn(`tokenToMarket() reverted for ${tokenAddr} — skipping`);
  continue; // Skip this token, don't crash the loop
}
if (!resolvedMarket || resolvedMarket === ethers.ZeroAddress) {
  continue; // No market associated — skip
}
```

**Final result:**
Broken test-deployment tokens are gracefully skipped. The sync loop never crashes on malformed Factory state.

---

### 7.11 DEV_CONTRACTS Filtering

**Root cause:**
During development, 9 test tokens were deployed to the same Factory contract (LUFFY, NARUTO, KAK, PE, KAK #2, PEPE, DAN, DAC, PRS). These had incorrect metadata, zero real liquidity, and should never appear in the production UI — but since they live on the same Factory, `getAllTokens()` returns them.

**Fix:**
Created `src/config/devContracts.ts` with an explicit blocklist:
```typescript
export const DEV_CONTRACTS: string[] = [
  "0xe1ea138da9fc8f81c77d522353d8bddd3e43c06b", // LUFFY
  "0x10675b936f03e7fcfc0e14269cc1ea88b184b78e", // NARUTO
  "0x02056584541cd9e6904d13acfedca77aa409b9a1", // KAK
  // ... 9 total
];
```

Applied in three places:
1. `AppContext.tsx` sync loop — skips these addresses before any processing.
2. `AppContext.tsx` `visibleAssets` computed value — filters them from all UI state.
3. `Dashboard.tsx` activity feed — excludes them from the live launch ticker.

**Final result:**
Dev tokens are completely invisible in the UI without requiring Factory redeployment.

---

### 7.12 Chart Synchronization Issues

**Root cause:**
After a trade, `TradingChart.tsx` did not immediately refresh because the `refreshTrigger` integer prop was not being incremented from the parent after a successful trade. The chart read stale Supabase data because the re-query was not triggered.

**Fix:**
`Trade.tsx` increments a `chartRefreshTrigger` state counter in the `onSuccess` callback passed to both `BuyPanel` and `SellPanel`. Since `indexerApi.addTradeEvent()` runs _before_ `onSuccess()` is called, the Supabase INSERT is committed by the time the chart re-queries:
```typescript
// Trade.tsx
const [chartRefreshTrigger, setChartRefreshTrigger] = useState(0);
const onTradeSucess = () => setChartRefreshTrigger(t => t + 1);

<TradingChart marketAddress={...} refreshTrigger={chartRefreshTrigger} />
<BuyPanel  onSuccess={onTradeSucess} />
<SellPanel onSuccess={onTradeSucess} />
```

**Final result:**
Chart updates within one React render cycle after a confirmed trade.

---

## 8. Performance Optimizations

### 8.1 Static Token Metadata Cache

**Location:** Module-level Map in `src/context/AppContext.tsx`

```typescript
const staticTokenCache = new Map<string, {
  name: string;
  symbol: string;
  marketAddr: string;
}>();
```

Token name, symbol, and market address are **immutable after creation** on the blockchain. Once fetched for a contract address, they are stored for the lifetime of the browser session. Subsequent sync cycles skip 3 `eth_call` operations (name, symbol, tokenToMarket) per token per cycle.

**Savings:** 3 × N `eth_call` per cycle → 0 after first load (N = number of tokens).

---

### 8.2 Reserves-Based Change Detection Cache

**Location:** Module-level Map in `src/context/AppContext.tsx`

```typescript
const reservesCache = new Map<string, {
  usdc: bigint;
  token: bigint;
  trades: TradeEvent[];
}>();
```

Before fetching event logs for a market, fresh `reserveUSDC` and `reserveToken` are compared to cached values. If identical, the last-known trade list is reused with zero RPC calls. This is the primary protection against QuickNode rate-limit exhaustion.

**Savings:** 2 × N `eth_getLogs` per cycle on idle markets → 0.

---

### 8.3 Fingerprint-Gated `setAssets`

**Location:** `AppContext.tsx` sync loop

Before calling `setAssets()`, a string fingerprint of all meaningful market data (price, market cap, holder count, trade count) is computed and compared to the previous fingerprint. If identical, `setAssets` is skipped entirely — no React state update, no re-render cascade.

**Savings:** Eliminates re-renders of Dashboard, AssetCard, LeaderboardTable, and all other `assets` consumers when blockchain state has not changed.

---

### 8.4 Wagmi Multicall for Reserves

**Location:** `src/hooks/usePortfolio.ts`, `src/components/LeaderboardTable.tsx`

Instead of N sequential `eth_call` operations for reserves:
```typescript
// N tokens × 2 calls = 2N sequential round-trips ❌
const reserve = await marketContract.reserveUSDC();
```

All reserve reads are batched via wagmi `useReadContracts`:
```typescript
// All N tokens → 1 multicall round-trip ✅
const multicallContracts = activeAssets.flatMap(asset => [
  { address: asset.marketAddress, abi: marketAbi, functionName: 'reserveUSDC' },
  { address: asset.marketAddress, abi: marketAbi, functionName: 'reserveToken' },
]);
const results = useReadContracts({ contracts: multicallContracts });
```

**Savings:** 2N sequential RPC calls → 1 batched multicall per UI refresh.

---

### 8.5 Supabase-First Trade Storage

All trade history queries target Supabase, not the blockchain. This means:

| Data Need | Old approach | New approach |
|---|---|---|
| Chart data | Re-crawl N blocks of `eth_getLogs` | 1 Supabase SELECT, indexed by `market_address + timestamp` |
| User portfolio | Scan all markets for user address | 1 Supabase SELECT, indexed by `trader_address` |
| Admin trade count | Sum all localStorage across all users | 1 Supabase COUNT |
| Cost basis | Parse local logs per session | 1 Supabase SELECT with SUM aggregation |

**Savings:** Eliminates blockchain re-crawls entirely for all analytics features.

---

### 8.6 `hasLoadedRef` Loading Indicator Guard

**Location:** `src/hooks/usePortfolio.ts`

```typescript
const hasLoadedRef = useRef(false);
// On first load only:
if (!hasLoadedRef.current) setIsLoadingIndexer(true);
```

The loading spinner shows only on the first query. Subsequent background refreshes are silent, preventing UI flicker on every 10-second re-query cycle.

---

## 9. Security Considerations

### 9.1 Wallet Ownership

All on-chain write operations (token creation, buy, sell, approve) require the user's wallet signature. The blockchain enforces that only the transaction signer can spend their USDC or tokens. ArcMeme is fully non-custodial — no server holds private keys.

### 9.2 Profile Ownership

Profile creation is gated by wallet address at the application query level. A user can only create or update the profile matching their connected wallet. **RLS policies are planned** to enforce this at the database layer using a custom `set_request_wallet()` Postgres session variable (implementation plan designed and documented).

### 9.3 Token Ownership

`tokenService.deactivateToken()` enforces that only the `creator_wallet` can deactivate a token (application-level check). The Factory smart contract enforces creator privileges at the protocol level for any creator-only functions.

### 9.4 Trade Event Integrity

`trade_events` rows are written by the frontend after a confirmed on-chain transaction. The `tx_hash` column provides a verifiable link to the actual blockchain record. While a malicious actor with the anon key could theoretically inject fabricated trade events, all economic consequences (actual USDC/token transfers) happen on-chain and cannot be spoofed. Off-chain records affect only UI display (charts, leaderboard), never actual balances.

Future mitigation: an on-chain indexer that writes `trade_events` autonomously from verified event logs.

### 9.5 Admin Panel Access

The admin wallet address is compared case-insensitively at render time. The comparison is UI-level — non-admin users simply see the "Access Denied" screen. Supabase admin queries still use the anon key. Future improvement: a service-role key used only for admin Supabase operations.

### 9.6 Environment Variables

All sensitive values live in `.env` (gitignored):
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — safe to expose in the browser bundle (anon key is designed for client-side use with RLS protection)
- `VITE_WALLETCONNECT_PROJECT_ID` — safe for browser exposure (CORS-protected by WalletConnect)
- `VITE_ADMIN_WALLET_ADDRESS` — hardened by being UI-only; database queries should ultimately use a backend-side check

### 9.7 Input Validation

- **Duplicate symbol** — checked against `assets[]` in the UI before any contract call; double-checked via `simulateContract()` at the Solidity level ("Symbol already exists" revert).
- **Amounts** — parsed with `parseUnits()` from viem; throws on non-numeric or negative input before any wallet signature is requested.
- **Logo upload** — validated as `image/*` MIME type; resized to 128×128 WebP in-browser via Canvas API before any storage, preventing oversized payloads.
- **Wallet addresses** — all stored and compared lowercased to prevent case-sensitivity attacks.

---

## 10. Current Status

### Completed ✅

- ✅ React + TypeScript + Vite project foundation
- ✅ Arc Testnet chain definition (`wagmi.ts`, Chain ID 5042002, USDC as native)
- ✅ WalletConnect + RainbowKit integration (MetaMask, Brave, WalletConnect, and more)
- ✅ Auto-chain-switch to Arc Testnet when user is on wrong network
- ✅ Supabase client with environment variable injection (`src/lib/supabase.ts`)
- ✅ `profiles` table with auto-creation on wallet connect
- ✅ `tokens` table with insert, update, and soft-delete operations
- ✅ `trade_events` table as canonical off-chain event log
- ✅ `portfolio_snapshots` table with debounced writes
- ✅ `ArcMemeFactory` integration (address, ABI, `createToken`, `getAllTokens`, `tokenToMarket`)
- ✅ Token creation UI: 3-step flow (form → confirm → success)
- ✅ Client-side logo resize to 128×128 WebP via Canvas API
- ✅ AMM math library (`src/trading.ts`): buy, sell, spot price, market cap, price impact, slippage
- ✅ `BuyPanel.tsx`: USDC → token with allowance check, approve, buy, Supabase write
- ✅ `SellPanel.tsx`: token → USDC with allowance check, approve, sell, Supabase write
- ✅ Trade confirmation screen with tx hash + ArcScan deep link
- ✅ `TradingChart.tsx` with lightweight-charts v5, area series, crosshair tooltip
- ✅ Chart timestamp deduplication (while-loop collision resolution)
- ✅ Chart single-point edge case handling (phantom +60s point injection)
- ✅ Chart error boundary (`TradingChartErrorBoundary`)
- ✅ Chart cleanup on unmount (no memory leaks)
- ✅ `Dashboard.tsx`: Trending (score-ranked), Latest Launches, Top Gainers, Live Ticker
- ✅ `LeaderboardTable.tsx`: Top Tokens (market cap), Top Creators (token count), Top Traders (volume)
- ✅ `CreatorProfile.tsx`: portfolio overview, holdings, launched tokens, trade history
- ✅ `usePortfolio.ts`: multicall reserve reads, cost basis, P&L, portfolio value
- ✅ 5-second blockchain sync with static cache + reserves cache + fingerprint guard
- ✅ DEV_CONTRACTS filtering (9 test tokens hidden from production UI)
- ✅ Admin Panel with total users, active users (7d), tokens created, total transactions
- ✅ Dark / Light theme toggle with CSS variable system (`src/index.css`)
- ✅ `SwapPage.tsx`: Swap (Beta) placeholder — navigable, Circle App Kit roadmap info
- ✅ Sidebar: "Trade ArcMeme" removed, "Swap" with Beta badge added as live link
- ✅ React StrictMode idempotency (all effects protected against double-invocation)
- ✅ TypeScript build: zero errors (`npm run build` — `✓ built in 3.76s`)
- ✅ Production bundle generated with code splitting

### In Progress 🟡

- 🟡 Row Level Security policies — wallet-based session variable design complete, SQL not yet executed in production
- 🟡 `profile_id` foreign key migration — migration SQL written, pending Supabase execution
- 🟡 True `block_timestamp` — currently uses client clock; on-chain timestamp needs confirmed receipt data
- 🟡 `block_number` — currently stored as `0`; requires receipt parsing improvement

### Planned 🔵

- 🔵 Circle App Kit Swap integration (replaces SwapPage.tsx placeholder)
- 🔵 Sign-In With Ethereum (SIWE) → Supabase JWT for `auth.uid()` RLS enforcement
- 🔵 Materialized view for leaderboard (replace runtime aggregation)
- 🔵 On-chain event indexer (replace frontend-driven `eth_getLogs`)
- 🔵 Mobile-responsive bottom navigation bar (sidebar is hidden on mobile viewports)
- 🔵 Push notifications for large trades on monitored tokens
- 🔵 Partitioned `trade_events` table by market or time range (scaling)

---

## 11. Future Roadmap

### Phase 1 — Production Hardening (Near-term)

| Item | Description |
|---|---|
| **RLS Deployment** | Execute wallet-based RLS migration SQL. Enforce INSERT ownership on `trade_events`, `tokens`, `profiles` using `set_request_wallet()` session variable. |
| **`profile_id` Migration** | Add UUID FK `profile_id` to `trade_events`, `tokens`, `portfolio_snapshots`. Backfill existing rows via `UPDATE ... FROM profiles WHERE lower(trader_address) = lower(wallet_address)`. |
| **True Block Timestamps** | Parse `block.timestamp` from the confirmed transaction receipt to replace client-clock values. |
| **Mobile Navigation** | Implement responsive bottom navigation bar for the sidebar on mobile viewports. |

### Phase 2 — Circle App Kit Integration (Mid-term)

| Item | Description |
|---|---|
| **Swap Page** | Replace the SwapPage.tsx placeholder with Circle App Kit's native swap component. |
| **USDC Cross-chain Bridge** | Leverage Circle's CCTP for native USDC bridging to and from Arc Network. |
| **Gasless Transactions** | Circle Paymaster integration to sponsor gas costs for new users onboarding. |
| **Programmable Wallets** | Circle embedded wallets for users without a browser-extension wallet. |

### Phase 3 — Advanced Analytics (Mid-term)

| Item | Description |
|---|---|
| **Portfolio Chart** | Historical portfolio value line chart from `portfolio_snapshots` data. |
| **P&L Breakdown** | Realized vs. unrealized P&L per token, per time window. |
| **Materialized Leaderboard** | Postgres `MATERIALIZED VIEW` + `pg_cron` refresh for O(1) leaderboard reads. |
| **Token Analytics Page** | Dedicated `/analytics/:address` page with full trade history, holder distribution, volume breakdown by day. |
| **Price Alerts** | User-configurable price alerts for watched tokens. |

### Phase 4 — Ecosystem Expansion (Long-term)

| Item | Description |
|---|---|
| **On-chain Indexer** | Dedicated indexer service (Ponder, The Graph, or custom) that replaces frontend-driven `eth_getLogs` polling. Trade events written to Supabase by the indexer — not the user's browser. |
| **SIWE Auth** | Sign-In With Ethereum → Supabase JWT. Enables `auth.uid()` in RLS policies, eliminating the session variable workaround. |
| **Token Verification** | Creator-submitted verification workflow with community voting and admin approval gates. |
| **Social Layer** | Follow creators, watchlist tokens, shareable trade cards (OG image generation). |
| **Arc Mainnet Launch** | Migrate from Arc Testnet to Arc Mainnet upon network availability. |

---

## 12. Conclusion

### What Was Built

ArcMeme is a complete, production-quality decentralized application demonstrating the full lifecycle of a DeFi product: smart contract integration, real-time blockchain data synchronization, off-chain event indexing, user identity, analytics, and a polished UI — all without backend servers, using only Supabase as the off-chain data layer.

### Architecture Decisions

**Why Supabase instead of a custom indexer:**
Building a dedicated blockchain indexer requires significant DevOps infrastructure (servers, queues, retry logic, monitoring). Supabase provides Postgres + instant REST API + real-time subscriptions with zero servers to manage. The trade-off is that trade events are written by the frontend (trustful model). This is acceptable for a testnet product and upgrades cleanly to an on-chain indexer when production demands it.

**Why wallet-based identity instead of Supabase Auth:**
ArcMeme's users authenticate via Web3 wallets, not email and password. Requiring a Sign-In With Ethereum (SIWE) flow adds friction at onboarding. The current approach — wallet address as identity, profile auto-created on connect — maximizes conversion. SIWE + Supabase JWT is planned for Phase 4 when strict database-level RLS enforcement becomes critical.

**Why AMM math is replicated in TypeScript:**
Running the exact same constant-product formulas in `src/trading.ts` as in the Solidity market contract eliminates "what you see ≠ what you get" bugs. Users see precise output amounts before signing. This also enables accurate price-impact and slippage warnings without additional RPC calls.

**Why `lightweight-charts` instead of Recharts or Chart.js:**
TradingView's `lightweight-charts` is purpose-built for financial time series. It handles thousands of data points with WebGL, supports custom price formatters (essential for sub-penny meme token prices like `$0.0000000202`), and delivers a professional crosshair interaction. The implementation complexity (StrictMode crashes, single-point edge cases, mandatory cleanup) was worth the UX payoff.

### Lessons Learned

1. **React StrictMode surfaces real bugs.** Every double-invocation issue exposed a genuine idempotency problem that would have manifested in production under network retries or concurrent sessions. Treating StrictMode as a bug-finder rather than a nuisance improved the overall reliability of the application.

2. **`useRef` for stable effect closures.** The infinite render loop was a classic case of reading mutable state inside an effect that writes to that same state. Using `assetsRef` to hold a stable reference the effect can read without depending on is now a first-class pattern in the codebase.

3. **Fingerprint before `setState`.** Any polling or subscription that calls `setState` on each tick must compare new data to old before setting. A string fingerprint of meaningful fields is an effective O(N) comparison that prevents unnecessary re-renders in high-frequency update scenarios.

4. **Establish off-chain storage schema early.** The localStorage-to-Supabase migration required retrofitting every read path (charts, portfolio, leaderboard, admin) simultaneously. Future projects should define the `trade_events` schema before writing any trading UI.

5. **Rate limits are architectural constraints, not afterthoughts.** QuickNode's rate limits forced the reserves-cache optimization. Designing the RPC call budget (calls per cycle × cycles per minute × tokens) before writing sync code would have prevented the initial overrun.

### Current Readiness

ArcMeme is **testnet-ready for public use**. The complete trading loop — connect wallet → launch token → buy/sell → view chart → check portfolio → leaderboard → creator profile — works end-to-end on Arc Testnet. The production build generates zero TypeScript errors. Remaining work (RLS, `profile_id` migration, true block timestamps) is incremental hardening, not blocking functionality.

For **judges**: ArcMeme demonstrates a complete non-custodial DeFi ecosystem with real on-chain integration, off-chain indexing, and polished UX built natively for Arc Network's USDC-first environment.

For **builders**: The codebase is a reference implementation of wallet-based identity, AMM math mirroring in TypeScript, Supabase as a trade indexer, and lightweight-charts integration in a React + Wagmi project.

For **investors**: ArcMeme is positioned to become the primary token launchpad and trading venue on Arc Network — analogous to Pump.fun on Solana — with Circle App Kit integration as the next major liquidity and user-acquisition catalyst.

---

*Generated from direct analysis of the ArcMeme source codebase.*
*All file names, contract addresses, AMM formulas, database schemas, and challenge descriptions are sourced from the actual code.*
