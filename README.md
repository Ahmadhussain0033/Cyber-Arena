# 🎮 Cyber Arena - Competitive Gaming Platform

<div align="center">

![Cyber Arena Logo](https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop)

**A cutting-edge competitive gaming platform where players compete in skill-based games to earn real cryptocurrency rewards**

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[🎮 Play Now](#getting-started) • [📖 Documentation](#documentation) • [🚀 Features](#features) • [🛠️ Tech Stack](#tech-stack)

</div>

---

## 🌟 What is Cyber Arena?

Cyber Arena is a revolutionary competitive gaming platform that combines skill-based gaming with cryptocurrency rewards. Players compete in various mini-games, earn digital currency through victories and mining, and can withdraw their earnings as real cryptocurrency. Think of it as the intersection of competitive gaming, blockchain technology, and skill-based entertainment.

### 🎯 Core Concept

- **Skill-Based Competition**: Win games through skill, not luck
- **Cryptocurrency Integration**: Earn real digital currency rewards
- **Multiple Game Modes**: From reaction tests to chess matches
- **Mining System**: Passive income through crypto mining simulation
- **Tournament System**: Compete in organized tournaments for bigger prizes
- **Real-Time Multiplayer**: Play against friends in custom rooms

---

## ✨ Features

### 🎮 Gaming Features

#### **11 Unique Games**
1. **Reaction Master** - Lightning-fast reflex challenges
2. **Crypto Puzzle** - Blockchain-themed sliding puzzles
3. **Precision Strike** - Skill-based target shooting
4. **Neon Runner** - Cyberpunk endless runner
5. **Memory Matrix** - Pattern memorization challenges
6. **Code Racer** - Programming typing speed tests
7. **Chess Master** - Classic chess with real-time play
8. **Tic-Tac-Toe Blitz** - Fast-paced multi-round matches
9. **Word Battle** - Competitive word creation
10. **Number Crunch** - Math problem solving under pressure
11. **Color Match** - Pattern and color matching games

#### **Game Modes**
- **Practice Mode**: Free play to learn mechanics
- **Competitive Mode**: Stake $0.33 per game, win $1.00 for 3-game streaks
- **Multiplayer Rooms**: Create/join custom rooms with friends
- **Tournament Mode**: Organized competitions with larger prize pools

### 💰 Economic System

#### **Earning Mechanisms**
- **Game Victories**: Win $1.00 for achieving 3-game win streaks
- **Tournament Prizes**: Compete for larger prize pools
- **Crypto Mining**: Passive income through simulated mining
- **Achievement Rewards**: Bonus earnings for milestones

#### **Financial Features**
- **Crypto Wallet Integration**: Deposit/withdraw real cryptocurrency
- **Multiple Currencies**: Support for BTC, ETH, SOL, USDC
- **Secure Transactions**: Blockchain-based payment processing
- **Low Fees**: Minimal transaction costs ($0.02 withdrawal fee)

### 🏆 Competitive Features

#### **Ranking System**
- **Global Leaderboards**: Track top players worldwide
- **ELO-Style Ranking**: Skill-based matchmaking
- **Level Progression**: Advance through experience points
- **Achievement System**: Unlock rewards for accomplishments

#### **Tournament System**
- **Automated Tournaments**: New competitions every hour
- **Multiple Difficulties**: Easy, Medium, Hard tournaments
- **Prize Pools**: Entry fees collected into winner rewards
- **Live Spectating**: Watch tournaments in real-time

### ⛏️ Mining System

#### **Passive Income**
- **Hash Rate**: Earn based on mining power (starts at 500 H/s)
- **Efficiency Scaling**: Higher hash rates = better earnings
- **Upgrade System**: Win games to increase mining power
- **Real-Time Tracking**: Monitor earnings and session duration

### 👥 Social Features

#### **Multiplayer Rooms**
- **6-Digit Room Codes**: Easy sharing with friends
- **Custom Settings**: Configure player limits and rules
- **Spectator Mode**: Watch games without participating
- **Real-Time Chat**: Communicate during matches

### 🔐 Account System

#### **Flexible Authentication**
- **Full Accounts**: Email/password with full features
- **Guest Mode**: Instant play with limited features
- **Local Mode**: Offline play with local data storage
- **Account Upgrades**: Convert guest accounts to full accounts

---

## 🛠️ Tech Stack

### **Frontend Framework**
- **React Native**: Cross-platform mobile development
- **Expo SDK 53**: Development platform and tooling
- **Expo Router**: File-based navigation system
- **TypeScript**: Type-safe development

### **UI/UX**
- **Custom Design System**: Cyberpunk-themed components
- **Responsive Design**: Optimized for all screen sizes
- **Micro-interactions**: Smooth animations and transitions
- **Accessibility**: WCAG compliant interface design

### **Backend & Database**
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Relational database with real-time features
- **Row Level Security**: Fine-grained access control
- **Real-time Subscriptions**: Live data updates

### **State Management**
- **React Context**: Global state management
- **Custom Hooks**: Reusable stateful logic
- **Local Storage**: Client-side data persistence
- **Real-time Sync**: Server-client state synchronization

### **Authentication & Security**
- **Supabase Auth**: Secure user authentication
- **JWT Tokens**: Stateless authentication
- **Email/Password**: Traditional authentication
- **Guest Accounts**: Temporary access without registration

### **Deployment & Infrastructure**
- **Expo Application Services**: Mobile app deployment
- **Supabase Hosting**: Backend infrastructure
- **PostgreSQL Cloud**: Managed database hosting
- **CDN Integration**: Fast global content delivery

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cyber-arena.git
   cd cyber-arena
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Add your Supabase credentials
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   ```bash
   # Run Supabase migrations
   npx supabase db reset
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Quick Start Options

#### **Local Mode** (No Setup Required)
- Switch to Local Mode in the login screen
- All data stored locally on device
- Perfect for testing and development
- No backend dependencies

#### **Guest Mode** (Instant Play)
- Click "Play as Guest" on login screen
- Choose any username
- Immediate access to all games
- Limited features (no withdrawals)

#### **Full Account** (Complete Features)
- Register with email and password
- Access to all features including withdrawals
- Persistent data across devices
- Tournament participation

---

## 📱 Platform Support

### **Mobile Platforms**
- **iOS**: iPhone and iPad support
- **Android**: Phone and tablet support
- **Responsive Design**: Adapts to all screen sizes

### **Web Platform**
- **Progressive Web App**: Install on desktop
- **Cross-Browser**: Chrome, Firefox, Safari, Edge
- **Touch Support**: Works with touch screens

### **Development Platforms**
- **Expo Go**: Test on physical devices
- **iOS Simulator**: macOS development
- **Android Emulator**: Cross-platform development
- **Web Browser**: Instant testing

---

## 🎮 Game Mechanics

### **Competitive Gaming**
Each game follows a standardized competitive format:

1. **Entry Fee**: $0.33 per competitive game
2. **Win Condition**: Achieve top performance in your game
3. **Streak System**: Win 3 games in a row for $1.00 bonus
4. **Practice Mode**: Free play to learn mechanics
5. **Skill Progression**: Improve through practice and competition

### **Scoring System**
Games use sophisticated scoring algorithms that consider:
- **Performance Metrics**: Speed, accuracy, efficiency
- **Difficulty Scaling**: Harder challenges = more points
- **Streak Bonuses**: Consecutive wins multiply rewards
- **Time Bonuses**: Faster completion = higher scores

### **Matchmaking**
- **Skill-Based**: Players matched by similar skill levels
- **Quick Match**: Instant game with random opponents
- **Custom Rooms**: Play with specific friends
- **Tournament Brackets**: Organized competitive play

---

## ⛏️ Mining System Deep Dive

### **How Mining Works**
The crypto mining system simulates real cryptocurrency mining:

1. **Hash Rate**: Your mining power (measured in H/s)
2. **Efficiency**: Percentage of maximum possible earnings
3. **Real-Time Earnings**: Coins accumulate while mining is active
4. **Automatic Payouts**: Earnings added to balance when stopped

### **Mining Power Progression**
- **Starting Power**: 500 H/s for new accounts
- **Game Victories**: +50 H/s per win
- **Maximum Power**: 2,000 H/s (100% efficiency)
- **Upgrade Strategy**: Win more games to increase earnings

### **Earnings Calculation**
```
Earnings Rate = (Hash Rate / 2,000,000) * Base Rate
Base Rate = $0.50 per hour
Maximum Hourly = $0.50 (at 2,000 H/s)
```

### **Mining Features**
- **Background Operation**: Continues while app is closed
- **Session Tracking**: Monitor duration and earnings
- **Efficiency Metrics**: Track performance over time
- **Automatic Stopping**: Prevents overheating on mobile devices

---

## 🏆 Tournament System

### **Tournament Types**
- **Hourly Tournaments**: Automated competitions every hour
- **Daily Championships**: Larger prize pools, more participants
- **Weekly Leagues**: Season-long competitions
- **Special Events**: Holiday and themed tournaments

### **Tournament Structure**
1. **Registration Phase**: Players join with entry fees
2. **Bracket Generation**: Single or double elimination
3. **Match Rounds**: Timed competitive games
4. **Prize Distribution**: Winners split the prize pool

### **Prize Pool Calculation**
```
Entry Fee × Number of Participants = Total Prize Pool
Winner: 50% of prize pool
Runner-up: 30% of prize pool
Third Place: 20% of prize pool
```

### **Tournament Features**
- **Live Spectating**: Watch matches in real-time
- **Bracket Visualization**: Track tournament progress
- **Chat Integration**: Communicate with other participants
- **Replay System**: Review match highlights

---

## 💰 Economic Model

### **Revenue Streams**
1. **Game Entry Fees**: $0.33 per competitive game
2. **Tournament Entries**: Variable fees based on prize pools
3. **Withdrawal Fees**: $0.02 per transaction
4. **Premium Features**: Enhanced mining rates, exclusive tournaments

### **Player Earnings**
- **Win Streaks**: $1.00 for 3 consecutive wins
- **Tournament Prizes**: Variable based on entry fees
- **Mining Rewards**: Passive income based on hash rate
- **Achievement Bonuses**: One-time rewards for milestones

### **Economic Balance**
- **House Edge**: 1% on all transactions
- **Prize Pool Guarantee**: 99% of entry fees returned to players
- **Sustainable Model**: Designed for long-term player retention
- **Fair Play**: Skill-based outcomes, no gambling mechanics

---

## 🔐 Security & Privacy

### **Data Protection**
- **End-to-End Encryption**: All sensitive data encrypted
- **GDPR Compliance**: European privacy standards
- **Data Minimization**: Only collect necessary information
- **User Control**: Players can delete accounts and data

### **Financial Security**
- **Blockchain Integration**: Transparent transaction records
- **Multi-Signature Wallets**: Enhanced security for large amounts
- **Regular Audits**: Third-party security assessments
- **Insurance Coverage**: Protection against platform failures

### **Fair Play Enforcement**
- **Anti-Cheat Systems**: Real-time detection of suspicious activity
- **Player Reporting**: Community-driven moderation
- **Account Verification**: KYC for large withdrawals
- **Automated Monitoring**: AI-powered fraud detection

---

## 📊 Analytics & Metrics

### **Player Analytics**
- **Performance Tracking**: Win rates, improvement over time
- **Skill Assessment**: ELO ratings for each game type
- **Engagement Metrics**: Session duration, frequency
- **Revenue Analytics**: Earnings, spending patterns

### **Platform Metrics**
- **Daily Active Users**: Player engagement tracking
- **Game Popularity**: Most played games and modes
- **Economic Health**: Prize pool distributions, withdrawal rates
- **Technical Performance**: Load times, error rates

### **Business Intelligence**
- **Player Retention**: Cohort analysis and churn prediction
- **Revenue Optimization**: A/B testing for features
- **Market Analysis**: Competitive positioning
- **Growth Metrics**: User acquisition and viral coefficients

---

## 🌐 API Documentation

### **Authentication Endpoints**
```typescript
POST /auth/signup
POST /auth/signin
POST /auth/signout
POST /auth/refresh
GET /auth/user
```

### **Game Endpoints**
```typescript
GET /games
POST /games/{id}/play
GET /games/{id}/leaderboard
POST /games/{id}/result
```

### **Tournament Endpoints**
```typescript
GET /tournaments
POST /tournaments/{id}/join
GET /tournaments/{id}/bracket
GET /tournaments/{id}/matches
```

### **Wallet Endpoints**
```typescript
GET /wallet/balance
POST /wallet/deposit
POST /wallet/withdraw
GET /wallet/transactions
```

### **Mining Endpoints**
```typescript
POST /mining/start
POST /mining/stop
GET /mining/status
GET /mining/earnings
```

---

## 🧪 Testing

### **Test Coverage**
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint validation
- **E2E Tests**: Complete user journey testing
- **Performance Tests**: Load and stress testing

### **Testing Frameworks**
- **Jest**: JavaScript unit testing
- **React Native Testing Library**: Component testing
- **Detox**: End-to-end mobile testing
- **Artillery**: Load testing for APIs

### **Quality Assurance**
- **Automated Testing**: CI/CD pipeline integration
- **Manual Testing**: Human verification of critical paths
- **Beta Testing**: Community feedback before releases
- **Security Testing**: Penetration testing and vulnerability scans

---

## 🚀 Deployment

### **Development Environment**
```bash
# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### **Production Deployment**
```bash
# Build for production
npm run build

# Deploy to Expo
npx eas build --platform all

# Deploy to app stores
npx eas submit --platform all
```

### **Infrastructure**
- **Supabase**: Database and authentication
- **Expo Application Services**: Mobile app deployment
- **Netlify**: Web application hosting
- **CloudFlare**: CDN and DDoS protection

---

## 📈 Roadmap

### **Phase 1: Core Platform** ✅
- [x] Basic game mechanics
- [x] User authentication
- [x] Wallet integration
- [x] Mining system
- [x] Tournament framework

### **Phase 2: Enhanced Features** 🚧
- [ ] Advanced tournament types
- [ ] Social features and chat
- [ ] Mobile app optimization
- [ ] Performance improvements
- [ ] Additional game types

### **Phase 3: Ecosystem Expansion** 📋
- [ ] NFT integration
- [ ] DAO governance
- [ ] Mobile app store release
- [ ] Partnership integrations
- [ ] Advanced analytics dashboard

### **Phase 4: Global Scale** 🔮
- [ ] Multi-language support
- [ ] Regional tournaments
- [ ] Esports partnerships
- [ ] VR/AR game modes
- [ ] Blockchain interoperability

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### **Contribution Guidelines**
- Follow the existing code style
- Write comprehensive tests
- Update documentation
- Use descriptive commit messages
- Ensure all tests pass

### **Areas for Contribution**
- **Game Development**: Create new mini-games
- **UI/UX Design**: Improve user interface
- **Performance**: Optimize loading and rendering
- **Security**: Enhance platform security
- **Documentation**: Improve guides and tutorials

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### **Getting Help**
- **Documentation**: Check our comprehensive guides
- **Community Discord**: Join our developer community
- **GitHub Issues**: Report bugs and request features
- **Email Support**: contact@cyberarena.game

### **Frequently Asked Questions**

**Q: Is this real money gambling?**
A: No, Cyber Arena is skill-based gaming. Outcomes are determined by player skill, not chance.

**Q: How do I withdraw my earnings?**
A: Connect a crypto wallet and use the withdrawal feature. Minimum withdrawal is $1.00.

**Q: Can I play without spending money?**
A: Yes! Practice mode is completely free, and you start with $5.00 credit.

**Q: Is my data secure?**
A: Absolutely. We use enterprise-grade encryption and follow industry best practices.

**Q: What devices are supported?**
A: iOS, Android, and web browsers. The app is optimized for mobile devices.

---

## 🙏 Acknowledgments

- **Expo Team**: For the amazing development platform
- **Supabase**: For the robust backend infrastructure
- **React Native Community**: For the excellent ecosystem
- **Our Beta Testers**: For invaluable feedback and bug reports
- **Open Source Contributors**: For making this project possible

---

## 📞 Contact

- **Website**: [https://cyberarena.game](https://cyberarena.game)
- **Email**: contact@cyberarena.game
- **Twitter**: [@CyberArenaGame](https://twitter.com/CyberArenaGame)
- **Discord**: [Join our community](https://discord.gg/cyberarena)
- **GitHub**: [https://github.com/cyberarena/cyber-arena](https://github.com/cyberarena/cyber-arena)

---

<div align="center">

**Built with ❤️ by the Cyber Arena Team**

*Empowering gamers to earn through skill-based competition*

</div>