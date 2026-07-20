import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Shield,
  Target,
  Clock,
  DollarSign,
  MessageSquare,
  Mail,
} from "lucide-react";

const questions = [
  {
    id: "age",
    title: "Age Verification",
    description: "You must be 21 or older to use ChalkPicks.",
    icon: Shield,
    type: "radio" as const,
    options: [
      { value: "under_21", label: "I am under 21" },
      { value: "21_plus", label: "I am 21 or older" },
    ],
  },
  {
    id: "experience",
    title: "Betting Experience",
    description: "How experienced are you with sports betting?",
    icon: Target,
    type: "radio" as const,
    options: [
      { value: "brand_new", label: "Brand new to sports betting" },
      { value: "just_started", label: "Just started, struggling to be profitable" },
      { value: "few_months", label: "A few months in, not seeing results" },
      { value: "experienced_unprofitable", label: "Experienced but still not profitable" },
      { value: "experienced_profitable", label: "Experienced and profitable" },
      { value: "years_in", label: "Years in, looking to scale or sharpen edge" },
    ],
  },
  {
    id: "frequency",
    title: "Betting Frequency",
    description: "How often do you place bets?",
    icon: Clock,
    type: "radio" as const,
    options: [
      { value: "occasionally", label: "Occasionally / monthly" },
      { value: "few_times_week", label: "A few times a week" },
      { value: "multiple_times_day", label: "Multiple times a day" },
    ],
  },
  {
    id: "bet_size",
    title: "Weekly Bet Size",
    description: "On average, how much do you bet per week?",
    icon: DollarSign,
    type: "radio" as const,
    options: [
      { value: "under_100", label: "Less than $100 (Recreational)" },
      { value: "100_500", label: "$100 – $500 (Serious bettor)" },
      { value: "1000_5000", label: "$1,000 – $5,000 (Professional)" },
      { value: "over_5000", label: "$5,000+ (Professional)" },
    ],
  },
  {
    id: "intent",
    title: "Your Goals",
    description: "What do you want to achieve with ChalkPicks?",
    icon: MessageSquare,
    type: "textarea" as const,
    options: undefined,
  },
  {
    id: "contact",
    title: "Contact Info",
    description: "How should we reach you with updates?",
    icon: Mail,
    type: "text" as const,
    options: undefined,
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const completeOnboarding = trpc.auth.completeOnboarding.useMutation({
    onSuccess: () => {
      setLocation("/dashboard");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Sign in to continue</h1>
          <p className="text-muted-foreground">You need to be logged in to complete onboarding.</p>
        </div>
      </div>
    );
  }

  const question = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = () => {
    if (currentStep === 0 && answers.age !== "21_plus") {
      alert("You must be 21+ to use ChalkPicks");
      return;
    }

    if (currentStep < questions.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding.mutate({
        experienceLevel: answers.experience as any,
        bettingFrequency: answers.frequency as any,
        weeklyBetSize: answers.bet_size as any,
        onboardingIntent: answers.intent,
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (question.type === "textarea") return (answers[question.id]?.trim().length ?? 0) > 10;
    if (question.type === "text") return (answers[question.id]?.trim().length ?? 0) > 0;
    return !!answers[question.id];
  };

  const Icon = question.icon;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[rgba(57,255,20,0.02)] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[rgba(212,160,23,0.02)] blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
            Welcome to ChalkPicks
          </h1>
          <p className="text-muted-foreground text-sm">
            Let's personalize your experience
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "w-8 bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.4)]"
                  : i < currentStep
                  ? "w-4 bg-[rgba(57,255,20,0.4)]"
                  : "w-4 bg-[rgba(255,255,255,0.08)]"
              }`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-[rgba(255,255,255,0.05)] rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#39ff14] to-[var(--gold-bright)]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="glass-card p-6 sm:p-8"
          >
            {/* Question header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[rgba(57,255,20,0.08)] border border-[rgba(57,255,20,0.15)] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#39ff14]" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">{question.title}</h2>
                <p className="text-sm text-muted-foreground">{question.description}</p>
              </div>
            </div>

            {/* Question content */}
            <div className="space-y-3">
              {question.type === "radio" && (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
                >
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <motion.div
                        key={option.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          answers[question.id] === option.value
                            ? "border-[rgba(57,255,20,0.4)] bg-[rgba(57,255,20,0.05)]"
                            : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(57,255,20,0.2)] bg-[rgba(255,255,255,0.02)]"
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label
                          htmlFor={option.value}
                          className="text-foreground/90 cursor-pointer flex-1 text-sm"
                        >
                          {option.label}
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {question.type === "textarea" && (
                <Textarea
                  placeholder="Tell us about your goals and what you want to achieve..."
                  value={answers[question.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-foreground min-h-32 rounded-xl focus:border-[rgba(57,255,20,0.3)] placeholder:text-muted-foreground/50"
                />
              )}

              {question.type === "text" && (
                <input
                  type="text"
                  placeholder="Email, phone, or Discord handle"
                  value={answers[question.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-foreground rounded-xl focus:border-[rgba(57,255,20,0.3)] outline-none placeholder:text-muted-foreground/50"
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-6">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            className="border-[rgba(255,255,255,0.1)] text-muted-foreground hover:bg-[rgba(255,255,255,0.05)] rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || completeOnboarding.isPending}
            className="btn-premium rounded-xl px-6"
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {completeOnboarding.isPending ? "Submitting..." : "Complete"}
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Step counter */}
        <p className="text-center text-muted-foreground text-xs mt-4">
          Step {currentStep + 1} of {questions.length}
        </p>
      </div>
    </div>
  );
}
