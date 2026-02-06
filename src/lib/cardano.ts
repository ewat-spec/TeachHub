
/**
 * Cardano Blockchain Service (Mock)
 * This service simulates interactions with the Cardano network.
 */

// Current mock exchange rate: 1 ADA = 50 KES
const ADA_KES_EXCHANGE_RATE = 50;

export interface CardanoTransactionStatus {
  success: boolean;
  txHash?: string;
  message: string;
}

/**
 * Converts KES amount to ADA
 */
export const convertKEStoADA = (kesAmount: number): number => {
  return parseFloat((kesAmount / ADA_KES_EXCHANGE_RATE).toFixed(2));
};

/**
 * Generates a mock Cardano receiving address
 */
export const generateMockPaymentAddress = (): string => {
  return "addr1qy6r9u6n...6nxq997"; // Simplified mock address
};

/**
 * Simulates verifying a transaction on the Cardano blockchain
 */
export const verifyCardanoTransaction = async (txHash: string): Promise<CardanoTransactionStatus> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (txHash.length < 10) {
    return {
      success: false,
      message: "Invalid transaction hash format."
    };
  }

  // For mock purposes, any non-empty hash is "verified"
  return {
    success: true,
    txHash: txHash,
    message: "Transaction verified successfully on Cardano network."
  };
};

/**
 * Gets the current exchange rate
 */
export const getExchangeRate = () => {
  return {
    rate: ADA_KES_EXCHANGE_RATE,
    currency: "ADA/KES",
    lastUpdated: new Date().toISOString()
  };
};
