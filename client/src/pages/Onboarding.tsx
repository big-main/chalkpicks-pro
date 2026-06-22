import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

const questions = [
  {
    id: "age",
    title: "Age Verification",
    description: "You need to be 21+ to get started.",
    type: "radio",
    options: [
      { value: "under_21", label: "I am under 21" },
      { value: "21_plus", label: "I am 21 or older" },
    ],
  },
  {
    id: "experience",
    title: "Betting Experience",
    description: "How experienced are you with sports betting?",
    type: "radio",
    options: [
      { value: "brand_new", label: "Brand new to sports betting" },
      { value: "just_started", label: "I just started, but struggling to be profitable" },
      { value: "few_months", label: "A few months in, not seeing results" },
      { value: "experienced_unprofitable", label: "I'm experienced but still not profitable" },
      { value: "experienced_profitable", label: "I'm experienced and profitable" },
      { value: "years_in", label: "Years in, looking to scale or sharpen edge" },
    ],
  },
  {
    id: "frequency",
    title: "Betting Frequency",
    description: "How frequently do you bet?",
    type: "radio",
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
    type: "radio",
    options: [
      { value: "under_100", label: "Less than $100 (Recreational)" },
      { value: "100_500", label: "$100 – $500 (Serious bettor)" },
      { value: "1000_5000", label: "$1,000 – $5,000 (Professional)" },
      { value: "over_5000", label: "$5,000+ (Professional)" },
    ],
  },
  {
    id: "intent",
    title: "Your Intent",
    description: "Why should we let you in? Be specific.",
    type: "textarea",
  },
  {
    id: "contact",
    title: "Contact Information",
    description: "How should we reach you?",
    type: "text",
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ageVerified, setAgeVerified] = useState(false);

  const completeOnboarding = trpc.auth.completeOnboarding.useMutation({
    onSuccess: () => {
      setLocation("/dashboard");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Sign in to continue</h1>
        </div>
      </div>
    );
  }

  const question = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const handleNext = () => {
    if (currentStep === 0) {
      if (answers.age !== "21_plus") {
        alert("You must be 21+ to use ChalkPicks");
        return;
      }
      setAgeVerified(true);
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit onboarding
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
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (question.type === "textarea") {
      return answers[question.id]?.trim().length > 10;
    } else if (question.type === "text") {
      return answers[question.id]?.trim().length > 0;
    }
    return !!answers[question.id];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">ChalkPicks Onboarding</h1>
            <span className="text-cyan-400 font-mono">
              {currentStep + 1} / {questions.length}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-2xl">{question.title}</CardTitle>
            <CardDescription className="text-slate-300">{question.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.type === "radio" && (
              <RadioGroup value={answers[question.id] || ""} onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}>
                <div className="space-y-3">
                  {question.options?.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-3 rounded border border-slate-600 hover:border-cyan-400 cursor-pointer transition">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="text-slate-300 cursor-pointer flex-1">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {question.type === "textarea" && (
              <Textarea
                placeholder="Be specific about your goals and why you want to join ChalkPicks..."
                value={answers[question.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white min-h-32"
              />
            )}

            {question.type === "text" && (
              <input
                type="text"
                placeholder="Enter your contact information"
                value={answers[question.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded focus:border-cyan-400 outline-none"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || completeOnboarding.isPending}
            className="bg-gradient-to-r from-green-500 to-cyan-500 text-white hover:from-green-600 hover:to-cyan-600"
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {completeOnboarding.isPending ? "Submitting..." : "Complete"}
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        {currentStep === 0 && (
          <div className="mt-8 p-4 bg-slate-700/50 border border-cyan-400/30 rounded text-slate-300 text-sm">
            <p className="font-mono">// Age verification is required for legal compliance. Real-money sports betting is regulated state-by-state.</p>
          </div>
        )}
      </div>
    </div>
  );
}
