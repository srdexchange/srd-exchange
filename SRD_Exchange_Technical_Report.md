# SRD Exchange — Technical Architecture & Integration Report

**Prepared by:** Development Team
**Date:** April 2026
**Version:** 1.0
**Project:** SRD Exchange — P2P USDT Trading Platform

---

## Table of Contents

1. [Current Platform State](#1-current-platform-state)
2. [Wallet Architecture Explained](#2-wallet-architecture-explained)
3. [Swap Integration — Rango Protocol](#3-swap-integration--rango-protocol)
4. [Why Rango Cannot Support Smart Wallets](#4-why-rango-cannot-support-smart-wallets)
5. [Why the EOA Also Has Limitations](#5-why-the-eoa-also-has-limitations)
6. [The Correct Architecture — LeoKit + Smart Wallet](#6-the-correct-architecture--leokit--smart-wallet)
7. [Multi-Chain Smart Wallet Deployment](#7-multi-chain-smart-wallet-deployment)
8. [Gas Cost Analysis](#8-gas-cost-analysis)
9. [Phased Implementation Plan](#9-phased-implementation-plan)
10. [Summary & Recommendations](#10-summary--recommendations)

---

## 1. Current Platform State

### ✅ What Is Fully Working

**P2P Fiat Trading (BSC Mainnet)**
- Users can Buy and Sell USDT using UPI and CDM payment methods
- Smart contract escrow holds USDT securely during sell orders
- Transactions are **fully gasless** — the platform pays all gas fees via Biconomy Paymaster
- Smart contract deployed at: `0xD64d78dCFc550F131813a949c27b2b439d908F54` on BSC Mainnet

**Supported Order Types**

| Type | Limit |
|---|---|
| BUY_UPI | Max 20 USDT per order |
| BUY_CDM | Min 100 USDT / Max 300 USDT |
| SELL_UPI | Max 100 USDT per order |
| SELL_CDM | Min 100 USDT / Max 500 USDT |

**Order Lifecycle**
```
PENDING → ADMIN_APPROVED → PAYMENT_SUBMITTED → PAYMENT_VERIFIED → USDT_TRANSFERRED → COMPLETED
```

**Authentication**
- Email, Phone, Google, Facebook, LinkedIn, Twitter via Particle Network
- MetaMask and external EVM wallets
- Every user receives an EOA + Biconomy Smart Wallet on signup

---

### ❌ What Is Not Yet Working

| Feature | Status |
|---|---|
| Swap (cross-chain) | In development — blocked by technical issues detailed below |
| P2P Fiat on chains other than BSC | Not built — BSC only |
| Trading charts / order book | Marked as "Upcoming" in UI |

---

## 2. Wallet Architecture Explained

When a user signs up on SRD Exchange, two wallet addresses are generated automatically:

```
User signs up (email / phone / social / MetaMask)
             ↓
Particle Network generates:

  EOA Address:           0xABC...   ← Standard wallet, same address on ALL chains
  Biconomy Smart Wallet: 0xDEF...   ← Contract wallet, currently BSC ONLY
```

These are **two completely different addresses.**

| | EOA | Smart Wallet |
|---|---|---|
| Type | Standard private key wallet | Smart contract (ERC-4337) |
| Chains available | All EVM chains | BSC only (current config) |
| Gasless support | ❌ No | ✅ Yes (via Paymaster) |
| Transaction type | `eth_sendTransaction` | ERC-4337 UserOperation |
| Used for | Signing | P2P Trading (gasless) |

The Smart Wallet is what the platform uses for P2P trading to make transactions gasless. However, it only exists on BSC because that is the only chain configured in the current setup.

---

## 3. Swap Integration — Rango Protocol

The current swap page integrates **Rango Protocol** (`@rango-dev/widget-embedded`) — a cross-chain swap aggregator widget.

**Configured chains for swap:**
ETH, BSC, BASE, ARBITRUM, OPTIMISM, POLYGON, CRONOS, AVAX, SCROLL

**Current issues with the Rango widget:**

During integration, several technical issues were encountered with `@rango-dev/widget-embedded`:

1. **Module compatibility error** — `tron/mod.js` not found in browser environment
2. **Duplicate module identity crash** — npm installs 36+ separate copies of `@rango-dev/wallets-core`, one per provider package. The widget uses `instanceof Provider` internally to distinguish wallet types, but this check fails when the `Provider` class comes from different module copies. This causes: `TypeError: Cannot read properties of undefined (reading 'type')`
3. **ESM/SSR conflicts** — The widget accesses browser globals during module initialization, incompatible with Next.js server-side rendering
4. **React 19 compatibility** — Rango's widget examples are built against React 18 / Next.js 13. The platform runs React 19 / Next.js 15

**Resolution status:** A source-level patch has been applied to `node_modules/@rango-dev/widget-embedded/dist/index.js` to fix the duplicate module crash. The widget loads but wallet integration limitations remain (detailed in Section 4).

---

## 4. Why Rango Cannot Support Smart Wallets

This is a **hard technical incompatibility**, not a configuration issue. It cannot be worked around.

### How Rango Sends Transactions

```
Rango widget internally calls:
window.ethereum.request({ method: 'eth_sendTransaction', params: [tx] })
         ↓
Standard Ethereum transaction sent directly via EOA
         ↓
Smart Wallet is completely bypassed
```

### How Smart Wallets Work

```
ERC-4337 Smart Wallet requires:
UserOperation { callData, nonce, signature, paymasterData... }
         ↓
Submitted to a Bundler (not directly to the chain)
         ↓
Bundler packages and executes via EntryPoint contract
         ↓
Paymaster sponsors the gas
```

These are two fundamentally different transaction models. Rango is built entirely on the traditional `eth_sendTransaction` model. It has no mechanism to:
- Accept a custom transaction sender
- Submit UserOperations to a Bundler
- Interact with a Paymaster
- Use ERC-4337 account abstraction in any form

There is no configuration option, plugin, or workaround available. Even wrapping the widget will not help — the transaction signing happens deep inside the widget's internal wallet management code.

### Questions to Raise with Rango Team

If official confirmation is required, the following questions should be directed to Rango's technical support:

1. Does `@rango-dev/widget-embedded` support ERC-4337 smart accounts or AA wallets?
2. Is there an `externalSigner` or `customProvider` option to inject a custom transaction sender (e.g. Biconomy Smart Account)?
3. Can the widget accept a pre-signed UserOperation instead of calling `eth_sendTransaction`?
4. Is ERC-4337 / Account Abstraction support on the product roadmap? If so, what is the timeline?
5. Is there a way to disable Rango's internal wallet management entirely and use an externally managed wallet?

---

## 5. Why the EOA Also Has Limitations

Even if we proceed with the EOA (bypassing smart wallet entirely), a destination address problem remains.

### The Problem

When a user performs a cross-chain swap (e.g. BSC → ETH):

```
Source chain:      BSC Smart Wallet (0xDEF...)  ← Platform wallet users know and use
Destination chain: EOA on ETH (0xABC...)        ← DIFFERENT address
```

Users receive funds on their EOA on the destination chain — not their platform Smart Wallet address. This creates the following issues:

- **UX confusion:** The platform displays the Smart Wallet address throughout. Users do not expect funds to arrive at a different address.
- **Asset fragmentation:** ETH, BASE, ARB, POLYGON holdings end up on the EOA which is not the active platform wallet.
- **Support overhead:** Users will report "missing funds" when funds arrive at EOA rather than Smart Wallet.
- **No gasless:** EOA transactions cannot be made gasless — users must hold native tokens on each chain to pay gas.

---

## 6. The Correct Architecture — LeoKit + Smart Wallet

**LeoKit** (`https://leokit.dev`) is a B2B REST API for cross-chain swaps. Unlike Rango which is a pre-built widget, LeoKit returns **unsigned transaction payloads** and the application is responsible for signing them. This is the key difference.

### Why This Solves Everything

```
Step 1: Call LeoKit GET /quote
        → Returns best swap routes across 107+ DEXes

Step 2: User selects route, call POST /deposit
        → Returns unsigned transaction: { to, data, value, gasLimit }

Step 3: Pass unsigned tx to Biconomy Smart Account:
        smartAccount.sendTransaction({ to, data, value })

Step 4: Biconomy Paymaster sponsors the gas
        → Bundler executes on the source chain

Step 5: Destination = Smart Wallet address on target chain
        → Funds arrive in platform Smart Wallet, not EOA

Step 6: Poll GET /status until completion
```

### Comparison

| Requirement | Rango (current) | LeoKit + Smart Wallet |
|---|---|---|
| Smart Wallet as source | ❌ Not possible | ✅ Full support |
| Gasless transactions | ❌ Not possible | ✅ Via Paymaster |
| Destination = Smart Wallet | ⚠️ EOA only | ✅ Smart Wallet |
| Multi-chain support | ✅ 9 chains | ✅ 30+ chains |
| Custom UI control | ❌ Widget only | ✅ Full control |
| React 19 / Next.js 15 | ⚠️ Buggy | ✅ REST API, no conflicts |

### LeoKit API Coverage

| Endpoint | Purpose |
|---|---|
| `GET /quote` | Fetch best routes from all protocols |
| `POST /deposit` | Generate unsigned transaction(s) |
| `GET /status` | Track swap progress |
| `GET /assets` | List supported tokens |
| `GET /balances` | Multi-chain wallet balances |
| `GET /gas-price` | Current gas prices per chain |
| `POST /save-transaction` | Register tx hash for tracking |

---

## 7. Multi-Chain Smart Wallet Deployment

To enable Smart Wallet swaps across all chains, the Smart Wallet contract must be deployed on each chain. Biconomy supports deterministic deployment using CREATE2 — meaning **the same address** can be deployed on multiple chains.

### What Is Required

1. **Expand Particle configuration** to include all target chains
2. **Deploy Smart Wallet** on each chain (one-time operation per chain)
3. **Fund Biconomy Paymaster** on each chain (ongoing operational cost)
4. **Set spending policies** on each Paymaster (which contracts/methods are sponsored)

### Current vs Required Configuration

```ts
// Current (BSC only)
chains: [bscWithCustomRPC]

// Required (all target chains)
chains: [bsc, ethereum, base, arbitrum, optimism, polygon, avalanche, scroll]
```

---

## 8. Gas Cost Analysis

The platform sponsors gas via Biconomy Paymaster. The following are estimated costs per swap transaction (two transactions required: approve + swap):

| Chain | Gas per swap (approx.) | Platform cost per swap |
|---|---|---|
| BSC | ~$0.01 – $0.05 | Very low |
| Polygon | ~$0.01 – $0.05 | Very low |
| Base | ~$0.01 – $0.10 | Very low |
| Arbitrum | ~$0.05 – $0.20 | Low |
| Optimism | ~$0.05 – $0.20 | Low |
| Avalanche | ~$0.10 – $0.50 | Moderate |
| Scroll | ~$0.05 – $0.20 | Low |
| **ETH Mainnet** | **~$2 – $50** | **High — variable** |

### Recommendation on ETH Mainnet

ETH Mainnet gas is highly variable and can become extremely expensive during network congestion. Sponsoring gas for every swap on ETH Mainnet is not economically sustainable without a fee model that accounts for this cost.

**Suggested approach:**
- Phase 1 Paymaster: BSC, Polygon, Base, Arbitrum, Optimism, Scroll (all affordable)
- ETH Mainnet: Users pay their own gas, or ETH Mainnet swaps are excluded initially
- Re-evaluate ETH Mainnet after platform revenue is established

---

## 9. Phased Implementation Plan

### Phase 1 — Immediate (1–3 days)

**Goal:** Ship a working swap page quickly using Rango + EOA

- Fix remaining Rango widget issues (patch applied, nearly complete)
- Add all 9 chains to Particle config so EOA can sign on all chains
- Users connect via MetaMask option (which reads Particle's EOA provider)
- Destination pre-filled with EOA address
- Fiat P2P on BSC continues unchanged with Smart Wallet + Paymaster

**Limitations:**
- Swap uses EOA, not Smart Wallet
- Not gasless
- Destination is EOA (not Smart Wallet) on destination chain

---

### Phase 2 — Full Implementation (3–5 weeks)

**Goal:** Smart Wallet + gasless for all swaps across all target chains

**Week 1–2: Infrastructure**
- Expand Particle config to all target chains
- Deploy Smart Wallet on all chains via Biconomy dashboard
- Fund and configure Paymaster on each chain
- Set up spending policies per chain

**Week 2–3: LeoKit Integration**
- Obtain LeoKit API key
- Build token/chain selector UI
- Integrate `GET /quote` — display routes and pricing
- Integrate `POST /deposit` — generate unsigned transactions
- Wire Biconomy Smart Account as transaction signer
- Implement ERC-20 approval flow (required before swaps)

**Week 3–4: Execution & Tracking**
- Transaction execution via Smart Account + Paymaster
- Integrate `POST /save-transaction` and `GET /status` polling
- Progress UI (pending → processing → completed)
- Error handling and retry logic

**Week 4–5: Testing & Polish**
- End-to-end testing across all chains
- Gas estimation and paymaster balance monitoring
- Mobile responsiveness
- Edge cases (slippage, failed routes, timeout)

---

## 10. Summary & Recommendations

### Core Issue

The platform's vision — gasless transactions using Smart Wallets across all chains — is technically sound and achievable. However, Rango Protocol's widget architecture is incompatible with ERC-4337 Smart Wallets. This is not fixable through configuration or patching.

### Immediate Action Items

| Priority | Action | Owner |
|---|---|---|
| High | Confirm LeoKit API key availability | Business |
| High | Confirm Biconomy Paymaster budget per chain | Business |
| High | Decide on ETH Mainnet inclusion (cost vs value) | Business |
| Medium | Contact Rango team with questions from Section 4 | Development |
| Medium | Ship Phase 1 (Rango + EOA) as interim solution | Development |
| Low | Begin Phase 2 architecture setup | Development |

### Final Recommendation

**Ship Phase 1 immediately** to demonstrate a working swap feature. In parallel, begin Phase 2 infrastructure work (Paymaster funding, multi-chain deployment). Phase 2 delivers the complete vision: Smart Wallet + gasless + multi-chain swaps with full platform wallet integration.

The two phases are independent — Phase 1 does not interfere with Phase 2 development, and Phase 2 will replace Phase 1 cleanly when ready.

---

*Document prepared by SRD Exchange Development Team — April 2026*
*For technical queries, contact the development team directly.*
