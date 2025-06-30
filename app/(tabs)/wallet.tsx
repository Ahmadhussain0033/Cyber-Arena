import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useGameData } from '@/context/GameDataContext';
import { StatCard } from '@/components/ui/StatCard';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Transaction } from '@/types';
import { DollarSign, TrendingUp, TrendingDown, Pickaxe, CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle, TriangleAlert as AlertTriangle, UserPlus, Wallet, Copy, Check, QrCode, ExternalLink } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function WalletTab() {
  const { user, isGuest, upgradeGuestAccount, isLocalMode } = useAuth();
  const { transactions, withdrawCrypto, depositCrypto } = useGameData();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [savedWalletAddress, setSavedWalletAddress] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositAddressCopied, setDepositAddressCopied] = useState(false);

  if (!user) return null;

  // Load saved wallet address on component mount
  React.useEffect(() => {
    const storageKey = isGuest ? `guest_wallet_${user.id}` : isLocalMode ? `local_wallet_${user.id}` : `wallet_${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setSavedWalletAddress(saved);
    }

    // Generate or load deposit address
    const depositKey = isGuest ? `guest_deposit_${user.id}` : isLocalMode ? `local_deposit_${user.id}` : `deposit_${user.id}`;
    let depositAddr = localStorage.getItem(depositKey);
    if (!depositAddr) {
      // Generate a mock deposit address
      depositAddr = generateDepositAddress();
      localStorage.setItem(depositKey, depositAddr);
    }
    setDepositAddress(depositAddr);
  }, [user.id, isGuest, isLocalMode]);

  const generateDepositAddress = (): string => {
    // Generate a realistic-looking Bitcoin address for demo
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '1'; // Bitcoin addresses start with 1 or 3
    for (let i = 0; i < 33; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const getTransactionIcon = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'win':
        return <TrendingUp size={16} color="#00ff88" />;
      case 'loss':
        return <TrendingDown size={16} color="#ff0080" />;
      case 'mining':
        return <Pickaxe size={16} color="#00aaff" />;
      case 'withdrawal':
        return <ArrowUpCircle size={16} color="#ffaa00" />;
      case 'deposit':
        return <ArrowDownCircle size={16} color="#00ff88" />;
      default:
        return <DollarSign size={16} color="#888888" />;
    }
  };

  const formatAmount = (transaction: Transaction) => {
    const sign = transaction.amount >= 0 ? '+' : '';
    const amount = `${sign}$${transaction.amount.toFixed(2)}`;
    const fee = transaction.fee ? ` (Fee: $${transaction.fee.toFixed(2)})` : '';
    return amount + fee;
  };

  const getAmountColor = (transaction: Transaction) => {
    if (transaction.type === 'win' || transaction.type === 'mining' || transaction.type === 'deposit') {
      return '#00ff88';
    }
    return '#ff0080';
  };

  const validateWalletAddress = (address: string) => {
    // Basic validation for common crypto wallet formats
    const patterns = {
      bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
      ethereum: /^0x[a-fA-F0-9]{40}$/,
      solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    };

    return Object.values(patterns).some(pattern => pattern.test(address));
  };

  const saveWalletAddress = () => {
    if (!walletAddress.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }
    
    if (!validateWalletAddress(walletAddress.trim())) {
      Alert.alert('Error', 'Please enter a valid wallet address');
      return;
    }

    const storageKey = isGuest ? `guest_wallet_${user.id}` : isLocalMode ? `local_wallet_${user.id}` : `wallet_${user.id}`;
    localStorage.setItem(storageKey, walletAddress.trim());
    setSavedWalletAddress(walletAddress.trim());
    setWalletAddress('');
    setShowWalletSetup(false);
    Alert.alert('Success', 'Wallet address saved successfully!');
  };

  const copyAddress = async (address: string, setCopied: (value: boolean) => void) => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        // Fallback for browsers that don't support clipboard API
        Alert.alert('Address', address);
      }
    }
  };

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const processDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount < 0.01) {
      Alert.alert('Error', 'Minimum deposit amount is $0.01');
      return;
    }

    try {
      // Simulate deposit processing
      const result = await depositCrypto(amount);
      if (result.success) {
        Alert.alert(
          'Deposit Initiated',
          `$${amount.toFixed(2)} deposit has been initiated. Funds will appear in your account within 30 minutes.\n\nTransaction ID: ${result.transactionId}`,
          [{ text: 'OK', onPress: () => setShowDepositModal(false) }]
        );
        setDepositAmount('');
      } else {
        Alert.alert('Error', 'Failed to process deposit. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process deposit');
    }
  };

  const handleWithdraw = async () => {
    if (isGuest) {
      Alert.alert(
        'Account Upgrade Required',
        'Guest accounts cannot withdraw funds. Upgrade to a full account to enable withdrawals and permanently save your progress.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Account', onPress: () => setShowUpgrade(true) }
        ]
      );
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!savedWalletAddress) {
      Alert.alert(
        'Wallet Address Required',
        'Please add your crypto wallet address first to receive withdrawals.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Wallet', onPress: () => setShowWalletSetup(true) }
        ]
      );
      return;
    }

    try {
      const result = await withdrawCrypto(amount);
      if (result.success) {
        Alert.alert(
          'Withdrawal Initiated', 
          `$${amount.toFixed(2)} withdrawal to ${savedWalletAddress.substring(0, 8)}...${savedWalletAddress.substring(savedWalletAddress.length - 8)} has been initiated.\n\nFee: $${result.fee.toFixed(2)}\n\nFunds will arrive within 24 hours.`
        );
        setWithdrawAmount('');
      } else {
        Alert.alert('Error', 'Insufficient balance for withdrawal + fees');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process withdrawal');
    }
  };

  const handleUpgradeAccount = async () => {
    if (!upgradeEmail || !upgradePassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (upgradePassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setUpgrading(true);
    try {
      await upgradeGuestAccount(upgradeEmail, upgradePassword);
      Alert.alert(
        'Account Upgraded!',
        'Your guest account has been upgraded successfully! You can now withdraw funds and your progress is permanently saved.',
        [{ text: 'OK', onPress: () => setShowUpgrade(false) }]
      );
    } catch (error: any) {
      Alert.alert('Upgrade Failed', error.message);
    } finally {
      setUpgrading(false);
    }
  };

  if (showDepositModal) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>DEPOSIT CRYPTO</Text>
            <Text style={styles.subtitle}>Add funds to your account</Text>
          </View>

          <CyberCard style={styles.depositCard}>
            <View style={styles.depositContent}>
              <QrCode size={48} color="#00ff88" />
              <Text style={styles.depositTitle}>Your Deposit Address</Text>
              <Text style={styles.depositDescription}>
                Send crypto to this address to add funds to your account
              </Text>

              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>Bitcoin Address:</Text>
                <View style={styles.addressRow}>
                  <Text style={styles.addressText}>{depositAddress}</Text>
                  <CyberButton
                    title={depositAddressCopied ? "Copied!" : "Copy"}
                    onPress={() => copyAddress(depositAddress, setDepositAddressCopied)}
                    variant="secondary"
                    size="small"
                  />
                </View>
              </View>

              <View style={styles.depositInstructions}>
                <Text style={styles.instructionTitle}>How to Deposit:</Text>
                <Text style={styles.instructionText}>1. Copy the address above</Text>
                <Text style={styles.instructionText}>2. Send Bitcoin to this address</Text>
                <Text style={styles.instructionText}>3. Funds appear within 30 minutes</Text>
                <Text style={styles.instructionText}>4. Minimum deposit: $0.01</Text>
              </View>

              <View style={styles.manualDepositSection}>
                <Text style={styles.manualDepositTitle}>Manual Deposit (Demo)</Text>
                <Text style={styles.manualDepositDescription}>
                  For testing purposes, you can manually add funds:
                </Text>
                
                <View style={styles.inputContainer}>
                  <DollarSign size={16} color="#00ff88" />
                  <TextInput
                    style={styles.input}
                    placeholder="Amount to deposit"
                    placeholderTextColor="#666666"
                    value={depositAmount}
                    onChangeText={setDepositAmount}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.depositActions}>
                  <CyberButton
                    title="Cancel"
                    onPress={() => setShowDepositModal(false)}
                    variant="secondary"
                    style={styles.depositButton}
                  />
                  <CyberButton
                    title="Add Funds"
                    onPress={processDeposit}
                    style={styles.depositButton}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  />
                </View>
              </View>

              <View style={styles.supportedCrypto}>
                <Text style={styles.supportedTitle}>Supported Cryptocurrencies:</Text>
                <Text style={styles.supportedText}>• Bitcoin (BTC)</Text>
                <Text style={styles.supportedText}>• Ethereum (ETH)</Text>
                <Text style={styles.supportedText}>• Solana (SOL)</Text>
                <Text style={styles.supportedText}>• USDC (Stablecoin)</Text>
              </View>
            </View>
          </CyberCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showWalletSetup) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>WALLET SETUP</Text>
            <Text style={styles.subtitle}>Configure your crypto wallet for withdrawals</Text>
          </View>

          <CyberCard style={styles.walletSetupCard}>
            <View style={styles.walletSetupContent}>
              <Wallet size={48} color="#00ff88" />
              <Text style={styles.walletSetupTitle}>Add Wallet Address</Text>
              <Text style={styles.walletSetupDescription}>
                Enter your crypto wallet address to receive withdrawals. We support Bitcoin, Ethereum, Solana, and USDC.
              </Text>

              {savedWalletAddress && (
                <View style={styles.currentWalletContainer}>
                  <Text style={styles.currentWalletLabel}>Current Wallet:</Text>
                  <View style={styles.currentWalletRow}>
                    <Text style={styles.currentWalletAddress}>
                      {savedWalletAddress.substring(0, 12)}...{savedWalletAddress.substring(savedWalletAddress.length - 12)}
                    </Text>
                    <CyberButton
                      title={addressCopied ? "Copied!" : "Copy"}
                      onPress={() => copyAddress(savedWalletAddress, setAddressCopied)}
                      variant="secondary"
                      size="small"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <DollarSign size={16} color="#00ff88" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter wallet address (BTC, ETH, SOL, USDC)"
                  placeholderTextColor="#666666"
                  value={walletAddress}
                  onChangeText={setWalletAddress}
                  autoCapitalize="none"
                  multiline
                />
              </View>

              <View style={styles.walletActions}>
                <CyberButton
                  title="Cancel"
                  onPress={() => setShowWalletSetup(false)}
                  variant="secondary"
                  style={styles.walletButton}
                />
                <CyberButton
                  title="Save Wallet"
                  onPress={saveWalletAddress}
                  style={styles.walletButton}
                />
              </View>

              <View style={styles.walletInfo}>
                <Text style={styles.infoTitle}>Supported Wallets:</Text>
                <Text style={styles.infoText}>• Bitcoin (BTC) - Legacy & SegWit addresses</Text>
                <Text style={styles.infoText}>• Ethereum (ETH) - ERC-20 compatible</Text>
                <Text style={styles.infoText}>• Solana (SOL) - Native Solana addresses</Text>
                <Text style={styles.infoText}>• USDC - On Ethereum or Solana networks</Text>
              </View>
            </View>
          </CyberCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showUpgrade) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>UPGRADE ACCOUNT</Text>
            <Text style={styles.subtitle}>Convert your guest account to a full account</Text>
          </View>

          <CyberCard style={styles.upgradeCard}>
            <View style={styles.upgradeContent}>
              <UserPlus size={48} color="#00ff88" />
              <Text style={styles.upgradeTitle}>Account Upgrade</Text>
              <Text style={styles.upgradeDescription}>
                Upgrade your guest account to unlock withdrawals and permanently save your progress.
              </Text>

              <View style={styles.upgradeForm}>
                <View style={styles.inputContainer}>
                  <DollarSign size={16} color="#00ff88" />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#666666"
                    value={upgradeEmail}
                    onChangeText={setUpgradeEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <DollarSign size={16} color="#00ff88" />
                  <TextInput
                    style={styles.input}
                    placeholder="Password (min 6 characters)"
                    placeholderTextColor="#666666"
                    value={upgradePassword}
                    onChangeText={setUpgradePassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.upgradeActions}>
                  <CyberButton
                    title="Cancel"
                    onPress={() => setShowUpgrade(false)}
                    variant="secondary"
                    style={styles.upgradeButton}
                  />
                  <CyberButton
                    title={upgrading ? "Upgrading..." : "Upgrade Account"}
                    onPress={handleUpgradeAccount}
                    disabled={upgrading}
                    style={styles.upgradeButton}
                  />
                </View>
              </View>

              <View style={styles.upgradeFeatures}>
                <Text style={styles.featureTitle}>What you get:</Text>
                <Text style={styles.featureText}>✓ Withdraw your earnings</Text>
                <Text style={styles.featureText}>✓ Permanent account storage</Text>
                <Text style={styles.featureText}>✓ Enhanced security</Text>
                <Text style={styles.featureText}>✓ Keep all your current progress</Text>
              </View>
            </View>
          </CyberCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>CRYPTO WALLET</Text>
          <Text style={styles.subtitle}>
            {isGuest ? 'Guest Account - Upgrade to withdraw' : 
             isLocalMode ? 'Local Mode - Limited features' : 
             'Manage your digital assets'}
          </Text>
        </View>

        {(isGuest || isLocalMode) && (
          <View style={styles.guestWarning}>
            <AlertTriangle size={16} color="#ffaa00" />
            <Text style={styles.guestWarningText}>
              {isGuest ? 'Guest Account: Upgrade to enable withdrawals' : 
               'Local Mode: Limited withdrawal features'}
            </Text>
            {isGuest && (
              <CyberButton
                title="Upgrade"
                onPress={() => setShowUpgrade(true)}
                variant="secondary"
                size="small"
              />
            )}
          </View>
        )}

        <View style={styles.balanceContainer}>
          <StatCard
            title="Available Balance"
            value={`$${user.balance.toFixed(2)}`}
            glowColor="#00ff88"
            icon={<DollarSign size={20} color="#00ff88" />}
          />
          {user.debt > 0 && (
            <StatCard
              title="Current Debt"
              value={`$${user.debt.toFixed(2)}`}
              subtitle={user.debt >= 10 ? 'Account Locked' : 'Pay to avoid lock'}
              glowColor="#ff0080"
              icon={<AlertTriangle size={20} color="#ff0080" />}
            />
          )}
        </View>

        <View style={styles.actionsContainer}>
          <CyberCard>
            <View style={styles.withdrawForm}>
              <Text style={styles.formTitle}>
                {isGuest ? 'Crypto Transactions (Requires Upgrade)' : 'Crypto Transactions'}
              </Text>
              
              {savedWalletAddress && (
                <View style={styles.walletDisplay}>
                  <Text style={styles.walletLabel}>Withdrawal Address:</Text>
                  <View style={styles.walletAddressRow}>
                    <Text style={styles.walletAddressText}>
                      {savedWalletAddress.substring(0, 12)}...{savedWalletAddress.substring(savedWalletAddress.length - 12)}
                    </Text>
                    <CyberButton
                      title={addressCopied ? "Copied!" : "Copy"}
                      onPress={() => copyAddress(savedWalletAddress, setAddressCopied)}
                      variant="secondary"
                      size="small"
                    />
                    <CyberButton
                      title="Change"
                      onPress={() => setShowWalletSetup(true)}
                      variant="secondary"
                      size="small"
                    />
                  </View>
                </View>
              )}

              {!savedWalletAddress && (
                <View style={styles.noWalletContainer}>
                  <Text style={styles.noWalletText}>No wallet address configured</Text>
                  <CyberButton
                    title="Add Wallet Address"
                    onPress={() => setShowWalletSetup(true)}
                    variant="secondary"
                    size="small"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <DollarSign size={16} color="#00ff88" />
                <TextInput
                  style={styles.input}
                  placeholder="Amount to withdraw"
                  placeholderTextColor="#666666"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                  editable={!isGuest}
                />
              </View>
              <View style={styles.actionRow}>
                <CyberButton
                  title="💰 Deposit"
                  onPress={handleDeposit}
                  variant="secondary"
                  style={styles.actionButton}
                />
                <CyberButton
                  title={isGuest ? "Upgrade to Withdraw" : "💸 Withdraw"}
                  onPress={handleWithdraw}
                  variant="primary"
                  style={styles.actionButton}
                  disabled={!isGuest && (user.balance <= 0.02 || !withdrawAmount || !savedWalletAddress)}
                />
              </View>
              <Text style={styles.feeText}>
                Withdrawal fee: $0.02 per transaction • Funds arrive within 24 hours
              </Text>
            </View>
          </CyberCard>
        </View>

        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <CyberCard>
              <View style={styles.emptyState}>
                <DollarSign size={48} color="#666666" />
                <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                <Text style={styles.emptyText}>
                  Start playing games or mining to see your transaction history here.
                </Text>
              </View>
            </CyberCard>
          ) : (
            transactions.map(transaction => (
              <CyberCard key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionContent}>
                  <View style={styles.transactionLeft}>
                    <View style={styles.transactionIcon}>
                      {getTransactionIcon(transaction)}
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionTime}>
                        {transaction.timestamp.toLocaleDateString()} {' '}
                        {transaction.timestamp.toLocaleTimeString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: getAmountColor(transaction) }
                  ]}>
                    {formatAmount(transaction)}
                  </Text>
                </View>
              </CyberCard>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: width < 380 ? 20 : 24,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: width < 380 ? 12 : 14,
    color: '#00ff88',
    marginTop: 4,
    textAlign: 'center',
  },
  guestWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#ffaa00',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  guestWarningText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#ffaa00',
    flex: 1,
  },
  balanceContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  withdrawForm: {
    gap: 12,
  },
  formTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  walletDisplay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 6,
  },
  walletLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 10,
    color: '#888888',
    textTransform: 'uppercase',
  },
  walletAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletAddressText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 12,
    color: '#00ff88',
    flex: 1,
  },
  noWalletContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    gap: 8,
  },
  noWalletText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#888888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  feeText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 10,
    color: '#888888',
    textAlign: 'center',
  },
  depositCard: {
    margin: 16,
  },
  depositContent: {
    alignItems: 'center',
    gap: 16,
  },
  depositTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  depositDescription: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 18,
  },
  addressContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#00ff88',
    gap: 8,
  },
  addressLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#00ff88',
    textTransform: 'uppercase',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 11,
    color: '#ffffff',
    flex: 1,
  },
  depositInstructions: {
    width: '100%',
    gap: 6,
  },
  instructionTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
  },
  instructionText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#aaaaaa',
  },
  manualDepositSection: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 12,
  },
  manualDepositTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffaa00',
    textAlign: 'center',
  },
  manualDepositDescription: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#aaaaaa',
    textAlign: 'center',
  },
  depositActions: {
    flexDirection: 'row',
    gap: 8,
  },
  depositButton: {
    flex: 1,
  },
  supportedCrypto: {
    width: '100%',
    gap: 6,
  },
  supportedTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
  },
  supportedText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#aaaaaa',
  },
  walletSetupCard: {
    margin: 16,
  },
  walletSetupContent: {
    alignItems: 'center',
    gap: 16,
  },
  walletSetupTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  walletSetupDescription: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 18,
  },
  currentWalletContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#00ff88',
    width: '100%',
    gap: 8,
  },
  currentWalletLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#00ff88',
    textTransform: 'uppercase',
  },
  currentWalletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentWalletAddress: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 12,
    color: '#ffffff',
    flex: 1,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  walletButton: {
    flex: 1,
  },
  walletInfo: {
    alignItems: 'flex-start',
    gap: 6,
    width: '100%',
  },
  infoTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
  },
  infoText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#aaaaaa',
  },
  upgradeCard: {
    margin: 16,
  },
  upgradeContent: {
    alignItems: 'center',
    gap: 16,
  },
  upgradeTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  upgradeDescription: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 18,
  },
  upgradeForm: {
    width: '100%',
    gap: 12,
  },
  upgradeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  upgradeButton: {
    flex: 1,
  },
  upgradeFeatures: {
    alignItems: 'center',
    gap: 6,
  },
  featureTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
  },
  featureText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#00ff88',
  },
  transactionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transactionCard: {
    marginBottom: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  transactionTime: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 10,
    color: '#888888',
  },
  transactionAmount: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },
});