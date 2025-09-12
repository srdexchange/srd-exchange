import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { parseUnits, formatUnits, Address } from "viem";
import { bsc } from "wagmi/chains"; // Only import BSC mainnet
import { config } from "@/lib/wagmi";
import { readContract, simulateContract } from "@wagmi/core";

// Add Gas Station import
const GAS_STATION_ENABLED =
  process.env.NEXT_PUBLIC_GAS_STATION_ENABLED === "true";

// Contract addresses - MAINNET ONLY
const CONTRACTS = {
  USDT: {
    [56]: "0x55d398326f99059fF775485246999027B3197955" as Address, // BSC Mainnet only
  },
  P2P_TRADING: {
    [56]: "0xD64d78dCFc550F131813a949c27b2b439d908F54" as Address, // BSC Mainnet only
  },
};

// Add decimals ABI for USDT
const USDT_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Add decimals function
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const P2P_TRADING_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_usdtAmount", type: "uint256" },
      { internalType: "uint256", name: "_inrAmount", type: "uint256" },
      { internalType: "string", name: "_orderType", type: "string" },
    ],
    name: "createBuyOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_usdtAmount", type: "uint256" },
      { internalType: "uint256", name: "_inrAmount", type: "uint256" },
      { internalType: "string", name: "_orderType", type: "string" },
    ],
    name: "createSellOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_orderId", type: "uint256" }],
    name: "verifyPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_orderId", type: "uint256" }],
    name: "completeBuyOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_orderId", type: "uint256" }],
    name: "completeSellOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_orderId", type: "uint256" }],
    name: "confirmOrderReceived",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_orderId", type: "uint256" }],
    name: "getOrder",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "orderId", type: "uint256" },
          { internalType: "address", name: "user", type: "address" },
          { internalType: "uint256", name: "usdtAmount", type: "uint256" },
          { internalType: "uint256", name: "inrAmount", type: "uint256" },
          { internalType: "bool", name: "isBuyOrder", type: "bool" },
          { internalType: "bool", name: "isCompleted", type: "bool" },
          { internalType: "bool", name: "isVerified", type: "bool" },
          { internalType: "bool", name: "adminApproved", type: "bool" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "string", name: "orderType", type: "string" },
        ],
        internalType: "struct P2PTrading.Order",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_orderId", type: "uint256" }],
    name: "approveOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getOrderCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_usdtAmount", type: "uint256" },
      { internalType: "uint256", name: "_inrAmount", type: "uint256" },
      { internalType: "string", name: "_orderType", type: "string" },
      { internalType: "address", name: "_adminWallet", type: "address" },
    ],
    name: "directSellTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAdminWallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Add this new ABI entry to P2P_TRADING_ABI array:
  {
    inputs: [
      { internalType: "address", name: "_userAddress", type: "address" },
      { internalType: "uint256", name: "_usdtAmount", type: "uint256" },
      { internalType: "uint256", name: "_inrAmount", type: "uint256" },
      { internalType: "string", name: "_orderType", type: "string" },
    ],
    name: "adminExecuteSellTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Helper function to safely convert BigInt to string for JSON serialization
const serializeBigInt = (value: bigint): string => {
  return value.toString();
};

// Helper function to create serializable wallet data
const createSerializableWalletData = (walletInfo: any) => {
  return {
    address: walletInfo.address,
    isConnected: walletInfo.isConnected,
    chainId: walletInfo.chainId,
    isOnBSC: walletInfo.isOnBSC,
    balances: {
      bnb: {
        raw: serializeBigInt(walletInfo.balances.bnb.raw),
        formatted: walletInfo.balances.bnb.formatted,
        symbol: walletInfo.balances.bnb.symbol,
      },
      usdt: {
        raw: serializeBigInt(walletInfo.balances.usdt.raw),
        formatted: walletInfo.balances.usdt.formatted,
        symbol: walletInfo.balances.usdt.symbol,
      },
    },
    canTrade: walletInfo.canTrade,
    lastUpdated: walletInfo.lastUpdated,
  };
};

export function useWalletManager() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [walletData, setWalletData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Support BSC mainnet only
  const { data: bnbBalance, refetch: refetchBnb } = useBalance({
    address,
    chainId: chainId,
  });

  // Get USDT balance - BSC Mainnet only
  const { data: usdtBalance, refetch: refetchUsdt } = useReadContract({
    address: CONTRACTS.USDT[56], // Force mainnet
    abi: USDT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && chainId === bsc.id, // Only enable for mainnet
    },
  });

  // Get USDT decimals for mainnet
  const { data: usdtDecimals } = useReadContract({
    address: CONTRACTS.USDT[56], // Force mainnet
    abi: USDT_ABI,
    functionName: "decimals",
    query: {
      enabled: !!address && chainId === bsc.id, // Only enable for mainnet
    },
  });

  // Add debugging for USDT balance
  useEffect(() => {
    if (usdtBalance && address) {
      console.log("🔍 USDT Balance Debug:", {
        address,
        chainId,
        contractAddress: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        rawBalance: usdtBalance.toString(),
        decimals: usdtDecimals ? Number(usdtDecimals) : "unknown",
        formattedWithActualDecimals: usdtDecimals
          ? formatUnits(usdtBalance, Number(usdtDecimals))
          : "unknown",
        // Test different decimal interpretations
        as6Decimals: formatUnits(usdtBalance, 6),
        as18Decimals: formatUnits(usdtBalance, 18),
      });
    }
  }, [usdtBalance, usdtDecimals, address, chainId]);

  // Transaction management
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Force BSC mainnet only
  const isOnBSC = chainId === bsc.id;

  const switchToBSC = async (): Promise<boolean> => {
    try {
      if (chainId !== bsc.id) {
        console.log("🔄 Switching to BSC Mainnet...");
        await switchChain({ chainId: bsc.id });
        return true;
      }
      return true;
    } catch (error) {
      console.error("Failed to switch to BSC Mainnet:", error);
      return false;
    }
  };

  // Update fetchWalletData to only work with mainnet
  const fetchWalletData = async () => {
    if (!address || !isConnected) return null;

    setIsLoading(true);

    try {
      if (chainId !== bsc.id) {
        console.log("🔄 Must switch to BSC Mainnet...");
        await switchChain({ chainId: bsc.id });
        setIsLoading(false);
        return null;
      }

      console.log("📊 Fetching wallet data for BSC Mainnet only...");

      // Format USDT balance using actual decimals from contract
      let formattedUsdtBalance = "0";
      if (usdtBalance) {
        try {
          const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
          formattedUsdtBalance = formatUnits(usdtBalance, actualDecimals);

          console.log("✅ USDT balance (BSC Mainnet):", {
            raw: usdtBalance.toString(),
            decimals: actualDecimals,
            formatted: formattedUsdtBalance,
          });
        } catch (error) {
          console.error("❌ Error formatting USDT balance:", error);
          formattedUsdtBalance = "0";
        }
      }

      const walletInfo = {
        address,
        chainId: bsc.id, // Force mainnet
        isOnBSC: true,
        balances: {
          bnb: {
            raw: bnbBalance?.value || BigInt(0),
            formatted: bnbBalance ? formatUnits(bnbBalance.value, 18) : "0",
            symbol: "BNB",
          },
          usdt: {
            raw: usdtBalance || BigInt(0),
            formatted: formattedUsdtBalance,
            symbol: "USDT",
          },
        },
        canTrade: (bnbBalance?.value || BigInt(0)) > parseUnits("0.001", 18),
        lastUpdated: new Date().toISOString(),
      };

      console.log("💰 Wallet info (BSC Mainnet only):", {
        address: walletInfo.address,
        usdtFormatted: walletInfo.balances.usdt.formatted,
        bnbFormatted: walletInfo.balances.bnb.formatted,
        canTrade: walletInfo.canTrade,
      });

      setWalletData(walletInfo);

      return createSerializableWalletData(walletInfo);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // P2P Trading Contract Functions
  const createBuyOrderOnChain = async (
    usdtAmount: string,
    inrAmount: string,
    orderType: string
  ) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
    const usdtAmountWei = parseUnits(usdtAmount, actualDecimals);
    const inrAmountWei = parseUnits(inrAmount, 2);

    writeContract({
      address:
        CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: "createBuyOrder",
      args: [usdtAmountWei, inrAmountWei, orderType],
    });
  };

  const createDirectSellOrderOnChain = async (
    usdtAmount: string,
    inrAmount: string,
    orderType: string
  ) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    console.log("🔗 Creating direct sell order (user to admin):", {
      usdtAmount,
      inrAmount,
      orderType,
      contractAddress:
        CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      usdtContract: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
    });

    if (!usdtAmount || !inrAmount) {
      throw new Error("Invalid amounts provided");
    }

    try {
      const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
      const usdtAmountWei = parseUnits(usdtAmount, actualDecimals);
      const inrAmountWei = parseUnits(inrAmount, 2); // INR with 2 decimals

      console.log("💰 Amounts for direct sell order:", {
        usdtAmount,
        inrAmount,
        usdtAmountWei: usdtAmountWei.toString(),
        inrAmountWei: inrAmountWei.toString(),
        actualDecimals,
      });

      // Get admin wallet address from contract
      const adminWallet = await readContract(config as any, {
        address:
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: "getAdminWallet",
      });

      console.log("🔍 Admin wallet address:", adminWallet);

      // Check user's USDT balance
      const userBalance = await readContract(config as any, {
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      console.log(
        "💰 User USDT balance:",
        formatUnits(userBalance, actualDecimals)
      );

      if (userBalance < usdtAmountWei) {
        throw new Error(
          `Insufficient USDT balance. Required: ${usdtAmount} USDT, Available: ${formatUnits(
            userBalance,
            actualDecimals
          )} USDT`
        );
      }

      // Check allowance for admin wallet (not contract)
      const currentAllowance = await readContract(config as any, {
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: "allowance",
        args: [
          address,
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        ],
      });

      console.log(
        "🔍 Current allowance for P2P contract:",
        formatUnits(currentAllowance, actualDecimals)
      );

      if (currentAllowance < usdtAmountWei) {
        console.log("🔓 Need approval for P2P contract...");
        const approveAmount = usdtAmountWei * BigInt(2); // Approve 2x for future transactions

        console.log(
          "📝 Approving USDT for P2P contract...",
          formatUnits(approveAmount, actualDecimals)
        );

        writeContract({
          address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
          abi: USDT_ABI,
          functionName: "approve",
          args: [
            CONTRACTS.P2P_TRADING[
              chainId as keyof typeof CONTRACTS.P2P_TRADING
            ],
            approveAmount,
          ],
        });

        // Wait for approval transaction
        console.log("⏳ Waiting for USDT approval...");

        // Return early to let user confirm approval first
        throw new Error(
          "USDT approval required. Please confirm the approval transaction first, then try again."
        );
      }

      // Execute direct sell transfer
      console.log("📝 Executing direct sell transfer to admin...");
      writeContract({
        address:
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: "directSellTransfer",
        args: [usdtAmountWei, inrAmountWei, orderType, adminWallet],
      });
    } catch (error) {
      console.error("❌ Error in createDirectSellOrderOnChain:", error);
      throw new Error(
        `Failed to create direct sell order: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Admin functions
  const verifyPaymentOnChain = async (orderId: number) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    writeContract({
      address:
        CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: "verifyPayment",
      args: [BigInt(orderId)],
    });
  };

  const completeBuyOrderOnChain = async (orderId: number) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    console.log("🔗 Completing buy order on chain for order ID:", orderId);

    if (!orderId || isNaN(orderId) || orderId <= 0) {
      throw new Error(
        `Invalid order ID: ${orderId}. Must be a positive integer.`
      );
    }

    try {
      // First, get the order details to know how much USDT we need
      const orderDetails = await readContract(config as any, {
        address:
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: "getOrder",
        args: [BigInt(orderId)],
      });

      const usdtAmountNeeded = orderDetails.usdtAmount;
      const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
      console.log(
        "📊 Order requires USDT amount:",
        formatUnits(usdtAmountNeeded, actualDecimals)
      );

      // Check admin's USDT balance
      const adminBalance = await readContract(config as any, {
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      console.log(
        "💰 Admin USDT balance:",
        formatUnits(adminBalance, actualDecimals)
      );

      if (adminBalance < usdtAmountNeeded) {
        throw new Error(
          `Insufficient USDT balance. Required: ${formatUnits(
            usdtAmountNeeded,
            actualDecimals
          )}, Available: ${formatUnits(adminBalance, actualDecimals)}`
        );
      }

      // Check current allowance
      const currentAllowance = await readContract(config as any, {
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: "allowance",
        args: [
          address,
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        ],
      });

      console.log(
        "🔍 Current allowance:",
        formatUnits(currentAllowance, actualDecimals)
      );

      // If allowance is insufficient, approve first
      if (currentAllowance < usdtAmountNeeded) {
        console.log("🔓 Approving USDT for P2P contract...");

        // Approve double the amount for future transactions
        const approveAmount = usdtAmountNeeded * BigInt(2);

        writeContract({
          address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
          abi: USDT_ABI,
          functionName: "approve",
          args: [
            CONTRACTS.P2P_TRADING[
              chainId as keyof typeof CONTRACTS.P2P_TRADING
            ],
            approveAmount,
          ],
        });

        console.log("⏳ Waiting for approval transaction...");
        // Wait for approval to complete before proceeding
        throw new Error("USDT_APPROVAL_NEEDED");
      }

      // Now complete the buy order
      console.log("📝 Completing buy order on contract...");

      writeContract({
        address:
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: "completeBuyOrder",
        args: [BigInt(orderId)],
      });

      console.log("✅ Buy order completion transaction sent");
    } catch (error) {
      console.error("❌ Error in completeBuyOrderOnChain:", error);
      if (error instanceof Error && error.message === "USDT_APPROVAL_NEEDED") {
        throw error; // Re-throw approval needed error
      }
      throw new Error(
        `Failed to complete buy order: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };
  ``;
  const completeSellOrderOnChain = async (orderId: number) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    writeContract({
      address:
        CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: "completeSellOrder",
      args: [BigInt(orderId)],
    });
  };

  const confirmOrderReceivedOnChain = async (orderId: number) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    writeContract({
      address:
        CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
      abi: P2P_TRADING_ABI,
      functionName: "confirmOrderReceived",
      args: [BigInt(orderId)],
    });
  };

  // Add this function to the P2P Trading functions section:
  const approveOrderOnChain = async (orderId: number) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    console.log("🔗 Approving order on chain for order ID:", orderId);

    if (!orderId || isNaN(orderId) || orderId <= 0) {
      throw new Error(
        `Invalid order ID: ${orderId}. Must be a positive integer.`
      );
    }

    try {
      writeContract({
        address:
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: "approveOrder",
        args: [BigInt(orderId)],
      });
    } catch (error) {
      console.error("❌ Error in approveOrderOnChain:", error);
      throw new Error(
        `Failed to approve order: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // USDT functions
  const transferUSDT = async (
    to: Address,
    amount: string,
    useGasStation = true
  ) => {
    if (!address) throw new Error("Wallet not connected");
    if (chainId !== bsc.id) throw new Error("Please switch to BSC Mainnet");

    console.log("💸 Starting USDT transfer on BSC Mainnet:", {
      from: address,
      to,
      amount,
      chainId: bsc.id,
      useGasStation,
    });

    try {
      if (useGasStation && GAS_STATION_ENABLED) {
        console.log("🚀 Using Gas Station for USDT transfer on BSC Mainnet...");

        const response = await fetch("/api/gas-station/admin-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminAddress: address,
            userAddress: to,
            usdtAmount: amount, // 🔥 This should be the correct amount from admin_center
            chainId: 56,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Gas Station transfer failed");
        }

        console.log(
          "✅ Gas Station transfer successful (BSC Mainnet):",
          result.txHash
        );
        return result.txHash;
      } else {
        // Fallback to direct transfer on mainnet
        console.log("⚡ Using direct USDT transfer on BSC Mainnet...");

        // 🔥 FIX: Use 18 decimals for BSC USDT
        const actualDecimals = 18; // BSC USDT uses 18 decimals
        const amountWei = parseUnits(amount, actualDecimals);
        const usdtContract = CONTRACTS.USDT[56];

        // Pre-flight checks
        const adminBalance = await readContract(config as any, {
          address: usdtContract,
          abi: USDT_ABI,
          functionName: "balanceOf",
          args: [address],
        });

        if (adminBalance < amountWei) {
          throw new Error(
            `Insufficient USDT balance. Required: ${amount}, Available: ${formatUnits(
              adminBalance,
              actualDecimals
            )}`
          );
        }

        // Execute direct transfer
        writeContract({
          address: usdtContract,
          abi: USDT_ABI,
          functionName: "transfer",
          args: [to, amountWei],
        });

        console.log(
          "✅ Direct USDT transfer transaction submitted (BSC Mainnet)"
        );
      }
    } catch (error) {
      console.error("❌ USDT transfer error:", error);
      throw new Error(
        `USDT transfer failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Enhanced sell order with Gas Station
  const createSellOrder = async (
    usdtAmount: string,
    inrAmount: number,
    orderType: string,
    useGasStation = true
  ) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    console.log("🔗 Creating sell order:", {
      usdtAmount,
      inrAmount,
      orderType,
      useGasStation,
    });

    try {
      if (useGasStation && GAS_STATION_ENABLED) {
        // Use Gas Station API
        const response = await fetch("/api/gas-station/create-sell-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: address,
            usdtAmount,
            inrAmount,
            orderType,
            chainId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Gas Station sell order creation failed"
          );
        }

        console.log("✅ Sell order created via Gas Station:", result.txHash);
        return result.txHash;
      } else {
        // Fallback to direct contract interaction
        const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
        const usdtAmountWei = parseUnits(usdtAmount, actualDecimals);
        const contractAddress =
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING];

        if (
          !contractAddress ||
          contractAddress === "0x0000000000000000000000000000000000000000"
        ) {
          throw new Error(
            `P2P Trading contract not deployed on chain ${chainId}`
          );
        }

        writeContract({
          address: contractAddress,
          abi: P2P_TRADING_ABI,
          functionName: "directSellTransfer",
          args: [usdtAmountWei, BigInt(inrAmount * 100), orderType, address],
        });

        console.log("✅ Direct sell order created");
      }
    } catch (error) {
      console.error("❌ Sell order creation error:", error);
      throw error;
    }
  };

  // Enhanced buy order with Gas Station
  const createBuyOrder = async (
    usdtAmount: string,
    inrAmount: number,
    orderType: string,
    useGasStation = true
  ) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    console.log("🔗 Creating buy order:", {
      usdtAmount,
      inrAmount,
      orderType,
      useGasStation,
    });

    try {
      if (useGasStation && GAS_STATION_ENABLED) {
        // Use Gas Station API
        const response = await fetch("/api/gas-station/create-buy-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: address,
            usdtAmount,
            inrAmount,
            orderType,
            chainId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Gas Station buy order creation failed"
          );
        }

        console.log("✅ Buy order created via Gas Station:", result.txHash);
        return result.txHash;
      } else {
        // Fallback to direct contract interaction (existing logic)
        const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
        const usdtAmountWei = parseUnits(usdtAmount, actualDecimals);
        const contractAddress =
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING];

        writeContract({
          address: contractAddress,
          abi: P2P_TRADING_ABI,
          functionName: "createBuyOrder",
          args: [usdtAmountWei, BigInt(inrAmount * 100), orderType],
        });

        console.log("✅ Direct buy order created");
      }
    } catch (error) {
      console.error("❌ Buy order creation error:", error);
      throw error;
    }
  };

  // Auto-fetch wallet data when connected and on supported BSC networks
  useEffect(() => {
    if (isConnected && address && chainId === bsc.id) {
      fetchWalletData();
    } else if (isConnected && address && chainId !== bsc.id) {
      console.log("⚠️ Not on BSC Mainnet, showing warning state");
      setWalletData({
        address,
        chainId,
        balances: {
          bnb: { raw: "0", formatted: "0", symbol: "BNB" },
          usdt: { raw: "0", formatted: "0", symbol: "USDT" },
        },
        canTrade: false,
        lastUpdated: new Date().toISOString(),
        needsMainnet: true,
      });
    }
  }, [isConnected, address, chainId, bnbBalance, usdtBalance]);

  const refetchBalances = async () => {
    if (chainId === bsc.id) {
      await Promise.all([refetchBnb(), refetchUsdt()]);
      await fetchWalletData();
    }
  };

  // Replace the existing createSellOrderOnChain function with this:
  const createSellOrderOnChain = async (
    usdtAmount: string,
    inrAmount: string,
    orderType: string
  ) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    console.log("🔗 Creating sell order with direct transfer:", {
      usdtAmount,
      inrAmount,
      orderType,
      userAddress: address,
      contractAddress:
        CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
    });

    if (!usdtAmount || !inrAmount) {
      throw new Error("Invalid amounts provided");
    }

    try {
      const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
      const usdtAmountWei = parseUnits(usdtAmount, actualDecimals);

      console.log("💰 Amounts for sell order:", {
        usdtAmount,
        inrAmount,
        usdtAmountWei: usdtAmountWei.toString(),
        actualDecimals,
        userAddress: address,
      });

      let adminWallet: string;
      try {
        adminWallet = (await readContract(config as any, {
          address:
            CONTRACTS.P2P_TRADING[
              chainId as keyof typeof CONTRACTS.P2P_TRADING
            ],
          abi: P2P_TRADING_ABI,
          functionName: "getAdminWallet",
        })) as string;
        console.log("🔍 Admin wallet from getAdminWallet():", adminWallet);
      } catch (error) {
        console.warn(
          "⚠️ getAdminWallet() failed, trying admin() function:",
          error
        );
        try {
          adminWallet = (await readContract(config as any, {
            address:
              CONTRACTS.P2P_TRADING[
                chainId as keyof typeof CONTRACTS.P2P_TRADING
              ],
            abi: P2P_TRADING_ABI,
            functionName: "admin",
          })) as string;
          console.log("🔍 Admin wallet from admin():", adminWallet);
        } catch (adminError) {
          console.error(
            "❌ Both getAdminWallet() and admin() failed:",
            adminError
          );

          adminWallet = "0x0000000000000000000000000000000000000000";
          if (adminWallet === "0x0000000000000000000000000000000000000000") {
            throw new Error(
              "Cannot determine admin wallet address. Please contact support."
            );
          }
        }
      }

      // Check user's USDT balance
      const userBalance = await readContract(config as any, {
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      console.log(
        "💰 User USDT balance:",
        formatUnits(userBalance, actualDecimals)
      );

      if (userBalance < usdtAmountWei) {
        throw new Error(
          `Insufficient USDT balance. Required: ${usdtAmount} USDT, Available: ${formatUnits(
            userBalance,
            actualDecimals
          )} USDT`
        );
      }

      // Check allowance for P2P contract
      const currentAllowance = await readContract(config as any, {
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: "allowance",
        args: [
          address,
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        ],
      });

      console.log(
        "🔍 Current allowance for P2P contract:",
        formatUnits(currentAllowance, actualDecimals)
      );

      if (currentAllowance < usdtAmountWei) {
        console.log("🔓 Need approval for P2P contract...");
        const approveAmount = usdtAmountWei * BigInt(2); // Approve 2x for future transactions

        console.log(
          "📝 Approving USDT for P2P contract...",
          formatUnits(approveAmount, actualDecimals)
        );

        writeContract({
          address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
          abi: USDT_ABI,
          functionName: "approve",
          args: [
            CONTRACTS.P2P_TRADING[
              chainId as keyof typeof CONTRACTS.P2P_TRADING
            ],
            approveAmount,
          ],
        });

        // Return a special status to indicate approval is needed
        throw new Error("USDT_APPROVAL_NEEDED");
      }

      // Execute direct sell transfer to admin
      console.log("📝 Executing direct sell transfer to admin...");
      writeContract({
        address:
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: "directSellTransfer",
        args: [
          usdtAmountWei,
          parseUnits(inrAmount, 2),
          orderType,
          adminWallet as `0x${string}`,
        ],
      });

      console.log("✅ Direct sell transfer executed successfully");
    } catch (error) {
      console.error("❌ Error in createSellOrderOnChain:", error);
      if (error instanceof Error && error.message === "USDT_APPROVAL_NEEDED") {
        throw error; // Re-throw the approval needed error
      }
      throw new Error(
        `Failed to create sell order: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Add admin function to execute the transfer
  const adminExecuteSellTransfer = async (
    userAddress: string,
    usdtAmount: string,
    inrAmount: string,
    orderType: string
  ) => {
    if (!address) throw new Error("Admin wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    console.log("🔗 Admin executing sell transfer:", {
      userAddress,
      usdtAmount,
      inrAmount,
      orderType,
      adminAddress: address,
    });

    try {
      const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
      const usdtAmountWei = parseUnits(usdtAmount, actualDecimals);
      const inrAmountWei = parseUnits(inrAmount, 2);

      // Execute admin-paid transfer
      console.log("📝 Executing admin-paid sell transfer...");
      writeContract({
        address:
          CONTRACTS.P2P_TRADING[chainId as keyof typeof CONTRACTS.P2P_TRADING],
        abi: P2P_TRADING_ABI,
        functionName: "adminExecuteSellTransfer",
        args: [
          userAddress as `0x${string}`,
          usdtAmountWei,
          inrAmountWei,
          orderType,
        ],
      });
    } catch (error) {
      console.error("❌ Error in adminExecuteSellTransfer:", error);
      throw new Error(
        `Failed to execute admin sell transfer: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const approveUSDT = async (spender: Address, amount: string) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    console.log("🔓 Approving USDT:", {
      spender,
      amount,
      from: address,
      chainId,
    });

    try {
      const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
      const amountWei = parseUnits(amount, actualDecimals);

      writeContract({
        address: CONTRACTS.USDT[chainId as keyof typeof CONTRACTS.USDT],
        abi: USDT_ABI,
        functionName: "approve",
        args: [spender, amountWei],
      });

      console.log("✅ USDT approval transaction submitted");
    } catch (error) {
      console.error("❌ USDT approval error:", error);
      throw new Error(
        `USDT approval failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Add this function to handle Gas Station approvals:

  const approveGasStationForSell = async (
    usdtAmount: string
  ): Promise<boolean> => {
    if (!address || chainId !== 56) return false;

    try {
      const GAS_STATION_ADDRESS = "0x1dA2b030808D46678284dB112bfe066AA9A8be0E";
      const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 18;
      const usdtAmountWei = parseUnits(usdtAmount, actualDecimals);

      // Check current allowance for Gas Station
      const currentAllowance = await readContract(config as any, {
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: "allowance",
        args: [address, GAS_STATION_ADDRESS],
      });

      console.log("🔍 Gas Station allowance check:", {
        required: formatUnits(usdtAmountWei, actualDecimals),
        current: formatUnits(currentAllowance, actualDecimals),
        sufficient: currentAllowance >= usdtAmountWei,
      });

      if (currentAllowance >= usdtAmountWei) {
        return true; // Already approved
      }

      // Need approval - approve 10x for future transactions
      const approveAmount = usdtAmountWei * BigInt(10);

      console.log("🔓 Approving Gas Station for USDT:", {
        spender: GAS_STATION_ADDRESS,
        amount: formatUnits(approveAmount, actualDecimals),
      });

      await approveUSDT(
        GAS_STATION_ADDRESS as `0x${string}`,
        formatUnits(approveAmount, actualDecimals)
      );

      // Wait for approval transaction
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Verify approval
      const newAllowance = await readContract(config as any, {
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: "allowance",
        args: [address, GAS_STATION_ADDRESS],
      });

      const isApproved = newAllowance >= usdtAmountWei;
      console.log("✅ Gas Station approval result:", {
        approved: isApproved,
        newAllowance: formatUnits(newAllowance, actualDecimals),
      });

      return isApproved;
    } catch (error) {
      console.error("❌ Gas Station approval failed:", error);
      return false;
    }
  };

  const createGaslessSellOrder = async (
    usdtAmount: string,
    inrAmount: string,
    orderType: string
  ): Promise<string> => {
    if (!address) throw new Error("Wallet not connected");
    if (chainId !== 56) throw new Error("Please switch to BSC Mainnet");

    try {
      console.log("🚀 Creating completely gasless sell order:", {
        usdtAmount,
        inrAmount,
        orderType,
        userAddress: address,
      });

      // Get admin wallet (with fallback)
      let adminWallet = "0x1dA2b030808D46678284dB112bfe066AA9A8be0E"; // Gas station address as fallback

      try {
        adminWallet = (await readContract(config as any, {
          address: CONTRACTS.P2P_TRADING[56],
          abi: [
            {
              inputs: [],
              name: "getAdminWallet",
              outputs: [{ internalType: "address", name: "", type: "address" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "getAdminWallet",
        })) as string;

        console.log("✅ Got admin wallet from contract:", adminWallet);
      } catch (error) {
        console.warn(
          "⚠️ Could not get admin wallet from contract, using fallback:",
          adminWallet
        );
      }

      console.log("🚀 Calling Gas Station for complete gasless sell order...");

      // Call the complete gasless API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        const gasStationResponse = await fetch(
          "/api/gas-station/complete-gasless-sell",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userAddress: address,
              adminAddress: adminWallet,
              usdtAmount,
              inrAmount: parseFloat(inrAmount),
              orderType,
              chainId: 56,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
        const result = await gasStationResponse.json();

        if (!gasStationResponse.ok) {
          console.error("❌ Gas Station API error:", result);

          if (result.code === "USER_NEEDS_APPROVAL") {
            // User needs to approve Gas Station first
            throw new Error("APPROVAL_REQUIRED");
          } else if (result.code === "INSUFFICIENT_BALANCE") {
            throw new Error("Insufficient USDT balance for this transaction.");
          } else if (result.code === "GAS_STATION_NOT_READY") {
            throw new Error(
              "Gas Station is temporarily unavailable. Please try again in a few minutes."
            );
          } else {
            throw new Error(
              result.error || "Gasless transaction failed. Please try again."
            );
          }
        }

        console.log(
          "✅ Completely gasless sell order created successfully:",
          result.txHash
        );
        console.log(
          "💰 Gas Station paid ALL transaction fees - user paid ZERO gas!"
        );

        return result.txHash;
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error("Transaction timed out. Please try again.");
        }

        throw fetchError;
      }
    } catch (error) {
      console.error("❌ Completely gasless sell order creation failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("APPROVAL_REQUIRED")) {
        throw new Error("APPROVAL_REQUIRED"); // Special error code for frontend
      } else if (errorMessage.includes("Insufficient USDT balance")) {
        throw new Error("Insufficient USDT balance for this transaction.");
      } else if (
        errorMessage.includes("Gas Station is temporarily unavailable")
      ) {
        throw new Error(
          "Gas Station is temporarily unavailable. Please try again later."
        );
      } else if (errorMessage.includes("timeout")) {
        throw new Error("Request timed out. Please try again.");
      } else {
        throw new Error(errorMessage);
      }
    }
  };

  // 🔥 NEW: Gas Station funds user's approval transaction
  const requestGasForApproval = async (): Promise<string> => {
    if (!address || chainId !== 56)
      throw new Error("Please connect to BSC Mainnet");

    try {
      console.log("💰 Requesting gas funding from Gas Station for approval...");

      const response = await fetch("/api/gas-station/fund-user-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          chainId: 56,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gas funding failed");
      }

      console.log("✅ Gas Station funded approval transaction:", result.txHash);
      console.log("💡 Now you can approve Gas Station for USDT spending!");

      return result.txHash;
    } catch (error) {
      console.error("❌ Gas funding request failed:", error);
      throw new Error(
        "Failed to get gas funding from Gas Station. Please try again."
      );
    }
  };

  // 🔥 NEW: Handle approval after gas funding
  const approveGasStationAfterFunding = async (): Promise<boolean> => {
    if (!address || chainId !== 56) return false;

    try {
      const gasStationAddress =
        "0x1dA2b030808D46678284dB112bfe066AA9A8be0E" as Address;
      const maxApprovalAmount = parseUnits("1000000000", 18); // 1B USDT

      console.log(
        "🔓 Approving Gas Station for gasless sells (funded by Gas Station)..."
      );

      // User pays gas for this approval (but gas was funded by Gas Station)
      writeContract({
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: "approve",
        args: [gasStationAddress, maxApprovalAmount],
      });

      console.log(
        "✅ Gas Station approval transaction initiated (funded by Gas Station)"
      );
      console.log(
        "💡 After this approval, all future sell orders will be completely gasless!"
      );

      return true;
    } catch (error) {
      console.error("❌ Gas Station approval failed:", error);
      throw new Error("Failed to approve Gas Station. Please try again.");
    }
  };

  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    walletData,
    isLoading: isLoading || isPending || isConfirming,
    fetchWalletData,
    refetchBalances,
    switchChain,
    isOnBSC,
    switchToBSC,
    canTrade: walletData?.canTrade || false,

    createBuyOrderOnChain,
    createDirectSellOrderOnChain,
    createSellOrderOnChain,
    verifyPaymentOnChain,
    completeBuyOrderOnChain,
    completeSellOrderOnChain,
    confirmOrderReceivedOnChain,
    approveOrderOnChain,
    adminExecuteSellTransfer,

    transferUSDT,
    approveUSDT,
    approveGasStationForSell,

    createSellOrder,
    createBuyOrder,
    createGaslessSellOrder,
    requestGasForApproval,
    approveGasStationAfterFunding,
    gasStationEnabled: GAS_STATION_ENABLED,

    hash,
    isPending,
    isConfirming,
  };
}
