import { convertKEStoADA, generateMockPaymentAddress, verifyCardanoTransaction } from '../cardano';

describe('Cardano Service', () => {
  describe('convertKEStoADA', () => {
    it('should convert KES to ADA correctly', () => {
      // 1 ADA = 50 KES (mock rate)
      expect(convertKEStoADA(50)).toBe(1);
      expect(convertKEStoADA(100)).toBe(2);
      expect(convertKEStoADA(25)).toBe(0.5);
    });
  });

  describe('generateMockPaymentAddress', () => {
    it('should return a string starting with addr1', () => {
      const address = generateMockPaymentAddress();
      expect(address).toMatch(/^addr1/);
      expect(address.length).toBeGreaterThan(10);
    });
  });

  describe('verifyCardanoTransaction', () => {
    it('should return success for a valid looking hash', async () => {
      const result = await verifyCardanoTransaction('addr1_mock_tx_hash_123');
      expect(result.success).toBe(true);
      expect(result.txHash).toBe('addr1_mock_tx_hash_123');
    });

    it('should return failure for an empty hash', async () => {
      const result = await verifyCardanoTransaction('');
      expect(result.success).toBe(false);
    });
  });
});
