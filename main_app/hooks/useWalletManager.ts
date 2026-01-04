import { useState, useEffect } from "react";
import {
  useAccount,
  useSwitchChain,
  usePublicClient,
  useWallets,
} from "@particle-network/connectkit";
import { parseUnits, formatUnits, Address } from "viem";
import type { Chain as ViemChain } from "viem";
import { bsc } from "@particle-network/connectkit/chains";
import { PublicClient } from "viem";

// Add Gas Station import
const GAS_STATION_ENABLED =
  process.env.NEXT_PUBLIC_GAS_STATION_ENABLED === "true";

// Contract addresses - MAINNET ONLY
const CONTRACTS = {
  USDT: {
    [56]: "0x55d398326f99059fF775485246999027B3197955" as Address, // BSC Mainnet only
  },
  P2P_TRADING: {
    [56]: "0xbfb247eA56F806607f2346D9475F669F30EAf2fB" as Address, // BSC Mainnet only
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
  const { address, isConnected, chainId, chain, status } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient() as PublicClient;
  const [primaryWallet] = useWallets();
  const isConnecting = status === "connecting" || status === "reconnecting";
  const [walletData, setWalletData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bnbBalance, setBnbBalance] = useState<bigint | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<bigint | null>(null);
  const [usdtDecimals, setUsdtDecimals] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Fetch BNB balance
  const refetchBnb = async () => {
    if (!address || !publicClient || !('getBalance' in publicClient)) return;
    try {
      const balance = await (publicClient as any).getBalance({ address: address as Address });
      setBnbBalance(balance);
    } catch (error) {
      console.error("Failed to fetch BNB balance:", error);
    }
  };

  // Fetch USDT balance and decimals
  const refetchUsdt = async () => {
    if (!address || !publicClient || chainId !== bsc.id || !('readContract' in publicClient)) return;
    try {
      const balance = await (publicClient as any).readContract({
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      setUsdtBalance(balance as bigint);

      const decimals = await (publicClient as any).readContract({
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: "decimals",
      });
      setUsdtDecimals(Number(decimals));
    } catch (error) {
      console.error("Failed to fetch USDT balance:", error);
    }
  };

  // Fetch balances when address or chainId changes
  useEffect(() => {
    if (address && chainId === bsc.id && publicClient) {
      refetchBnb();
      refetchUsdt();
    }
  }, [address, chainId, publicClient]);

  // Add debugging for USDT balance
  useEffect(() => {
    if (usdtBalance && address) {
      console.log("🔍 USDT Balance Debug:", {
        address,
        chainId,
        contractAddress: CONTRACTS.USDT[56],
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

  // Force BSC mainnet only
  const isOnBSC = chainId === bsc.id;

  // Helper function to read contracts
  const readContractHelper = async (params: {
    address: Address;
    abi: any;
    functionName: string;
    args?: any[];
  }) => {
    if (!publicClient) {
      throw new Error("Public client not available");
    }
    // Type assertion for EVM chains - Particle Network's usePublicClient returns viem PublicClient for EVM
    const evmClient = publicClient as any;
    if (!evmClient.readContract) {
      throw new Error("Public client does not support readContract (might be Solana Connection)");
    }
    return await evmClient.readContract(params);
  };

  // Helper function to write contracts
  const writeContractHelper = async (params: {
    address: Address;
    abi: any;
    functionName: string;
    args: any[];
  }) => {
    if (!primaryWallet || !address) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not available");
    
    setIsPending(true);
    try {
      const walletClient = primaryWallet.getWalletClient();
      const hash = await walletClient.writeContract({
        ...params,
        account: address as Address,
        chain: chain || bsc,
      });
      setTxHash(hash);
      setIsConfirming(true);
      
      // Wait for transaction receipt
      if (publicClient && 'waitForTransactionReceipt' in publicClient) {
        await (publicClient as any).waitForTransactionReceipt({ hash });
      }
      setIsConfirming(false);
      setIsPending(false);
      return hash;
    } catch (error) {
      setIsPending(false);
      setIsConfirming(false);
      throw error;
    }
  };

  const switchToBSC = async (): Promise<boolean> => {
    try {
      if (chainId !== bsc.id) {
        console.log("🔄 Switching to BSC Mainnet...");
        await switchChainAsync({ chainId: bsc.id });
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
        await switchChainAsync({ chainId: bsc.id });
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
            raw: bnbBalance || BigInt(0),
            formatted: bnbBalance ? formatUnits(bnbBalance, 18) : "0",
            symbol: "BNB",
          },
          usdt: {
            raw: usdtBalance || BigInt(0),
            formatted: formattedUsdtBalance,
            symbol: "USDT",
          },
        },
        canTrade: (bnbBalance || BigInt(0)) > parseUnits("0.001", 18),
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
    if (!address || !primaryWallet) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    const actualDecimals = usdtDecimals ? Number(usdtDecimals) : 6;
    const usdtAmountWei = parseUnits(usdtAmount, actualDecimals);
    const inrAmountWei = parseUnits(inrAmount, 2);

    setIsPending(true);
    try {
      const walletClient = primaryWallet.getWalletClient();
      const hash = await walletClient.writeContract({
        address: CONTRACTS.P2P_TRADING[56],
        abi: P2P_TRADING_ABI,
        functionName: "createBuyOrder",
        args: [usdtAmountWei, inrAmountWei, orderType],
        account: address as Address,
        chain: chain || bsc,
      });
      setTxHash(hash);
      setIsConfirming(true);
      
      // Wait for transaction receipt
      if (publicClient && 'waitForTransactionReceipt' in publicClient) {
        await (publicClient as any).waitForTransactionReceipt({ hash });
        setIsConfirming(false);
        setIsPending(false);
      }
    } catch (error) {
      setIsPending(false);
      setIsConfirming(false);
      throw error;
    }
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
        CONTRACTS.P2P_TRADING[56],
      usdtContract: CONTRACTS.USDT[56],
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
      const adminWallet = await readContractHelper({
        address: CONTRACTS.P2P_TRADING[56],
        abi: P2P_TRADING_ABI,
        functionName: "getAdminWallet",
      });

      console.log("🔍 Admin wallet address:", adminWallet);

      // Check user's USDT balance
      const userBalance = await readContractHelper({
        address: CONTRACTS.USDT[56],
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
      const currentAllowance = await readContractHelper({
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: "allowance",
        args: [
          address,
          CONTRACTS.P2P_TRADING[56],
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

        await writeContractHelper({
          address: CONTRACTS.USDT[56],
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
      await writeContractHelper({
        address: CONTRACTS.P2P_TRADING[56],
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

    await writeContractHelper({
      address: CONTRACTS.P2P_TRADING[56],
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
      const orderDetails = await readContractHelper({
        address:
          CONTRACTS.P2P_TRADING[56],
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
      const adminBalance = await readContractHelper({
        address: CONTRACTS.USDT[56],
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
      const currentAllowance = await readContractHelper({
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: "allowance",
        args: [
          address,
          CONTRACTS.P2P_TRADING[56],
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

        await writeContractHelper({
          address: CONTRACTS.USDT[56],
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

      await writeContractHelper({
        address:
          CONTRACTS.P2P_TRADING[56],
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

  const completeSellOrderOnChain = async (orderId: number) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    await writeContractHelper({
      address:
        CONTRACTS.P2P_TRADING[56],
      abi: P2P_TRADING_ABI,
      functionName: "completeSellOrder",
      args: [BigInt(orderId)],
    });
  };

  const confirmOrderReceivedOnChain = async (orderId: number) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isOnBSC) throw new Error("Please switch to a supported BSC network");

    await writeContractHelper({
      address:
        CONTRACTS.P2P_TRADING[56],
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
      await writeContractHelper({
        address:
          CONTRACTS.P2P_TRADING[56],
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
        const adminBalance = await readContractHelper({
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
        await writeContractHelper({
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
          CONTRACTS.P2P_TRADING[56];

        if (
          !contractAddress ||
          contractAddress === "0x0000000000000000000000000000000000000000"
        ) {
          throw new Error(
            `P2P Trading contract not deployed on chain ${chainId}`
          );
        }

        await writeContractHelper({
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
          CONTRACTS.P2P_TRADING[56];

        await writeContractHelper({
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
        CONTRACTS.P2P_TRADING[56],
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
        adminWallet = (await readContractHelper({
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
          adminWallet = (await readContractHelper({
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
      const userBalance = await readContractHelper({
        address: CONTRACTS.USDT[56],
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
      const currentAllowance = await readContractHelper({
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: "allowance",
        args: [
          address,
          CONTRACTS.P2P_TRADING[56],
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

        await writeContractHelper({
          address: CONTRACTS.USDT[56],
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
      await writeContractHelper({
        address:
          CONTRACTS.P2P_TRADING[56],
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
      await writeContractHelper({
        address:
          CONTRACTS.P2P_TRADING[56],
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

      await writeContractHelper({
        address: CONTRACTS.USDT[56],
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
      const currentAllowance = await readContractHelper({
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
      const newAllowance = await readContractHelper({
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
    if (!address) throw new Error('Wallet not connected');
    if (chainId !== 56) throw new Error('Please switch to BSC Mainnet');

    try {
      console.log('🚀 Creating completely gasless sell order (Gas Station handles ALL fees including approval):', {
        usdtAmount,
        inrAmount,
        orderType,
        userAddress: address
      });

      // Pre-flight balance check
      const balanceCheck = await verifyUSDTBalance(usdtAmount);
      if (!balanceCheck.hasBalance) {
        console.error('❌ Pre-flight balance check failed:', balanceCheck.error);
        throw new Error(balanceCheck.error || 'Insufficient USDT balance');
      }

      console.log('✅ Pre-flight balance check passed:', {
        required: usdtAmount,
        available: balanceCheck.currentBalance
      });

      // Get admin wallet
      let adminWallet = "0x1dA2b030808D46678284dB112bfe066AA9A8be0E"; 
      try {
        adminWallet = await readContractHelper({
          address: CONTRACTS.P2P_TRADING[56],
          abi: [{
            inputs: [],
            name: "getAdminWallet",
            outputs: [{ internalType: "address", name: "", type: "address" }],
            stateMutability: "view",
            type: "function",
          }],
          functionName: "getAdminWallet",
        }) as string;
        console.log('✅ Got admin wallet from contract:', adminWallet);
      } catch (error) {
        console.warn('⚠️ Using fallback admin wallet:', adminWallet);
      }

      console.log('🚀 Calling Gas Station for COMPLETELY gasless sell order...');

      // Call the complete gasless API with timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let gasStationResponse: Response;
      let result: any;

      try {
        gasStationResponse = await fetch('/api/gas-station/complete-gasless-sell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: address,
            adminAddress: adminWallet,
            usdtAmount,
            inrAmount: parseFloat(inrAmount),
            orderType,
            chainId: 56
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📡 Gas Station API response:', {
          ok: gasStationResponse.ok,
          status: gasStationResponse.status,
          statusText: gasStationResponse.statusText
        });

        // Parse response
        try {
          result = await gasStationResponse.json();
          console.log('📋 Gas Station API result (detailed):', {
            result,
            hasSuccess: 'success' in result,
            hasTxHash: 'txHash' in result,
            hasCode: 'code' in result,
            hasNeedsApproval: 'needsApproval' in result,
            hasMethod: 'method' in result,
            successValue: result.success,
            txHashValue: result.txHash,
            codeValue: result.code,
            needsApprovalValue: result.needsApproval,
            methodValue: result.method,
            allKeys: Object.keys(result || {})
          });
        } catch (parseError) {
          console.error('❌ Failed to parse Gas Station response:', parseError);
          throw new Error('Invalid response from Gas Station API');
        }

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Transaction timed out. Please try again.');
        }
        
        console.error('❌ Gas Station API fetch error:', fetchError);
        throw new Error('Failed to communicate with Gas Station API');
      }

      // 🔥 FIX: Enhanced result validation with comprehensive logging
      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid result structure from Gas Station:', {
          result,
          type: typeof result,
          isNull: result === null,
          isUndefined: result === undefined
        });
        throw new Error('Invalid response from Gas Station service - no data received');
      }

      // 🔥 FIX: Handle HTTP error responses first (status >= 400)
      if (!gasStationResponse.ok) {
        console.error('❌ Gas Station API HTTP error:', {
          status: gasStationResponse.status,
          statusText: gasStationResponse.statusText,
          result
        });
        
        const errorCode = result.code || 'UNKNOWN_ERROR';
        const errorMessage = result.error || `Gas Station API error: ${gasStationResponse.status}`;
        
        // Handle specific error codes from HTTP error responses
        if (errorCode === 'USER_FUNDED_FOR_APPROVAL') {
          console.log('💰 Gas Station funded user wallet for approval (via HTTP error)');
          throw new Error('GAS_STATION_FUNDED_APPROVAL');
        } else if (errorCode === 'USER_HAS_BNB_NEEDS_APPROVAL') {
          console.log('✅ User already has sufficient BNB, needs approval only (via HTTP error)');
          throw new Error('USER_HAS_BNB_NEEDS_APPROVAL');
        } else if (errorCode === 'APPROVAL_REQUIRED') {
          throw new Error('MANUAL_APPROVAL_REQUIRED');
        } else if (errorCode === 'INSUFFICIENT_BALANCE') {
          throw new Error('Insufficient USDT balance for this transaction.');
        } else if (errorCode === 'GAS_STATION_NOT_READY') {
          throw new Error('Gas Station is temporarily unavailable. Please try again in a few minutes.');
        } else if (errorCode === 'GAS_STATION_LOW_BALANCE' || errorCode === 'GAS_STATION_INSUFFICIENT_FUNDS' || errorCode === 'GAS_STATION_CANNOT_FUND_USER') {
          throw new Error('Gas Station is temporarily unavailable due to low funds. Please try again later.');
        } else if (errorCode === 'NETWORK_TIMEOUT') {
          throw new Error('Network timeout. Please try again.');
        } else {
          throw new Error(errorMessage);
        }
      }

      // 🔥 FIX: Handle successful HTTP responses (status 200-299)
      console.log('✅ HTTP response successful, analyzing result structure...');

      // Check for explicit success responses
      if (result.success === true) {
        console.log('🎉 Explicit success response detected');
        
        // For successful responses, txHash must be present and valid
        if (!result.txHash) {
          console.error('❌ Successful response missing txHash:', result);
          throw new Error('Transaction completed but no transaction hash received');
        }
        
        if (typeof result.txHash !== 'string') {
          console.error('❌ Invalid txHash type:', typeof result.txHash, result.txHash);
          throw new Error('Invalid transaction hash format received');
        }
        
        if (result.txHash.length === 0) {
          console.error('❌ Empty txHash received:', result);
          throw new Error('Empty transaction hash received');
        }
        
        console.log('✅ USDT transfer completed successfully via Gas Station:', result.txHash);
        console.log('💰 User USDT transferred to admin account - Gas Station paid all fees!');
        
        return result.txHash;
      }

      // 🔥 FIX: Handle approval flow responses (success: false but valid state)
      if (result.success === false && result.needsApproval === true) {
        console.log('💡 Approval flow response detected:', {
          code: result.code,
          txHash: result.txHash,
          fundingTxHash: result.fundingTxHash,
          userHasBnb: result.userHasBnb
        });
        
        if (result.code === 'USER_FUNDED_FOR_APPROVAL') {
          console.log('💰 Gas Station funded user wallet for approval');
          throw new Error('GAS_STATION_FUNDED_APPROVAL');
        } else if (result.code === 'USER_HAS_BNB_NEEDS_APPROVAL') {
          console.log('✅ User already has sufficient BNB, needs approval only');
          throw new Error('USER_HAS_BNB_NEEDS_APPROVAL');
        } else if (result.code === 'APPROVAL_REQUIRED') {
          throw new Error('MANUAL_APPROVAL_REQUIRED');
        } else {
          // Generic approval required
          console.log('💡 Generic approval required response');
          throw new Error('USER_APPROVAL_REQUIRED');
        }
      }

      // 🔥 FIX: Handle other response patterns
      if (result.success === false && !result.needsApproval) {
        console.error('❌ Explicit failure response:', {
          success: result.success,
          error: result.error,
          code: result.code,
          message: result.message
        });
        
        const errorMessage = result.error || result.message || 'Gas Station operation failed';
        throw new Error(errorMessage);
      }

      // 🔥 FIX: Handle responses without explicit success field
      if (typeof result.success === 'undefined') {
        console.log('🔍 Response without explicit success field, checking for transaction hash...');
        
        if (result.txHash && typeof result.txHash === 'string' && result.txHash.length > 0) {
          console.log('✅ Found transaction hash in response without success field:', result.txHash);
          return result.txHash;
        }
        
        if (result.method || result.code) {
          console.log('🔍 Response contains method/code but no txHash:', {
            method: result.method,
            code: result.code,
            txHash: result.txHash
          });
          
          // Handle method-based responses
          if (result.method === 'user_has_bnb_needs_approval' || result.code === 'USER_HAS_BNB_NEEDS_APPROVAL') {
            throw new Error('USER_HAS_BNB_NEEDS_APPROVAL');
          } else if (result.method === 'user_funded_for_approval' || result.code === 'USER_FUNDED_FOR_APPROVAL') {
            throw new Error('GAS_STATION_FUNDED_APPROVAL');
          } else if (result.method === 'gasless_transfer_completed') {
            if (result.txHash) {
              return result.txHash;
            } else {
              throw new Error('Transfer completed but missing transaction hash');
            }
          }
        }
      }

      // 🔥 FIX: Final fallback for unexpected response structures
      console.error('❌ Unexpected response structure from Gas Station:', {
        success: result.success,
        hasTxHash: 'txHash' in result,
        hasNeedsApproval: 'needsApproval' in result,
        hasMethod: 'method' in result,
        hasCode: 'code' in result,
        hasError: 'error' in result,
        hasMessage: 'message' in result,
        successType: typeof result.success,
        txHashType: typeof result.txHash,
        allKeys: Object.keys(result),
        result
      });

      // Try to extract meaningful error message from the response
      const meaningfulError = result.error || result.message || 'Unknown response format from Gas Station';
      throw new Error(`Unexpected response format: ${meaningfulError}`);

    } catch (error) {
      console.error('❌ Completely gasless sell order creation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Pass through the specific error messages
      if (errorMessage.includes('GAS_STATION_FUNDED_APPROVAL')) {
        throw new Error('GAS_STATION_FUNDED_APPROVAL');
      } else if (errorMessage.includes('USER_HAS_BNB_NEEDS_APPROVAL')) {
        throw new Error('USER_HAS_BNB_NEEDS_APPROVAL');
      } else if (errorMessage.includes('MANUAL_APPROVAL_REQUIRED') || errorMessage.includes('USER_APPROVAL_REQUIRED')) {
        throw new Error('MANUAL_APPROVAL_REQUIRED');
      } else if (errorMessage.includes('Insufficient USDT balance')) {
        throw new Error('Insufficient USDT balance for this transaction.');
      } else if (errorMessage.includes('Gas Station is temporarily unavailable')) {
        throw new Error('Gas Station is temporarily unavailable. Please try again later.');
      } else if (errorMessage.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      } else {
        throw new Error(errorMessage);
      }
    }
  };

  const approveGasStationAfterFunding = async (usdtAmount: string, inrAmount: string, orderType: string): Promise<boolean> => {
    if (!address || chainId !== 56) return false;

    try {
      const gasStationAddress = "0x1dA2b030808D46678284dB112bfe066AA9A8be0E" as Address;
      const maxApprovalAmount = parseUnits("1000000000", 18); 

      console.log("🔓 Step 1: User approving Gas Station for USDT spending...");
      
      // User initiates approval transaction
      await writeContractHelper({
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: "approve",
        args: [gasStationAddress, maxApprovalAmount],
      });

      console.log("✅ Gas Station approval transaction initiated by user");
      console.log("⏳ Waiting for approval transaction to be confirmed...");
      
      // Wait for approval transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds for approval
      
      console.log("🚀 Step 2: Now calling Gas Station to execute USDT transfer...");
      
      // Get admin wallet
      let adminWallet = "0x1dA2b030808D46678284dB112bfe066AA9A8be0E";
      try {
        adminWallet = await readContractHelper({
          address: CONTRACTS.P2P_TRADING[56],
          abi: [{
            inputs: [],
            name: "getAdminWallet",
            outputs: [{ internalType: "address", name: "", type: "address" }],
            stateMutability: "view",
            type: "function",
          }],
          functionName: "getAdminWallet",
        }) as string;
        console.log('✅ Retrieved admin wallet from contract:', adminWallet);
      } catch (error) {
        console.warn('⚠️ Using fallback admin wallet:', adminWallet);
      }
      
      // 🔥 FIXED: Call Gas Station again to execute the transfer now that user has approved
      console.log('💸 Calling Gas Station API to execute USDT transfer after approval...');
      
      const transferResponse = await fetch('/api/gas-station/complete-gasless-sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          adminAddress: adminWallet,
          usdtAmount,
          inrAmount: parseFloat(inrAmount),
          orderType,
          chainId: 56
        })
      });

      const transferResult = await transferResponse.json();

      console.log('📡 Gas Station transfer response:', {
        ok: transferResponse.ok,
        status: transferResponse.status,
        result: transferResult
      });

      if (!transferResponse.ok) {
        console.error('❌ Gas Station transfer failed after approval:', transferResult);
        
        // Handle specific error cases
        if (transferResult.code === 'USER_HAS_BNB_NEEDS_APPROVAL') {
          throw new Error('Please wait for the approval transaction to confirm and try again.');
        } else if (transferResult.code === 'INSUFFICIENT_ALLOWANCE') {
          throw new Error('Approval transaction not yet confirmed. Please wait a moment and try again.');
        } else {
          throw new Error(transferResult.error || 'Failed to execute USDT transfer after approval');
        }
      }

      console.log('✅ USDT transfer successful after approval!');
      console.log('💰 Transaction hash:', transferResult.txHash);
      console.log('🎉 Complete gasless sell order flow completed successfully!');
      
      return true;

    } catch (error) {
      console.error("❌ Approval and transfer flow failed:", error);
      throw new Error(`Failed to complete gasless sell order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add new function to execute transfer after approval
  const executeTransferAfterApproval = async (usdtAmount: string, inrAmount: string, orderType: string): Promise<string> => {
    if (!address || chainId !== 56) throw new Error('Wallet not connected or wrong network');

    try {
      console.log('🚀 Executing transfer after user approval...');
      
      // Get admin wallet
      let adminWallet = "0x1dA2b030808D46678284dB112bfe066AA9A8be0E";
      try {
        adminWallet = await readContractHelper({
          address: CONTRACTS.P2P_TRADING[56],
          abi: [{
            inputs: [],
            name: "getAdminWallet",
            outputs: [{ internalType: "address", name: "", type: "address" }],
            stateMutability: "view",
            type: "function",
          }],
          functionName: "getAdminWallet",
        }) as string;
      } catch (error) {
        console.warn('⚠️ Using fallback admin wallet:', adminWallet);
      }
      
      // Execute the transfer after approval
      const transferResponse = await fetch('/api/gas-station/execute-transfer-after-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          adminAddress: adminWallet,
          usdtAmount,
          chainId: 56
        })
      });

      const transferResult = await transferResponse.json();

      if (!transferResponse.ok) {
        console.error('❌ Transfer after approval failed:', transferResult);
        throw new Error(transferResult.error || 'Failed to execute transfer after approval');
      }

      console.log('✅ USDT transfer successful after approval:', transferResult.txHash);
      
      return transferResult.txHash;

    } catch (error) {
      console.error('❌ Transfer after approval failed:', error);
      throw new Error(`Transfer after approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add new function to check if user needs manual approval
  const checkIfManualApprovalNeeded = async (): Promise<{ needsApproval: boolean, canAutoApprove: boolean }> => {
    if (!address || chainId !== 56) {
      return { needsApproval: true, canAutoApprove: false };
    }

    try {
      const gasStationAddress = "0x1dA2b030808D46678284dB112bfe066AA9A8be0E" as Address;
      
      // Check current allowance
      const currentAllowance = await readContractHelper({
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: 'allowance',
        args: [address, gasStationAddress]
      });

      const minRequiredAmount = parseUnits("1", 18); // 1 USDT minimum
      const needsApproval = currentAllowance < minRequiredAmount;

      const canAutoApprove = false;

      return { needsApproval, canAutoApprove };

    } catch (error) {
      console.error('❌ Failed to check approval status:', error);
      return { needsApproval: true, canAutoApprove: false };
    }
  };



  const verifyUSDTBalance = async (requiredAmount: string): Promise<{ hasBalance: boolean; currentBalance: string; error?: string }> => {
    if (!address || chainId !== 56) {
      return { hasBalance: false, currentBalance: '0', error: 'Wallet not connected or wrong network' };
    }

    try {
      console.log('🔍 Verifying USDT balance for gasless order:', {
        userAddress: address,
        requiredAmount,
        chainId,
        contract: CONTRACTS.USDT[56]
      });

      // 🔥 FIX: Use correct decimals for BSC USDT
      // First, get the actual decimals from the contract
      let actualDecimals = 18; // Default to 18 for BSC USDT
      try {
        const decimalsResult = await readContractHelper({
          address: CONTRACTS.USDT[56],
          abi: [
            {
              inputs: [],
              name: "decimals",
              outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
              stateMutability: "view",
              type: "function",
            }
          ],
          functionName: 'decimals'
        });
        actualDecimals = Number(decimalsResult);
        console.log('📊 USDT contract decimals:', actualDecimals);
      } catch (decimalsError) {
        console.warn('⚠️ Could not read decimals from contract, using default 18:', decimalsError);
        actualDecimals = 18; // BSC USDT typically uses 18 decimals
      }

      // Read current USDT balance
      const balance = await readContractHelper({
        address: CONTRACTS.USDT[56],
        abi: USDT_ABI,
        functionName: 'balanceOf',
        args: [address]
      });

      const requiredWei = parseUnits(requiredAmount, actualDecimals);
      const currentBalance = formatUnits(balance as bigint, actualDecimals);
      const hasBalance = (balance as bigint) >= requiredWei;

      console.log('💰 USDT Balance verification result (BSC):', {
        required: requiredAmount,
        current: currentBalance,
        hasBalance,
        rawBalance: (balance as bigint).toString(),
        requiredWei: requiredWei.toString(),
        decimals: actualDecimals,
        contract: CONTRACTS.USDT[56]
      });

      return {
        hasBalance,
        currentBalance,
        error: hasBalance ? undefined : `Insufficient USDT balance. Required: ${requiredAmount}, Available: ${currentBalance}`
      };

    } catch (error) {
      console.error('❌ Failed to verify USDT balance:', error);
      return {
        hasBalance: false,
        currentBalance: '0',
        error: `Failed to check USDT balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
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
    switchChain: switchChainAsync,
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
    approveGasStationAfterFunding,
    executeTransferAfterApproval, // 🔥 NEW: Add transfer after approval function
    checkIfManualApprovalNeeded,
    verifyUSDTBalance, // 🔥 NEW: Add balance verification function
    gasStationEnabled: GAS_STATION_ENABLED,

    hash: txHash,
    isPending,
    isConfirming,
  };
}