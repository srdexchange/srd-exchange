"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ConnectButton,
  useAccount,
  useParticleAuth,
  useSmartAccount,
} from "@particle-network/connectkit";
import { AAWrapProvider, SendTransactionMode } from "@particle-network/aa";
import { ethers, type Eip1193Provider } from "ethers";
import { formatUnits, parseUnits } from "ethers";
import { createPublicClient, http, formatEther } from "viem";
import { bsc, bscTestnet } from "viem/chains";

// USDT Contract Address on BNB Smart Chain
const USDT_CONTRACT_ADDRESS = "0x55d398326f99059ff775485246999027b3197955";

// ERC-20 ABI for transfer function
import { erc20Abi } from "viem";

// ERC-20 ABI (excluding transfer for read-only calls)
const ERC20_ABI = erc20Abi;

// Create a Viem public client for BSC
const createViemClient = (chainId: number) => {
  const chain = chainId === 56 ? bsc : bscTestnet;
  return createPublicClient({
    chain,
    transport: http()
  });
};

export default function Home() {
  // Particle Network Hooks
  const { isConnected, chainId, chain, address: eoaAddress } = useAccount();
  const { getUserInfo } = useParticleAuth();
  const smartAccount = useSmartAccount();

  // Wallet State
  const [smartWalletAddress, setSmartWalletAddress] = useState<string>("");
  const [userInfo, setUserInfo] = useState<Record<string, any> | null>(null);
  const [bnbBalance, setBnbBalance] = useState<string>("0.0");
  const [usdtBalance, setUsdtBalance] = useState<string>("0.0");
  // Store the raw bigint balance for precise calculations
  const [usdtBalanceRaw, setUsdtBalanceRaw] = useState<bigint>(0n);
  const [usdtDecimals, setUsdtDecimals] = useState<number>(18);
  const [isSmartAccountDeployed, setIsSmartAccountDeployed] = useState<boolean>(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [publicClient, setPublicClient] = useState<any>(null);

  // Transaction State
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [usdtAmount, setUsdtAmount] = useState<string>("0.1");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize providers
  const customProvider = smartAccount
    ? new ethers.BrowserProvider(
        new AAWrapProvider(
          smartAccount,
          SendTransactionMode.Gasless
        ) as Eip1193Provider,
        "any"
      )
    : null;

  // Update public client when chain changes
  useEffect(() => {
    if (chainId) {
      const client = createViemClient(chainId);
      setPublicClient(client);
    }
  }, [chainId]);

  /**
   * Check if smart account is deployed on-chain
   */
  const checkSmartAccountDeployment = useCallback(async () => {
    if (!smartAccount || !publicClient || !smartWalletAddress) return false;
    
    try {
      const code = await publicClient.getBytecode({
        address: smartWalletAddress as `0x${string}`
      });
      
      const deployed = code && code !== "0x";
      setIsSmartAccountDeployed(deployed);
      return deployed;
    } catch (error) {
      console.error("Error checking smart account deployment:", error);
      return false;
    }
  }, [smartAccount, publicClient, smartWalletAddress]);

  /**
   * Fetches the native token balance for smart wallet
   */
  const fetchBnbBalance = useCallback(async (address: string) => {
    if (!publicClient || !address) {
      setBnbBalance("0.0");
      return;
    }

    try {
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });
      
      setBnbBalance(formatEther(balance));
    } catch (error) {
      console.error("Error fetching BNB balance:", error);
      setBnbBalance("0.0");
    }
  }, [publicClient]);

  /**
   * Fetches USDT token balance and decimals for smart wallet
   */
  const fetchUsdtBalance = useCallback(async (address: string) => {
    if (!publicClient || !address) {
      setUsdtBalance("0.0");
      return;
    }

    try {
      // Get decimals
      const decimals = await publicClient.readContract({
        address: USDT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals'
      }) as number;
      
      setUsdtDecimals(decimals);

      // Get balance (bigint for precision)
      const balance = await publicClient.readContract({
        address: USDT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      }) as bigint;

      // Store raw balance and formatted string separately
      setUsdtBalanceRaw(balance);
      setUsdtBalance(formatUnits(balance, decimals));
    } catch (error) {
      console.error("Error fetching USDT balance:", error);
      setUsdtBalance("0.0");
    }
  }, [publicClient]);

  /**
   * Load all account data
   */
  const loadAllAccountData = useCallback(async () => {
    if (!isConnected || !smartAccount || !publicClient) {
      setSmartWalletAddress("");
      setBnbBalance("0.0");
      setUsdtBalance("0.0");
      setUserInfo(null);
      return;
    }

    setIsLoadingBalances(true);
    setErrorMessage(null);
    
    try {
      // Get smart account address
      const accountAddress = await smartAccount.getAddress();
      console.log("Smart wallet address:", accountAddress);
      setSmartWalletAddress(accountAddress);
      
      // Fetch balances
      await Promise.all([
        fetchBnbBalance(accountAddress),
        fetchUsdtBalance(accountAddress)
      ]);
      
      // Check deployment status
      await checkSmartAccountDeployment();

      // Get user profile info
      try {
        const info = getUserInfo();
        if (info) {
          setUserInfo(info);
        }
      } catch (error) {
        console.log("User info not available (external wallet)");
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Error loading account data:", error);
      setErrorMessage("Failed to load wallet data. Please try again.");
    } finally {
      setIsLoadingBalances(false);
    }
  }, [isConnected, smartAccount, publicClient, fetchBnbBalance, fetchUsdtBalance, checkSmartAccountDeployment, getUserInfo]);

  /**
   * Load user's account data when connection status changes
   */
  useEffect(() => {
    if (isConnected && publicClient) {
      loadAllAccountData();
    }
  }, [isConnected, publicClient, loadAllAccountData]);

  /**
   * Opens the Particle Network fiat on-ramp
   */
  const handleOnRamp = () => {
    const network = chainId === 56 ? "BNB%20Smart%20Chain" : "Ethereum";
    const cryptoCoin = chainId === 56 ? "BNB" : "ETH";
    const onRampUrl = `https://ramp.particle.network/?fiatCoin=USD&cryptoCoin=${cryptoCoin}&network=${network}&theme=dark&language=en`;
    window.open(onRampUrl, "_blank");
  };

  /**
   * Send USDT using Particle's AA provider with better error handling
   */
  const sendUsdt = async () => {
    if (!smartAccount || !recipientAddress || !usdtAmount) return;

    setIsSending(true);
    setTransactionHash(null);
    setErrorMessage(null);
    
    try {
      // Validate recipient address
      if (!ethers.isAddress(recipientAddress)) {
        throw new Error("Invalid recipient address format");
      }

      // Validate amount
      const amount = parseFloat(usdtAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid USDT amount");
      }

      // Check balance
      const currentBalance = parseFloat(usdtBalance);
      if (currentBalance < amount) {
        throw new Error(`Insufficient USDT balance. Available: ${usdtBalance} USDT`);
      }

      console.log(`Sending ${amount} USDT to ${recipientAddress}`);

      // Create contract interface
      const iface = new ethers.Interface(ERC20_ABI);
      const parsedAmount = parseUnits(usdtAmount, usdtDecimals);
      
      // Encode transfer function
      const data = iface.encodeFunctionData("transfer", [
        recipientAddress,
        parsedAmount
      ]);

      // Prepare transaction
      const tx = {
        to: USDT_CONTRACT_ADDRESS,
        value: "0x0",
        data: data,
      };

      console.log("Getting fee quotes...");
      
      // Get fee quotes with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Fee quote timeout. Please try again.")), 30000)
      );

      const feeQuotesResult = await Promise.race([
        smartAccount.getFeeQuotes(tx),
        timeoutPromise
      ]) as any;

      if (!feeQuotesResult) {
        throw new Error("Failed to get fee quotes");
      }

      const gaslessQuote = feeQuotesResult.verifyingPaymasterGasless;

      if (!gaslessQuote) {
        console.warn("Gasless not available, trying with gas");
        // If gasless not available, you might want to use regular gas
        throw new Error("Gasless transactions not available right now. Please try again later or use regular gas.");
      }

      console.log("Sending user operation...");
      
      // Send user operation
      const hash = await smartAccount.sendUserOperation({
        userOp: gaslessQuote.userOp,
        userOpHash: gaslessQuote.userOpHash,
      });

      console.log("Transaction hash:", hash);
      setTransactionHash(hash);
      
      // Show success message
      alert(`✅ Transaction submitted successfully!\n\nHash: ${hash}\n\nIt may take a few moments to confirm.`);

      // Refresh balances after a delay
      setTimeout(() => {
        loadAllAccountData();
      }, 5000);

    } catch (error: any) {
      console.error("Transaction error:", error);
      
      let userMessage = "Transaction failed: ";
      
      if (error.message.includes("insufficient")) {
        userMessage += "Insufficient balance in your smart wallet.";
      } else if (error.message.includes("timeout")) {
        userMessage += "Request timed out. Please check your connection and try again.";
      } else if (error.message.includes("rejected")) {
        userMessage += "Transaction was rejected or canceled.";
      } else if (error.message.includes("gasless")) {
        userMessage += "Gasless transactions are temporarily unavailable.";
      } else if (error.message.includes("user op")) {
        userMessage += "Smart wallet error. Your account may need deployment.";
      } else {
        userMessage += error.message || "Unknown error occurred.";
      }
      
      setErrorMessage(userMessage);
      alert(userMessage);
      
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Test transaction with mock data (for development)
   */
  const testTransaction = async () => {
    if (!recipientAddress) {
      setRecipientAddress("0x742d35Cc6634C0532925a3b844Bc9e90F1b6c168"); // Binance hot wallet
    }
    if (!usdtAmount || usdtAmount === "0.1") {
      setUsdtAmount("0.01");
    }
    
    alert("Test mode: Using small amount (0.01 USDT) and Binance test address");
  };

  /**
   * Copy address to clipboard
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Address copied to clipboard!");
  };

  /**
   * Refresh all data
   */
  const refreshData = async () => {
    await loadAllAccountData();
    alert("Data refreshed!");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="w-full flex justify-center mt-4">
        <ConnectButton />
      </div>
      
      {errorMessage && (
        <div className="max-w-6xl mx-auto mt-4">
          <div className="bg-red-900/30 border border-red-500 p-4 rounded-lg">
            <p className="text-red-300">⚠️ {errorMessage}</p>
          </div>
        </div>
      )}
      
      {isConnected && (
        <>
          {/* Smart Wallet Information Banner */}
          <div className="max-w-6xl mx-auto mt-8">
            <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-blue-300 flex items-center">
                  ⚡ Smart Wallet Ready
                </h3>
                <button
                  onClick={refreshData}
                  disabled={isLoadingBalances}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
                >
                  {isLoadingBalances ? "Refreshing..." : "🔄 Refresh"}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-900/20 p-3 rounded">
                  <p className="text-xs text-blue-400 mb-1">Connected Wallet</p>
                  <div className="flex items-center">
                    <code className="text-xs text-blue-200 flex-1 truncate">
                      {eoaAddress || "Not available"}
                    </code>
                    {eoaAddress && (
                      <button
                        onClick={() => copyToClipboard(eoaAddress)}
                        className="ml-2 p-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                      >
                        📋
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-purple-900/20 p-3 rounded">
                  <p className="text-xs text-purple-400 mb-1">Smart Wallet Address</p>
                  <div className="flex items-center">
                    <code className="text-xs text-purple-200 flex-1 truncate">
                      {smartWalletAddress || "Loading..."}
                    </code>
                    {smartWalletAddress && (
                      <button
                        onClick={() => copyToClipboard(smartWalletAddress)}
                        className="ml-2 p-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
                      >
                        📋
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {isSmartAccountDeployed 
                      ? "✅ Deployed and ready" 
                      : "⏳ Will deploy on first transaction"}
                  </p>
                </div>
              </div>
              
              {!isSmartAccountDeployed && (
                <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-500 rounded">
                  <p className="text-sm text-yellow-200">
                    💡 First transaction will deploy your smart wallet. This may take a bit longer.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Account Information Card */}
            <div className="border border-purple-500 p-6 rounded-lg bg-gray-800 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-purple-400">
                Account Information
              </h2>

              {userInfo && (
                <div className="mb-6 flex items-center space-x-4 bg-gray-700 p-4 rounded-lg">
                  {userInfo.avatar && (
                    <img
                      src={userInfo.avatar}
                      alt="User Avatar"
                      className="w-12 h-12 rounded-full border-2 border-purple-500"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300">
                      {userInfo.name || "User"}
                    </h3>
                    {userInfo.thirdparty_user_info?.provider && (
                      <p className="text-gray-400">
                        Connected via {userInfo.thirdparty_user_info.provider}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Network Information */}
              <div className="mb-6">
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-gray-400">Network</span>
                  <div className="flex items-center">
                    <code className="text-purple-300">
                      {chain?.name || "Loading..."} ({chainId})
                    </code>
                    <div className="ml-2 w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Balance Overview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">Smart Wallet Balances</h3>
                
                <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">BNB Balance</span>
                      <div className="flex items-center">
                        <span className="text-purple-300 font-semibold">
                          {bnbBalance} {chain?.nativeCurrency.symbol || "BNB"}
                        </span>
                        <button
                          onClick={() => fetchBnbBalance(smartWalletAddress)}
                          className="ml-2 p-1 hover:bg-purple-700 rounded"
                          title="Refresh BNB Balance"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">USDT Balance</span>
                      <div className="flex items-center">
                        <span className="text-purple-300 font-semibold">
                          {usdtBalance} USDT
                        </span>
                        <button
                          onClick={() => fetchUsdtBalance(smartWalletAddress)}
                          className="ml-2 p-1 hover:bg-purple-700 rounded"
                          title="Refresh USDT Balance"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {parseFloat(usdtBalance) === 0 && (
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500 rounded">
                      <p className="text-sm text-blue-300 mb-2">
                        💰 No USDT in smart wallet
                      </p>
                      <p className="text-xs text-gray-300">
                        Send USDT to your smart wallet address above to start using gasless transactions.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
                  onClick={handleOnRamp}
                >
                  <span>💳</span>
                  <span>Buy Crypto with Fiat</span>
                </button>

                <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
                  onClick={testTransaction}
                  disabled={isSending}
                >
                  <span>🧪</span>
                  <span>Fill Test Data</span>
                </button>
              </div>
            </div>

            {/* Transaction Card */}
            <div className="border border-purple-500 p-6 rounded-lg bg-gray-800 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-purple-400">
                Send USDT (Gasless)
              </h2>
              
              {/* Smart Wallet Status */}
              <div className="mb-6 p-4 bg-purple-900/20 border border-purple-400 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-purple-300">
                    Gasless Status
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${isSmartAccountDeployed ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                    {isSmartAccountDeployed ? '✅ Ready' : '⚠️ Needs Deployment'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {parseFloat(usdtBalance) > 0 
                    ? `You have ${usdtBalance} USDT available for gasless transfers`
                    : 'Deposit USDT to your smart wallet to enable gasless transactions'}
                </p>
              </div>

              {/* Transaction Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    USDT Amount
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="0.1"
                      value={usdtAmount}
                      onChange={(e) => setUsdtAmount(e.target.value)}
                      step="0.01"
                      min="0"
                      className="flex-1 p-3 rounded-lg border border-gray-600 bg-gray-700 text-white"
                    />
                    <button
                      onClick={() => setUsdtAmount(formatUnits(usdtBalanceRaw, usdtDecimals))}
                      className="px-4 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
                      disabled={!usdtBalance || parseFloat(usdtBalance) <= 0}
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Balance Information */}
                <div className="text-sm bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Available:</span>
                    <span className="text-purple-300 font-semibold">
                      {usdtBalance} USDT
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Network Fee:</span>
                    <span className="text-green-400">Sponsored (Free)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">You Send:</span>
                    <span className="text-white font-bold">{usdtAmount} USDT</span>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
  onClick={sendUsdt}
  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg text-lg mt-6"
              >
                {isSending ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⚡</span>
                    Processing Gasless Transaction...
                  </span>
                ) : (
                  `Send ${usdtAmount} USDT (Gasless)`
                )}
              </button>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {["0.1", "1", "10"].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setUsdtAmount(amount)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    {amount} USDT
                  </button>
                ))}
              </div>

              {/* Transaction Result */}
              {transactionHash && (
                <div className="mt-6 p-4 bg-green-900/20 border border-green-500 rounded">
                  <p className="text-green-400 font-semibold mb-2">
                    ✅ Transaction Submitted
                  </p>
                  <p className="text-sm text-gray-300 break-all mb-2">
                    Hash: {transactionHash}
                  </p>
                  {chain?.blockExplorers?.default && (
                    <a
                      href={`${chain.blockExplorers.default.url}/tx/${transactionHash}`}
                      target="_blank"
                      className="inline-block text-blue-400 hover:text-blue-300 text-sm"
                    >
                      🔍 View on Explorer
                    </a>
                  )}
                </div>
              )}

              {/* Help Section */}
              <div className="mt-6 text-xs text-gray-400">
                <details className="cursor-pointer">
                  <summary className="hover:text-white mb-2">
                    ℹ️ How gasless transactions work
                  </summary>
                  <div className="p-3 bg-gray-700/50 rounded mt-2">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Smart wallet handles the transaction</li>
                      <li>Particle Network sponsors the gas fees</li>
                      <li>First transaction deploys your smart wallet</li>
                      <li>Subsequent transactions are fully gasless</li>
                    </ul>
                  </div>
                </details>
              </div>
            </div>
          </div>
          
          {/* Footer Info */}
          <div className="max-w-6xl mx-auto mt-8 text-center text-sm text-gray-500">
            <p>
              Powered by Particle Network ERC-4337 | 
              Network: {chain?.name || "Unknown"} | 
              Smart Wallet: {smartWalletAddress ? `${smartWalletAddress.slice(0, 6)}...${smartWalletAddress.slice(-4)}` : "Loading..."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
