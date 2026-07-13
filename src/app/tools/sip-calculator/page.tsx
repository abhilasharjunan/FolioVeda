"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FadeIn } from '@/components/animations';
import { Calculator, Target, GitCompare, Plus, X, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  calculateSIPFutureValue,
  calculateRequiredMonthlySIP,
  compareScenarios,
  ScenarioInput,
} from '@/lib/sip-calculator';

function fmtCurrency(n: number): string {
  if (!isFinite(n)) return '₹0';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function NumberField({
  label, value, onChange, suffix, min = 0, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; step?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="relative">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="pr-12"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
}

const SCENARIO_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SIPCalculatorPage() {
  // --- SIP Calculator state ---
  const [monthlyAmount, setMonthlyAmount] = useState(10000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(15);
  const [stepUp, setStepUp] = useState(0);

  const sipResult = useMemo(
    () => calculateSIPFutureValue({ monthlyAmount, annualReturnPercent: annualReturn, years, stepUpPercent: stepUp }),
    [monthlyAmount, annualReturn, years, stepUp]
  );

  // --- Goal Planner state ---
  const [targetAmount, setTargetAmount] = useState(5000000);
  const [goalReturn, setGoalReturn] = useState(12);
  const [goalYears, setGoalYears] = useState(15);

  const requiredMonthly = useMemo(
    () => calculateRequiredMonthlySIP(targetAmount, goalReturn, goalYears),
    [targetAmount, goalReturn, goalYears]
  );

  // --- Scenario Comparison state ---
  const [scenarios, setScenarios] = useState<ScenarioInput[]>([
    { label: 'Conservative', monthlyAmount: 10000, annualReturnPercent: 8, years: 15 },
    { label: 'Moderate', monthlyAmount: 10000, annualReturnPercent: 12, years: 15 },
    { label: 'Aggressive', monthlyAmount: 10000, annualReturnPercent: 15, years: 15 },
  ]);

  const scenarioResults = useMemo(() => compareScenarios(scenarios), [scenarios]);

  const scenarioChartData = useMemo(() => {
    const maxYears = Math.max(...scenarios.map((s) => s.years), 1);
    const rows: Record<string, any>[] = [];
    for (let year = 1; year <= maxYears; year++) {
      const row: Record<string, any> = { year };
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
    setScenarios((prev) => [...prev, { label: `Scenario ${prev.length + 1}`, monthlyAmount: 10000, annualReturnPercent: 10, years: 15 }]);
  };
  const removeScenario = (idx: number) => {
    if (scenarios.length <= 1) return;
    setScenarios((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <FadeIn>
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
            <Calculator size={16} />
            <span>Planning Tools</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">SIP Calculator & Scenarios</h1>
          <p className="text-slate-500 max-w-2xl">
            Forward-looking projections based on assumed returns — not a promise of actual returns. Use these to plan, not predict.
          </p>
        </header>

        <Tabs defaultValue="sip" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="sip"><Calculator size={14} className="mr-1.5" />SIP Calculator</TabsTrigger>
            <TabsTrigger value="goal"><Target size={14} className="mr-1.5" />Goal Planner</TabsTrigger>
            <TabsTrigger value="scenario"><GitCompare size={14} className="mr-1.5" />Scenario Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="sip">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-white lg:col-span-1">
                <CardHeader><CardTitle className="text-base font-semibold">Inputs</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <NumberField label="Monthly Investment" value={monthlyAmount} onChange={setMonthlyAmount} suffix="₹" step={500} />
                  <NumberField label="Expected Annual Return" value={annualReturn} onChange={setAnnualReturn} suffix="%" step={0.5} />
                  <NumberField label="Investment Period" value={years} onChange={setYears} suffix="yrs" min={1} />
                  <NumberField label="Annual Step-up" value={stepUp} onChange={setStepUp} suffix="%" step={1} />
                  <p className="text-[10px] text-slate-400">Step-up increases your monthly SIP by this % every year — a common way to invest more as income grows.</p>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Invested</p>
                      <p className="text-lg font-bold text-slate-900">{fmtCurrency(sipResult.totalInvested)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Est. Gain</p>
                      <p className="text-lg font-bold text-emerald-600">{fmtCurrency(sipResult.totalGain)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-blue-100 uppercase font-bold">Future Value</p>
                      <p className="text-lg font-bold">{fmtCurrency(sipResult.futureValue)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-sm bg-white">
                  <CardHeader><CardTitle className="text-sm font-semibold text-slate-600">Growth Over Time</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={sipResult.yearlyBreakdown}>
                        <defs>
                          <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" tickFormatter={(y) => `Yr ${y}`} fontSize={11} />
                        <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} fontSize={11} width={50} />
                        <Tooltip labelFormatter={(y) => `Year ${y}`} />
                        <Legend />
                        <Area type="monotone" dataKey="cumulativeInvested" name="Invested" stroke="#94a3b8" fill="url(#colorInvested)" strokeWidth={2} />
                        <Area type="monotone" dataKey="valueAtYearEnd" name="Value" stroke="#2563eb" fill="url(#colorValue)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goal">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader><CardTitle className="text-base font-semibold">Your Goal</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <NumberField label="Target Corpus" value={targetAmount} onChange={setTargetAmount} suffix="₹" step={100000} />
                  <NumberField label="Expected Annual Return" value={goalReturn} onChange={setGoalReturn} suffix="%" step={0.5} />
                  <NumberField label="Time to Goal" value={goalYears} onChange={setGoalYears} suffix="yrs" min={1} />
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center">
                <CardContent className="p-6 text-center w-full">
                  <p className="text-sm text-blue-100 font-medium">Required Monthly SIP</p>
                  <p className="text-4xl font-bold mt-2">{fmtCurrency(requiredMonthly)}</p>
                  <p className="text-xs text-blue-100 mt-3">
                    to reach {fmtCurrency(targetAmount)} in {goalYears} years at {goalReturn}% assumed annual return.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenario">
            <div className="space-y-6">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Scenarios</CardTitle>
                  <button
                    onClick={addScenario}
                    disabled={scenarios.length >= 5}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-300 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add scenario
                  </button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scenarios.map((s, idx) => (
                    <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end p-3 bg-slate-50 rounded-lg">
                      <Input
                        value={s.label}
                        onChange={(e) => updateScenario(idx, { label: e.target.value })}
                        className="text-xs font-semibold"
                      />
                      <NumberField label="₹/month" value={s.monthlyAmount} onChange={(v) => updateScenario(idx, { monthlyAmount: v })} step={500} />
                      <NumberField label="Return %" value={s.annualReturnPercent} onChange={(v) => updateScenario(idx, { annualReturnPercent: v })} step={0.5} />
                      <NumberField label="Years" value={s.years} onChange={(v) => updateScenario(idx, { years: v })} min={1} />
                      <button
                        onClick={() => removeScenario(idx)}
                        disabled={scenarios.length <= 1}
                        className="h-9 flex items-center justify-center text-slate-400 hover:text-rose-500 disabled:text-slate-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50"><CardTitle className="text-base font-semibold">Comparison</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Scenario</th>
                          <th className="p-3 text-xs font-semibold text-slate-500 uppercase text-right">Invested</th>
                          <th className="p-3 text-xs font-semibold text-slate-500 uppercase text-right">Gain</th>
                          <th className="p-3 text-xs font-semibold text-slate-500 uppercase text-right">Future Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarioResults.map((r, i) => (
                          <tr key={r.label} className="border-b border-slate-50">
                            <td className="p-3 text-sm font-semibold" style={{ color: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}>{r.label}</td>
                            <td className="p-3 text-sm font-mono text-slate-600 text-right">{fmtCurrency(r.totalInvested)}</td>
                            <td className="p-3 text-sm font-mono text-emerald-600 text-right">{fmtCurrency(r.totalGain)}</td>
                            <td className="p-3 text-sm font-mono font-bold text-slate-900 text-right">{fmtCurrency(r.futureValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={scenarioChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" tickFormatter={(y) => `Yr ${y}`} fontSize={11} />
                        <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} fontSize={11} width={50} />
                        <Tooltip labelFormatter={(y) => `Year ${y}`} formatter={(value) => typeof value === "number" ? fmtCurrency(value) : ""} />
                        <Legend />
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

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
          <TrendingUp className="text-amber-600 mt-0.5 shrink-0" size={18} />
          <p className="text-xs text-amber-700 leading-relaxed">
            These projections assume a constant annual return, which real markets never deliver — actual returns vary year to year.
            Treat this as a planning tool for setting savings targets, not a forecast of what any fund will actually return.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

