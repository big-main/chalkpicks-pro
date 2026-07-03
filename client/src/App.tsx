import { lazy, Suspense } from "react";
import { WebMCPTools } from "@/components/WebMCPTools";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
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

// Lazy-loaded pages (code splitting)
const Picks = lazy(() => import("./pages/Picks"));
const PickDetail = lazy(() => import("./pages/PickDetail"));
const Stats = lazy(() => import("./pages/Stats"));
const Backtesting = lazy(() => import("./pages/Backtesting"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PayPalPricing = lazy(() => import("./pages/PayPalPricing"));
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

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080814" }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#39ff14", borderTopColor: "transparent" }}
        />
        <span className="text-sm" style={{ color: "rgba(200,200,220,0.6)", fontFamily: "'Exo 2', sans-serif" }}>
          Loading...
        </span>
      </div>
    </div>
  );
}

function Router() {
  usePageTracking();
  return (
    <>
      <PageMeta />
      <BreadcrumbJsonLd />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/picks" component={Picks} />
          <Route path="/picks/:id" component={PickDetail} />
          <Route path="/stats" component={Stats} />
          <Route path="/backtesting" component={Backtesting} />
          <Route path="/dashboard" component={UserDashboard} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/pricing-paypal" component={PayPalPricing} />
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
          <Route path="/bankroll-tracker" component={BankrollTracker} />
          <Route path="/referral" component={Referral} />
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
          <Route path="/story-generator" component={StoryGenerator} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
