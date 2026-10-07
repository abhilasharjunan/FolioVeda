"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AnimatedNumber,
  ScaleIn,
  StaggerChildren,
  StaggerItem,
} from "@/components/animations";
import { Calculator, Target, GitCompare, Plus, X, TrendingUp, Crown } from "lucide-react";
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
import { useReducedMotion } from "framer-motion";
import {
  calculateSIPFutureValue,
  calculateRequiredMonthlySIP,
  compareScenarios,
  type ScenarioInput,
} from "@/lib/sip-calculator";
import {
  fmtCurrency,
  fmtCompact,
  formatAnimatedCurrency,
  SCENARIO_COLORS,
  NumberField,
  SliderField,
  PresetChips,
  StatTile,
} from "@/components/tools/calculator-fields";

export const SIP_TABS = ["sip", "goal", "scenario"] as const;
export type SipTab = (typeof SIP_TABS)[number];

export function isSipTab(v: string | null | undefined): v is SipTab {
  return !!v && (SIP_TABS as readonly string[]).includes(v);
}

type SipPanelProps = {
  tab: SipTab;
  onTabChange: (tab: SipTab) => void;
};

export function SipPanel({ tab, onTabChange }: SipPanelProps) {
  const reduceMotion = useReducedMotion();
  const chartDuration = reduceMotion ? 0 : 500;

  const [monthlyAmount, setMonthlyAmount] = useState(10000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(15);
  const [stepUp, setStepUp] = useState(0);

  const sipResult = useMemo(
    () =>
      calculateSIPFutureValue({
        monthlyAmount,
        annualReturnPercent: annualReturn,
        years,
        stepUpPercent: stepUp,
      }),
    [monthlyAmount, annualReturn, years, stepUp]
  );
  const growthMultiple =
    sipResult.totalInvested > 0 ? sipResult.futureValue / sipResult.totalInvested : 0;
  const favorable = sipResult.totalGain > 0;

  const [targetAmount, setTargetAmount] = useState(5000000);
  const [goalReturn, setGoalReturn] = useState(12);
  const [goalYears, setGoalYears] = useState(15);

  const requiredMonthly = useMemo(
    () => calculateRequiredMonthlySIP(targetAmount, goalReturn, goalYears),
    [targetAmount, goalReturn, goalYears]
  );

  const [scenarios, setScenarios] = useState<ScenarioInput[]>([
    { label: "Conservative", monthlyAmount: 10000, annualReturnPercent: 8, years: 15 },
    { label: "Moderate", monthlyAmount: 10000, annualReturnPercent: 12, years: 15 },
    { label: "Aggressive", monthlyAmount: 10000, annualReturnPercent: 15, years: 15 },
  ]);

  const scenarioResults = useMemo(() => compareScenarios(scenarios), [scenarios]);
  const bestScenarioLabel = useMemo(
    () =>
      scenarioResults.reduce(
        (best, r) => (r.futureValue > (best?.futureValue ?? -Infinity) ? r : best),
        scenarioResults[0]
      )?.label,
    [scenarioResults]
  );

  const scenarioChartData = useMemo(() => {
    const maxYears = Math.max(...scenarios.map((s) => s.years), 1);
    const rows: Record<string, number | null>[] = [];
    for (let year = 1; year <= maxYears; year++) {
      const row: Record<string, number | null> = { year };
      scenarioResults.forEach((r) => {
        const point = r.yearlyBreakdown.find((b) => b.year === year);
        row[r.label] = point ? Math.round(point.valueAtYearEnd) : null;
      });
      rows.push(row);
    }
    return rows;
  }, [scenarios, scenarioResults]);

  const updateScenario = (idx: number, patch: Partial<ScenarioInput>) => {
    setScenarios((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const addScenario = () => {
    if (scenarios.length >= 5) return;
    setScenarios((prev) => [
      ...prev,
      {
        label: `Scenario ${prev.length + 1}`,
        monthlyAmount: 10000,
        annualReturnPercent: 10,
        years: 15,
      },
    ]);
  };
  const removeScenario = (idx: number) => {
    if (scenarios.length <= 1) return;
    setScenarios((prev) => prev.filter((_, i) => i !== idx));
  };

  const flat = useMemo(
    () =>
      calculateSIPFutureValue({
        monthlyAmount,
        annualReturnPercent: annualReturn,
        years,
        stepUpPercent: 0,
      }),
    [monthlyAmount, annualReturn, years]
  );
  const compareStep = stepUp > 0 ? stepUp : 10;
  const stepped = useMemo(
    () =>
      calculateSIPFutureValue({
        monthlyAmount,
        annualReturnPercent: annualReturn,
        years,
        stepUpPercent: compareStep,
      }),
    [monthlyAmount, annualReturn, years, compareStep]
  );
  const delta = stepped.futureValue - flat.futureValue;

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        if (isSipTab(v)) onTabChange(v);
      }}
      className="w-full max-w-full"
    >
      <TabsList className="mb-6 h-auto min-h-10 w-full flex flex-wrap justify-start gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
        <TabsTrigger value="sip" className="rounded-lg data-active:shadow-sm">
          <Calculator size={14} className="mr-1.5" />
          SIP Calculator
        </TabsTrigger>
        <TabsTrigger value="goal" className="rounded-lg data-active:shadow-sm">
          <Target size={14} className="mr-1.5" />
          Goal Planner
        </TabsTrigger>
        <TabsTrigger value="scenario" className="rounded-lg data-active:shadow-sm">
          <GitCompare size={14} className="mr-1.5" />
          Scenario Comparison
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sip" className="w-full mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="surface-card border-none shadow-sm lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-base font-semibold font-heading">Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <SliderField
                  label="Monthly Investment"
                  value={monthlyAmount}
                  onChange={setMonthlyAmount}
                  suffix=" ₹"
                  min={500}
                  max={100000}
                  step={500}
                  formatValue={(v) => v.toLocaleString("en-IN")}
                />
                <PresetChips
                  options={[5000, 10000, 25000, 50000]}
                  value={monthlyAmount}
                  onSelect={setMonthlyAmount}
                  format={(v) => `₹${v / 1000}k`}
                  accent="teal"
                />
              </div>
              <SliderField
                label="Expected Annual Return"
                value={annualReturn}
                onChange={setAnnualReturn}
                suffix="%"
                min={1}
                max={30}
                step={0.5}
              />
              <SliderField
                label="Investment Period"
                value={years}
                onChange={setYears}
                suffix=" yrs"
                min={1}
                max={40}
                step={1}
              />
              <div className="space-y-2 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                <SliderField
                  label="Annual Step-up"
                  value={stepUp}
                  onChange={setStepUp}
                  suffix="%"
                  min={0}
                  max={25}
                  step={1}
                />
                <PresetChips
                  options={[0, 5, 10, 15]}
                  value={stepUp}
                  onSelect={setStepUp}
                  format={(v) => (v === 0 ? "Flat" : `${v}%`)}
                  accent="teal"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Step-up raises your SIP each year — try 10% to see the compounding lift vs a flat SIP.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-7 space-y-6">
            <ScaleIn>
              <Card
                className={`border-none shadow-md bg-gradient-to-br from-teal-600 to-teal-800 text-white overflow-hidden relative ${
                  favorable ? "ring-2 ring-emerald-400/40" : ""
                }`}
              >
                <CardContent className="p-6">
                  <p className="text-xs text-teal-100 uppercase font-bold tracking-wide">
                    Future Value
                  </p>
                  <p className="text-4xl sm:text-5xl font-bold mt-1 tracking-tight font-heading">
                    ₹
                    <AnimatedNumber
                      value={sipResult.futureValue}
                      decimals={0}
                      format={formatAnimatedCurrency}
                    />
                  </p>
                  {growthMultiple > 0 && (
                    <p className="text-sm text-teal-100 mt-2">
                      That&apos;s{" "}
                      <span className="font-semibold text-white">{growthMultiple.toFixed(1)}×</span>{" "}
                      your total contribution over {years} {years === 1 ? "year" : "years"}
                    </p>
                  )}
                  {favorable && (
                    <p className="text-xs text-emerald-200 mt-2 font-medium">
                      On track — your projected gain looks healthy for this horizon.
                    </p>
                  )}
                </CardContent>
              </Card>
            </ScaleIn>

            <StaggerChildren className="grid grid-cols-2 gap-4" stagger={0.05}>
              <StaggerItem>
                <StatTile label="Total Invested" value={fmtCurrency(sipResult.totalInvested)} />
              </StaggerItem>
              <StaggerItem>
                <StatTile
                  label="Estimated Gain"
                  value={fmtCurrency(sipResult.totalGain)}
                  tone="good"
                />
              </StaggerItem>
            </StaggerChildren>

            <Card className="surface-card border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50">
                  Flat SIP vs {compareStep}% Step-up
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                  <p className="text-[10px] uppercase font-bold tracking-wide text-slate-500 dark:text-slate-400">
                    Flat SIP
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-1 tabular-nums">
                    {fmtCompact(flat.futureValue)}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
                  <p className="text-[10px] uppercase font-bold tracking-wide text-emerald-700 dark:text-emerald-400">
                    {compareStep}% Step-up
                  </p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">
                    {fmtCompact(stepped.futureValue)}
                  </p>
                </div>
                <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3">
                  <p className="text-[10px] uppercase font-bold tracking-wide text-teal-700 dark:text-teal-300">
                    Extra corpus
                  </p>
                  <p className="text-lg font-bold text-teal-700 dark:text-teal-300 mt-1 tabular-nums">
                    +{fmtCompact(delta)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 font-heading">
                  Growth Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={sipResult.yearlyBreakdown}>
                    <defs>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.18} />
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
                      dataKey="cumulativeInvested"
                      name="Invested"
                      stroke="#94a3b8"
                      fill="url(#colorInvested)"
                      strokeWidth={2}
                      isAnimationActive={!reduceMotion}
                      animationDuration={chartDuration}
                    />
                    <Area
                      type="monotone"
                      dataKey="valueAtYearEnd"
                      name="Value"
                      stroke="#0d9488"
                      fill="url(#colorValue)"
                      strokeWidth={2}
                      isAnimationActive={!reduceMotion}
                      animationDuration={chartDuration}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="goal" className="w-full mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Your Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <SliderField
                  label="Target Corpus"
                  value={targetAmount}
                  onChange={setTargetAmount}
                  min={100000}
                  max={100000000}
                  step={100000}
                  formatValue={fmtCompact}
                />
                <PresetChips
                  options={[1000000, 2500000, 5000000, 10000000, 20000000]}
                  value={targetAmount}
                  onSelect={setTargetAmount}
                  format={fmtCompact}
                  accent="teal"
                />
              </div>
              <SliderField
                label="Expected Annual Return"
                value={goalReturn}
                onChange={setGoalReturn}
                suffix="%"
                min={1}
                max={30}
                step={0.5}
              />
              <SliderField
                label="Time to Goal"
                value={goalYears}
                onChange={setGoalYears}
                suffix=" yrs"
                min={1}
                max={40}
                step={1}
              />
            </CardContent>
          </Card>
          <ScaleIn>
            <Card className="border-none shadow-md bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center overflow-hidden relative h-full ring-2 ring-emerald-400/30">
              <Target className="absolute -right-4 -bottom-4 text-white/10" size={140} strokeWidth={1} />
              <CardContent className="p-6 text-center w-full relative">
                <p className="text-sm text-blue-100 font-medium">Required Monthly SIP</p>
                <p className="text-4xl sm:text-5xl font-bold mt-2 tracking-tight">
                  ₹
                  <AnimatedNumber
                    value={requiredMonthly}
                    decimals={0}
                    format={(n) => Math.round(n).toLocaleString("en-IN")}
                  />
                </p>
                <p className="text-xs text-blue-100 mt-3">
                  to reach {fmtCompact(targetAmount)} in {goalYears} years at {goalReturn}% assumed
                  annual return.
                </p>
                <p className="text-xs text-emerald-200 mt-2 font-medium">
                  A clear monthly target — you&apos;re one step closer to the goal.
                </p>
              </CardContent>
            </Card>
          </ScaleIn>
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
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-300 flex items-center gap-1"
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
                      className="size-10 shrink-0 flex items-center justify-center rounded-lg text-rose-600/80 hover:text-rose-700 dark:text-rose-400/80 dark:hover:text-rose-300 disabled:opacity-40"
                      aria-label={`Remove ${s.label}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <NumberField
                      label="₹/month"
                      value={s.monthlyAmount}
                      onChange={(v) => updateScenario(idx, { monthlyAmount: v })}
                      step={500}
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
                        Invested
                      </th>
                      <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase text-right">
                        Gain
                      </th>
                      <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase text-right">
                        Future Value
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
                            {r.label === bestScenarioLabel && (
                              <Crown size={13} className="text-amber-500" aria-label="Best future value" />
                            )}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-mono text-slate-600 dark:text-slate-300 text-right">
                          {fmtCurrency(r.totalInvested)}
                        </td>
                        <td className="p-3 text-sm font-mono text-emerald-600 text-right">
                          {fmtCurrency(r.totalGain)}
                        </td>
                        <td className="p-3 text-sm font-mono font-bold text-slate-900 dark:text-slate-50 text-right">
                          {fmtCurrency(r.futureValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={scenarioChartData}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e2e8f0" />
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
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
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
                        isAnimationActive={!reduceMotion}
                        animationDuration={chartDuration}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 flex items-start gap-3 mt-8">
        <TrendingUp className="text-amber-600 mt-0.5 shrink-0" size={18} />
        <p className="text-xs text-amber-700 dark:text-amber-200/90 leading-relaxed">
          These projections assume a constant annual return, which real markets never deliver — actual
          returns vary year to year. Treat this as a planning tool for setting savings targets, not a
          forecast of what any fund will actually return.
        </p>
      </div>
    </Tabs>
  );
}
