import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft } from "lucide-react";

export default function OddsCalculator() {
  const [americanOdds, setAmericanOdds] = useState<string>("");
  const [decimalOdds, setDecimalOdds] = useState<string>("");
  const [fractionalOdds, setFractionalOdds] = useState<string>("");
  const [stake, setStake] = useState<string>("100");

  // Convert American to Decimal
  const americanToDecimal = (american: number): number => {
    if (american > 0) {
      return american / 100 + 1;
    } else {
      return 100 / Math.abs(american) + 1;
    }
  };

  // Convert Decimal to American
  const decimalToAmerican = (decimal: number): number => {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1));
    }
  };

  // Convert American to Fractional
  const americanToFractional = (american: number): string => {
    if (american > 0) {
      return `${american}/100`;
    } else {
      return `100/${Math.abs(american)}`;
    }
  };

  // Convert Decimal to Fractional
  const decimalToFractional = (decimal: number): string => {
    const numerator = Math.round((decimal - 1) * 100);
    const denominator = 100;
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(numerator, denominator);
    return `${numerator / divisor}/${denominator / divisor}`;
  };

  // Convert Fractional to Decimal
  const fractionalToDecimal = (fractional: string): number => {
    const parts = fractional.split("/");
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
      return numerator / denominator + 1;
    }
    return 0;
  };

  const handleAmericanChange = (value: string) => {
    setAmericanOdds(value);
    if (value) {
      const american = parseFloat(value);
      setDecimalOdds(americanToDecimal(american).toFixed(2));
      setFractionalOdds(americanToFractional(american));
    } else {
      setDecimalOdds("");
      setFractionalOdds("");
    }
  };

  const handleDecimalChange = (value: string) => {
    setDecimalOdds(value);
    if (value) {
      const decimal = parseFloat(value);
      setAmericanOdds(decimalToAmerican(decimal).toString());
      setFractionalOdds(decimalToFractional(decimal));
    } else {
      setAmericanOdds("");
      setFractionalOdds("");
    }
  };

  const handleFractionalChange = (value: string) => {
    setFractionalOdds(value);
    if (value) {
      const decimal = fractionalToDecimal(value);
      setDecimalOdds(decimal.toFixed(2));
      setAmericanOdds(decimalToAmerican(decimal).toString());
    } else {
      setDecimalOdds("");
      setAmericanOdds("");
    }
  };

  const decimal = parseFloat(decimalOdds) || 1;
  const profit = (parseFloat(stake) || 0) * (decimal - 1);
  const totalReturn = (parseFloat(stake) || 0) * decimal;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">Odds Calculator</h1>
          <p className="mt-2 text-slate-400">Convert between American, Decimal, and Fractional odds instantly</p>
        </div>

        {/* Main Calculator */}
        <Card className="border-slate-700 bg-slate-800/50 mb-6">
          <CardHeader>
            <CardTitle className="text-emerald-400">Odds Converter</CardTitle>
            <CardDescription>Enter odds in any format to convert</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* American Odds */}
            <div>
              <Label htmlFor="american" className="text-slate-300">
                American Odds
              </Label>
              <Input
                id="american"
                type="number"
                placeholder="-110, +150, etc."
                value={americanOdds}
                onChange={(e) => handleAmericanChange(e.target.value)}
                className="mt-2 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">e.g., -110 (favorite) or +150 (underdog)</p>
            </div>

            {/* Conversion Arrow */}
            <div className="flex justify-center">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Decimal Odds */}
            <div>
              <Label htmlFor="decimal" className="text-slate-300">
                Decimal Odds
              </Label>
              <Input
                id="decimal"
                type="number"
                placeholder="1.91, 2.50, etc."
                value={decimalOdds}
                onChange={(e) => handleDecimalChange(e.target.value)}
                className="mt-2 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
                step="0.01"
              />
              <p className="mt-1 text-xs text-slate-400">Most common format worldwide</p>
            </div>

            {/* Conversion Arrow */}
            <div className="flex justify-center">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Fractional Odds */}
            <div>
              <Label htmlFor="fractional" className="text-slate-300">
                Fractional Odds
              </Label>
              <Input
                id="fractional"
                type="text"
                placeholder="10/11, 3/1, etc."
                value={fractionalOdds}
                onChange={(e) => handleFractionalChange(e.target.value)}
                className="mt-2 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">UK format (numerator/denominator)</p>
            </div>
          </CardContent>
        </Card>

        {/* Payout Calculator */}
        {decimalOdds && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-blue-400">Payout Calculator</CardTitle>
              <CardDescription>Calculate your potential winnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="stake" className="text-slate-300">
                  Stake ($)
                </Label>
                <Input
                  id="stake"
                  type="number"
                  placeholder="100"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="mt-2 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
                  step="1"
                />
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                  <div className="text-xs text-slate-400">Profit</div>
                  <div className="mt-2 text-2xl font-bold text-emerald-400">
                    ${profit.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                  <div className="text-xs text-slate-400">Stake</div>
                  <div className="mt-2 text-2xl font-bold text-blue-400">
                    ${parseFloat(stake).toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                  <div className="text-xs text-slate-400">Total Return</div>
                  <div className="mt-2 text-2xl font-bold text-amber-400">
                    ${totalReturn.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* ROI */}
              <div className="rounded-lg bg-emerald-900/20 border border-emerald-700/50 p-4">
                <div className="text-sm text-emerald-400">Return on Investment (ROI)</div>
                <div className="mt-2 text-3xl font-bold text-emerald-400">
                  {((profit / parseFloat(stake)) * 100).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-8 rounded-lg bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Odds Format Guide</h3>
          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <div className="font-semibold text-emerald-400">American Odds</div>
              <p>Negative numbers (-110) indicate favorites. Positive numbers (+150) indicate underdogs. Example: -110 means you need to bet $110 to win $100.</p>
            </div>
            <div>
              <div className="font-semibold text-blue-400">Decimal Odds</div>
              <p>The most common format worldwide. Represents total return per $1 bet. Example: 1.91 means you get $1.91 back for every $1 bet (including your stake).</p>
            </div>
            <div>
              <div className="font-semibold text-amber-400">Fractional Odds</div>
              <p>Common in UK and Ireland. Represents profit per stake unit. Example: 10/11 means you win $10 for every $11 bet.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 mb-4">Want more advanced betting tools?</p>
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            Try ChalkPicks Pro Free
          </Button>
        </div>
      </div>
    </div>
  );
}
