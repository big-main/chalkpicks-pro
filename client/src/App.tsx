import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { useLocation } from "wouter";
import { WebMCPTools } from "@/components/WebMCPTools";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { StructuredData } from "@/components/StructuredData";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/schema-jsonld";
import { PageMeta } from "@/components/PageMeta";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePageTracking } from "@/hooks/usePageTracking";

// Eagerly loaded (critical path)
import Home from "./pages/Home";
import NotFound from "@/pages/NotFound";
import { SocialProofTicker } from "@/components/SocialProofTicker";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AiChatWidget } from "@/components/AiChatWidget";
import { SwipeNavProvider } from "@/components/SwipeNavProvider";
import { BackButton } from "@/components/BackButton";
import { AnnouncementBar } from "@/components/AnnouncementBar";

// Lazy-loaded pages (code splitting)
const Picks = lazy(() => import("./pages/Picks"));
const PickDetail = lazy(() => import("./pages/PickDetail"));
const Stats = lazy(() => import("./pages/Stats"));
const Backtesting = lazy(() => import("./pages/Backtesting"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const MatchupAnalysis = lazy(() => import("./pages/MatchupAnalysis"));
const SubscriptionManagement = lazy(() => import("./pages/SubscriptionManagement"));
const FeedbackAnalytics = lazy(() => import("./pages/FeedbackAnalytics"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const EVFinder = lazy(() => import("@/pages/EVFinder"));
const Tools = lazy(() => import("@/pages/Tools"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const Login = lazy(() => import("@/pages/Login"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));
const AdminPromos = lazy(() => import("@/pages/AdminPromos"));
const KalshiMarkets = lazy(() => import("@/pages/KalshiMarkets"));
const CLVTracker = lazy(() => import("@/pages/CLVTracker"));
const ParlayBuilder = lazy(() => import("@/pages/ParlayBuilder"));
const BankrollTracker = lazy(() => import("@/pages/BankrollTracker"));
const Referral = lazy(() => import("@/pages/Referral"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const SubscriptionDashboard = lazy(() => import("@/pages/SubscriptionDashboard"));
const ArbitrageFinder = lazy(() => import("@/pages/ArbitrageFinder"));
const AffiliateHub = lazy(() => import("@/pages/AffiliateHub"));
const LiveLeaderboard = lazy(() => import("@/pages/LiveLeaderboard"));
const CommunityChat = lazy(() => import("@/pages/CommunityChat"));
const BetSlipBuilder = lazy(() => import("@/pages/BetSlipBuilder"));
const ParlayTracker = lazy(() => import("@/pages/ParlayTracker"));
const ElitePlusTier = lazy(() => import("@/pages/ElitePlusTier"));
const APIAccess = lazy(() => import("@/pages/APIAccess"));
const ResellerProgram = lazy(() => import("@/pages/ResellerProgram"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const Sportsbooks = lazy(() => import("@/pages/Sportsbooks"));
const Sponsors = lazy(() => import("@/pages/Sponsors"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const CreditDashboard = lazy(() => import("@/pages/CreditDashboard"));
const PropBuilder = lazy(() => import("@/pages/PropBuilder"));
const LineMovement = lazy(() => import("@/pages/LineMovement"));
const CorrelationFinder = lazy(() => import("@/pages/CorrelationFinder"));
const ArbitrageOpportunitiesPage = lazy(() => import("@/pages/ArbitrageOpportunitiesPage").then(m => ({ default: m.ArbitrageOpportunitiesPage })));
const OddsComparison = lazy(() => import("@/pages/OddsComparison"));
const Performance = lazy(() => import("@/pages/Performance"));
const BetCalculator = lazy(() => import("@/pages/BetCalculator"));
const StoryGenerator = lazy(() => import("@/pages/StoryGenerator"));
const StoryHistory = lazy(() => import("@/pages/StoryHistory"));
const OddsCalculator = lazy(() => import("@/pages/OddsCalculator"));
const ROICalculator = lazy(() => import("@/pages/ROICalculator"));
const CommunityAutomation = lazy(() => import("@/pages/CommunityAutomation"));
const BlogBestPicks = lazy(() => import("@/pages/BlogBestPicks"));
const BlogAISportsBetting = lazy(() => import("@/pages/BlogAISportsBetting"));
const BlogStrategy = lazy(() => import("@/pages/BlogStrategy"));
const PicksLanding = lazy(() => import("@/pages/PicksLanding"));
const BankrollManager = lazy(() => import("@/pages/BankrollManager"));
const ParlayCalculator = lazy(() => import("@/pages/ParlayCalculator"));
const BlogManagement = lazy(() => import("@/pages/BlogManagement"));
const Blog = lazy(() => import("@/pages/Blog"));
const MediaPartners = lazy(() => import("@/pages/MediaPartners"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const SportPicks = lazy(() => import("@/pages/SportPicks"));
const OddsPage = lazy(() => import("@/pages/OddsPage"));
const DevigCalculator = lazy(() => import("@/pages/DevigCalculator"));
const DFSOptimizer = lazy(() => import("@/pages/DFSOptimizer"));
const EloPowerRatings = lazy(() => import("@/pages/EloPowerRatings"));
const MonteCarloSimulator = lazy(() => import("@/pages/MonteCarloSimulator"));
const SharpMoneyDetector = lazy(() => import("@/pages/SharpMoneyDetector"));
const ConsensusAggregator = lazy(() => import("@/pages/ConsensusAggregator"));
const ParlayFlow = lazy(() => import("@/pages/ParlayFlow"));
const LearnPage = lazy(() => import("@/pages/LearnPage"));
const FreePick = lazy(() => import("@/pages/FreePick"));
const KellyCalculator = lazy(() => import("@/pages/KellyCalculator"));
const EVCalculator = lazy(() => import("@/pages/EVCalculator"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080814" }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#39ff14", borderTopColor: "transparent" }}
        />
        <span className="text-sm" style={{ color: "rgba(200,200,220,0.6)" }}>
          Loading...
        </span>
      </div>
    </div>
  );
}

function Router() {
  usePageTracking();
  const [location] = useLocation();
  return (
    <>
      <PageMeta />
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <BreadcrumbJsonLd />
      <StructuredData />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/picks" component={Picks} />
          <Route path="/picks/:id" component={PickDetail} />
          <Route path="/stats" component={Stats} />
          <Route path="/backtesting" component={Backtesting} />
          <Route path="/dashboard" component={UserDashboard} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/payment/success" component={PaymentSuccess} />
          <Route path="/matchup-analysis" component={MatchupAnalysis} />
          <Route path="/subscription-management" component={SubscriptionManagement} />
          <Route path="/feedback-analytics" component={FeedbackAnalytics} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/ev-finder" component={EVFinder} />
          <Route path="/tools" component={Tools} />
          <Route path="/signup" component={SignUp} />
          <Route path="/login" component={Login} />
          <Route path="/account-settings" component={AccountSettings} />
          <Route path="/subscription-dashboard" component={SubscriptionDashboard} />
          <Route path="/admin/promos" component={AdminPromos} />
          <Route path="/kalshi" component={KalshiMarkets} />
          <Route path="/clv-tracker" component={CLVTracker} />
          <Route path="/parlay-builder" component={ParlayBuilder} />
          <Route path="/parlay-flow" component={ParlayFlow} />
          <Route path="/bankroll-tracker" component={BankrollTracker} />
          <Route path="/referral" component={Referral} />
          <Route path="/affiliate" component={AffiliateHub} />
          <Route path="/live-leaderboard" component={LiveLeaderboard} />
          <Route path="/community" component={CommunityChat} />
          <Route path="/bet-builder" component={BetSlipBuilder} />
          <Route path="/parlay-tracker" component={ParlayTracker} />
          <Route path="/elite-plus" component={ElitePlusTier} />
          <Route path="/api-access" component={APIAccess} />
          <Route path="/reseller" component={ResellerProgram} />
          <Route path="/profile" component={UserProfile} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/arbitrage" component={ArbitrageFinder} />
          <Route path="/arbitrage-opportunities" component={ArbitrageOpportunitiesPage} />
          <Route path="/sportsbooks" component={Sportsbooks} />
          <Route path="/sponsors" component={Sponsors} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/credits" component={CreditDashboard} />
          <Route path="/prop-builder" component={PropBuilder} />
          <Route path="/line-movement" component={LineMovement} />
          <Route path="/correlation-finder" component={CorrelationFinder} />
          <Route path="/odds-comparison" component={OddsComparison} />
          <Route path="/performance" component={Performance} />
          <Route path="/bet-calculator" component={BetCalculator} />
          <Route path="/learn/:slug" component={LearnPage} />
          <Route path="/story-generator" component={StoryGenerator} />
          <Route path="/story-history" component={StoryHistory} />
          <Route path="/tools/odds-calculator" component={OddsCalculator} />
          <Route path="/tools/roi-calculator" component={ROICalculator} />
          <Route path="/community-automation" component={CommunityAutomation} />
          <Route path="/daily-picks" component={PicksLanding} />
          <Route path="/tools/bankroll-manager" component={BankrollManager} />
          <Route path="/tools/parlay-calculator" component={ParlayCalculator} />
          <Route path="/admin/blog" component={BlogManagement} />
          <Route path="/partners" component={MediaPartners} />
          <Route path="/nfl-picks" component={SportPicks} />
          <Route path="/nba-picks" component={SportPicks} />
          <Route path="/mlb-picks" component={SportPicks} />
          <Route path="/nhl-picks" component={SportPicks} />
          <Route path="/ncaaf-picks" component={SportPicks} />
          <Route path="/ncaab-picks" component={SportPicks} />
          <Route path="/mma-picks" component={SportPicks} />
          <Route path="/soccer-picks" component={SportPicks} />
          <Route path="/odds/nfl" component={OddsPage} />
          <Route path="/odds/nba" component={OddsPage} />
          <Route path="/odds/mlb" component={OddsPage} />
          <Route path="/odds/nhl" component={OddsPage} />
          <Route path="/tools/devig-calculator" component={DevigCalculator} />
          <Route path="/dfs-optimizer" component={DFSOptimizer} />
          <Route path="/elo-ratings" component={EloPowerRatings} />
          <Route path="/monte-carlo" component={MonteCarloSimulator} />
          <Route path="/sharp-money" component={SharpMoneyDetector} />
          <Route path="/consensus" component={ConsensusAggregator} />
          <Route path="/free-pick" component={FreePick} />
          <Route path="/tools/kelly-calculator" component={KellyCalculator} />
          <Route path="/tools/ev-calculator" component={EVCalculator} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/best-sports-betting-picks" component={BlogBestPicks} />
          <Route path="/blog/ai-sports-betting" component={BlogAISportsBetting} />
          <Route path="/blog/sports-betting-strategy" component={BlogStrategy} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
        </PageTransition>
        </AnimatePresence>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <WebMCPTools />
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <SwipeNavProvider>
            <AnnouncementBar />
            <BackButton />
            <Router />
            <SocialProofTicker />
            <MobileBottomNav />
            <AiChatWidget />
          </SwipeNavProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
