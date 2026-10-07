"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FadeIn, AnimatedNumber } from "@/components/animations";
import {
  Wallet,
  Target,
  GitCompare,
  Plus,
  X,
  TrendingDown,
  Crown,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  calculateSWP,
  calculateMaxMonthlySWP,
  compareSWPScenarios,
  type SWPScenarioInput,
} from "@/lib/swp-calculator";

function fmtCurrency(n: number): string {
  if (!isFinite(n)) return "₹0";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function fmtCompact(n: number): string {
  if (!isFinite(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return fmtCurrency(n);
}

const SCENARIO_COLORS = ["#0d9488", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6"];

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-300">{label}</label>
      <div className="relative">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = 1,
  formatValue,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-300">{label}</label>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
          {formatValue ? formatValue(value) : value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[Number.isFinite(value) ? value : 0]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function PresetChips({
  options,
  value,
  onSelect,
  format,
}: {
  options: number[];
  value: number;
  onSelect: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
            value === opt
              ? "bg-teal-600 border-teal-600 text-white"
              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-teal-300 hover:text-teal-600"
          }`}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-slate-900 dark:text-slate-50";
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="p-4">
        <p className="text-[10px] text-slate-500 dark:text-slate-300 uppercase font-bold tracking-wide">
          {label}
        </p>
        <p className={`text-xl font-bold mt-0.5 tabular-nums ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function SWPCalculatorPage() {
  const [corpus, setCorpus] = useState(50_00_000);
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(25000);
  const [annualReturn, setAnnualReturn] = useState(10);
  const [years, setYears] = useState(20);
  const [stepUp, setStepUp] = useState(0);

  const swpResult = useMemo(
    () =>
      calculateSWP({
        corpus,
        monthlyWithdrawal,
        annualReturnPercent: annualReturn,
        years,
        stepUpPercent: stepUp,
      }),
    [corpus, monthlyWithdrawal, annualReturn, years, stepUp]
  );

  const [sustainCorpus, setSustainCorpus] = useState(50_00_000);
  const [sustainReturn, setSustainReturn] = useState(10);
  const [sustainYears, setSustainYears] = useState(20);

  const maxMonthly = useMemo(
    () => calculateMaxMonthlySWP(sustainCorpus, sustainReturn, sustainYears),
    [sustainCorpus, sustainReturn, sustainYears]
  );

  const [scenarios, setScenarios] = useState<SWPScenarioInput[]>([
    { label: "Lean", corpus: 50_00_000, monthlyWithdrawal: 20000, annualReturnPercent: 8, years: 20 },
    { label: "Base", corpus: 50_00_000, monthlyWithdrawal: 30000, annualReturnPercent: 10, years: 20 },
    { label: "High draw", corpus: 50_00_000, monthlyWithdrawal: 45000, annualReturnPercent: 10, years: 20 },
  ]);

  const scenarioResults = useMemo(() => compareSWPScenarios(scenarios), [scenarios]);
  const bestRemainingLabel = useMemo(
    () =>
      scenarioResults.reduce(
        (best, r) => (r.remainingValue > (best?.remainingValue ?? -Infinity) ? r : best),
        scenarioResults[0]
      )?.label,
    [scenarioResults]
  );

  const scenarioChartData = useMemo(() => {
    const maxY = Math.max(...scenarios.map((s) => s.years), 1);
    const rows: Record<string, number | null>[] = [];
    for (let year = 1; year <= maxY; year++) {
      const row: Record<string, number | null> = { year };
      scenarioResults.forEach((r) => {
        const point = r.yearlyBreakdown.find((b) => b.year === year);
        row[r.label] = point ? Math.round(point.valueAtYearEnd) : null;
      });
      rows.push(row);
    }
    return rows;
  }, [scenarios, scenarioResults]);

  const updateScenario = (idx: number, patch: Partial<SWPScenarioInput>) => {
    setScenarios((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const addScenario = () => {
    if (scenarios.length >= 5) return;
    setScenarios((prev) => [
      ...prev,
      {
        label: `Scenario ${prev.length + 1}`,
        corpus: 50_00_000,
        monthlyWithdrawal: 25000,
        annualReturnPercent: 10,
        years: 20,
      },
    ]);
  };
  const removeScenario = (idx: number) => {
    if (scenarios.length <= 1) return;
    setScenarios((prev) => prev.filter((_, i) => i !== idx));
  };

  const yearsLasted = swpResult.monthsLasted / 12;

  return (
    <div className="px-4 py-6 sm:p-6 space-y-8 max-w-7xl mx-auto">
      <FadeIn>
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 p-6 sm:p-8 text-white mb-8">
          <Sparkles className="absolute -right-4 -top-4 text-white/10" size={140} strokeWidth={1} />
          <div className="relative flex items-center gap-2 text-teal-100 font-semibold text-sm uppercase tracking-wider">
            <Wallet size={16} />
            <span>Planning Tools</span>
          </div>
          <h1 className="relative text-3xl sm:text-4xl font-bold tracking-tight mt-2 font-heading">
            SWP Calculator & Scenarios
          </h1>
          <p className="relative text-teal-100 max-w-2xl mt-2 text-sm sm:text-base">
            Model systematic withdrawals from a corpus — how long money lasts, what remains, and sustainable drawdowns.
            Assumed returns are not a promise.
          </p>
        </header>

        <Tabs defaultValue="swp" className="w-full max-w-full">
          <TabsList className="mb-6 h-auto min-h-10 w-full flex flex-wrap justify-start gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="swp" className="rounded-lg data-active:shadow-sm">
              <Wallet size={14} className="mr-1.5" />
              SWP Calculator
            </TabsTrigger>
            <TabsTrigger value="sustain" className="rounded-lg data-active:shadow-sm">
              <Target size={14} className="mr-1.5" />
              Sustainable Draw
            </TabsTrigger>
            <TabsTrigger value="scenario" className="rounded-lg data-active:shadow-sm">
              <GitCompare size={14} className="mr-1.5" />
              Scenario Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swp" className="w-full mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="surface-card border-none shadow-sm lg:col-span-5">
                <CardHeader>
                  <CardTitle className="text-base font-semibold font-heading">Inputs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <SliderField
                      label="Starting Corpus"
                      value={corpus}
                      onChange={setCorpus}
                      min={100000}
                      max={50000000}
                      step={50000}
                      formatValue={fmtCompact}
                    />
                    <PresetChips
                      options={[1000000, 2500000, 5000000, 10000000]}
                      value={corpus}
                      onSelect={setCorpus}
                      format={fmtCompact}
                    />
                  </div>
                  <div className="space-y-2">
                    <SliderField
                      label="Monthly Withdrawal"
                      value={monthlyWithdrawal}
                      onChange={setMonthlyWithdrawal}
                      suffix=" ₹"
                      min={1000}
                      max={500000}
                      step={1000}
                      formatValue={(v) => v.toLocaleString("en-IN")}
                    />
                    <PresetChips
                      options={[15000, 25000, 40000, 75000]}
                      value={monthlyWithdrawal}
                      onSelect={setMonthlyWithdrawal}
                      format={(v) => `₹${v / 1000}k`}
                    />
                  </div>
                  <SliderField
                    label="Expected Annual Return"
                    value={annualReturn}
                    onChange={setAnnualReturn}
                    suffix="%"
                    min={0}
                    max={20}
                    step={0.5}
                  />
                  <SliderField
                    label="Withdrawal Period"
                    value={years}
                    onChange={setYears}
                    suffix=" yrs"
                    min={1}
                    max={40}
                    step={1}
                  />
                  <div className="space-y-2 rounded-xl border border-teal-200/70 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20 p-3">
                    <SliderField
                      label="Annual Withdrawal Step-up"
                      value={stepUp}
                      onChange={setStepUp}
                      suffix="%"
                      min={0}
                      max={15}
                      step={1}
                    />
                    <PresetChips
                      options={[0, 3, 5, 10]}
                      value={stepUp}
                      onSelect={setStepUp}
                      format={(v) => (v === 0 ? "Flat" : `${v}%`)}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Step-up raises your SWP each year (e.g. to track inflation). Higher step-ups drain corpus faster.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-7 space-y-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-teal-600 to-teal-900 text-white overflow-hidden relative">
                  <CardContent className="p-6">
                    <p className="text-xs text-teal-100 uppercase font-bold tracking-wide">
                      {swpResult.depleted ? "Corpus lasts" : "Remaining corpus"}
                    </p>
                    {swpResult.depleted ? (
                      <p className="text-4xl sm:text-5xl font-bold mt-1 tracking-tight font-heading">
                        {yearsLasted < 1
                          ? `${swpResult.monthsLasted} mo`
                          : `${yearsLasted.toFixed(1)} yrs`}
                      </p>
                    ) : (
                      <p className="text-4xl sm:text-5xl font-bold mt-1 tracking-tight font-heading">
                        ₹
                        <AnimatedNumber
                          value={swpResult.remainingValue}
                          decimals={0}
                          format={(n) => {
                            if (n >= 10000000) return `${(n / 10000000).toFixed(2)}Cr`;
                            if (n >= 100000) return `${(n / 100000).toFixed(2)}L`;
                            return Math.round(n).toLocaleString("en-IN");
                          }}
                        />
                      </p>
                    )}
                    <p className="text-sm text-teal-100 mt-2">
                      {swpResult.depleted
                        ? `Money runs out before ${years} years at this withdrawal rate.`
                        : `After ${years} years of SWP at the assumed return.`}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <StatTile label="Total Withdrawn" value={fmtCurrency(swpResult.totalWithdrawn)} tone="good" />
                  <StatTile
                    label="Months of SWP"
                    value={`${swpResult.monthsLasted}`}
                    tone={swpResult.depleted ? "warn" : "default"}
                  />
                </div>

                {swpResult.depleted && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3 flex gap-2 text-xs text-amber-800 dark:text-amber-200">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p>
                      Corpus is exhausted after {swpResult.monthsLasted} months. Lower the withdrawal, raise assumed
                      return, or start with a larger corpus — or use the Sustainable Draw tab.
                    </p>
                  </div>
                )}

                <Card className="surface-card border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 font-heading">
                      Corpus & Withdrawals Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={swpResult.yearlyBreakdown}>
                        <defs>
                          <linearGradient id="swpWithdrawn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="swpCorpus" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#33415533" />
                        <XAxis
                          dataKey="year"
                          tickFormatter={(y) => `Yr ${y}`}
                          fontSize={11}
                          stroke="#94a3b8"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                          fontSize={11}
                          width={50}
                          stroke="#94a3b8"
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          labelFormatter={(y) => `Year ${y}`}
                          formatter={(value) => (typeof value === "number" ? fmtCurrency(value) : "")}
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            fontSize: 12,
                            background: "hsl(var(--card))",
                            color: "hsl(var(--card-foreground))",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Area
                          type="monotone"
                          dataKey="cumulativeWithdrawn"
                          name="Withdrawn"
                          stroke="#94a3b8"
                          fill="url(#swpWithdrawn)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="valueAtYearEnd"
                          name="Corpus left"
                          stroke="#0d9488"
                          fill="url(#swpCorpus)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sustain" className="w-full mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Your Horizon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <SliderField
                      label="Starting Corpus"
                      value={sustainCorpus}
                      onChange={setSustainCorpus}
                      min={100000}
                      max={50000000}
                      step={50000}
                      formatValue={fmtCompact}
                    />
                    <PresetChips
                      options={[1000000, 2500000, 5000000, 10000000]}
                      value={sustainCorpus}
                      onSelect={setSustainCorpus}
                      format={fmtCompact}
                    />
                  </div>
                  <SliderField
                    label="Expected Annual Return"
                    value={sustainReturn}
                    onChange={setSustainReturn}
                    suffix="%"
                    min={0}
                    max={20}
                    step={0.5}
                  />
                  <SliderField
                    label="Years of Withdrawals"
                    value={sustainYears}
                    onChange={setSustainYears}
                    suffix=" yrs"
                    min={1}
                    max={40}
                    step={1}
                  />
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-gradient-to-br from-teal-600 to-slate-800 text-white flex items-center overflow-hidden relative">
                <Target className="absolute -right-4 -bottom-4 text-white/10" size={140} strokeWidth={1} />
                <CardContent className="p-6 text-center w-full relative">
                  <p className="text-sm text-teal-100 font-medium">Max Flat Monthly SWP</p>
                  <p className="text-4xl sm:text-5xl font-bold mt-2 tracking-tight">
                    {fmtCurrency(maxMonthly)}
                  </p>
                  <p className="text-xs text-teal-100 mt-3">
                    Approximate flat withdrawal that exhausts {fmtCompact(sustainCorpus)} over {sustainYears}{" "}
                    years at {sustainReturn}% assumed annual return (corpus ~₹0 at the end).
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenario" className="w-full mt-0">
            <div className="space-y-6 w-full">
              <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Scenarios</CardTitle>
                  <button
                    type="button"
                    onClick={addScenario}
                    disabled={scenarios.length >= 5}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-800 disabled:text-slate-300 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add scenario
                  </button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scenarios.map((s, idx) => (
                    <div
                      key={idx}
                      className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: SCENARIO_COLORS[idx % SCENARIO_COLORS.length] }}
                          aria-hidden
                        />
                        <Input
                          value={s.label}
                          onChange={(e) => updateScenario(idx, { label: e.target.value })}
                          className="text-xs font-semibold flex-1 min-w-0"
                        />
                        <button
                          type="button"
                          onClick={() => removeScenario(idx)}
                          disabled={scenarios.length <= 1}
                          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40"
                          aria-label={`Remove ${s.label}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <NumberField
                          label="Corpus ₹"
                          value={s.corpus}
                          onChange={(v) => updateScenario(idx, { corpus: v })}
                          step={50000}
                        />
                        <NumberField
                          label="₹/month SWP"
                          value={s.monthlyWithdrawal}
                          onChange={(v) => updateScenario(idx, { monthlyWithdrawal: v })}
                          step={1000}
                        />
                        <NumberField
                          label="Return %"
                          value={s.annualReturnPercent}
                          onChange={(v) => updateScenario(idx, { annualReturnPercent: v })}
                          step={0.5}
                        />
                        <NumberField
                          label="Years"
                          value={s.years}
                          onChange={(v) => updateScenario(idx, { years: v })}
                          min={1}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="border-b border-slate-50 dark:border-slate-800">
                  <CardTitle className="text-base font-semibold">Comparison</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase">
                            Scenario
                          </th>
                          <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase text-right">
                            Withdrawn
                          </th>
                          <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase text-right">
                            Remaining
                          </th>
                          <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase text-right">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarioResults.map((r, i) => (
                          <tr key={r.label} className="border-b border-slate-50 dark:border-slate-800">
                            <td className="p-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                              <span className="flex items-center gap-2">
                                <span
                                  className="size-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: SCENARIO_COLORS[i % SCENARIO_COLORS.length],
                                  }}
                                  aria-hidden
                                />
                                {r.label}
                                {r.label === bestRemainingLabel && !r.depleted && (
                                  <Crown size={13} className="text-amber-500" aria-label="Highest remaining" />
                                )}
                              </span>
                            </td>
                            <td className="p-3 text-sm font-mono text-slate-600 dark:text-slate-300 text-right">
                              {fmtCurrency(r.totalWithdrawn)}
                            </td>
                            <td className="p-3 text-sm font-mono font-bold text-slate-900 dark:text-slate-50 text-right">
                              {fmtCurrency(r.remainingValue)}
                            </td>
                            <td className="p-3 text-sm text-right">
                              {r.depleted ? (
                                <span className="text-amber-600 dark:text-amber-400">
                                  Ends ~{r.monthsLasted} mo
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">Survives</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={scenarioChartData}>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e1e0d9" />
                        <XAxis
                          dataKey="year"
                          tickFormatter={(y) => `Yr ${y}`}
                          fontSize={11}
                          stroke="#898781"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                          fontSize={11}
                          width={50}
                          stroke="#898781"
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          labelFormatter={(y) => `Year ${y}`}
                          formatter={(value) => (typeof value === "number" ? fmtCurrency(value) : "")}
                          contentStyle={{ borderRadius: 8, border: "1px solid #e1e0d9", fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {scenarioResults.map((r, i) => (
                          <Line
                            key={r.label}
                            type="monotone"
                            dataKey={r.label}
                            stroke={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 flex items-start gap-3 mt-8">
          <TrendingDown className="text-amber-600 mt-0.5 shrink-0" size={18} />
          <p className="text-xs text-amber-700 dark:text-amber-200/90 leading-relaxed">
            SWP projections assume a constant annual return and regular monthly withdrawals. Markets vary; sequence of
            returns risk can exhaust a corpus faster than a smooth model. Use this for planning, not as a guarantee.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
