"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  units: number;
  date: string;
  createdAt: string;
}

interface Holding {
  id: string;
  schemeCode: string;
  units: number;
  transactions: Transaction[];
}

export default function HoldingsList() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [schemeMeta, setSchemeMeta] = useState<Record<string, { name: string; nav: number }>>({});
  const [showTxForm, setShowTxForm] = useState<string | null>(null);
  const [txType, setTxType] = useState<'BUY' | 'SELL'>('BUY');
  const [txUnits, setTxUnits] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchHoldings = async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) { setHoldings([]); return; }
      const data = await res.json();
      const h = (data?.holdings || []).map((x: any) => ({
        ...x,
        units: Number(x.units),
        transactions: (x.transactions || []).map((t: any) => ({ ...t, amount: Number(t.amount), units: Number(t.units) })),
      }));
      setHoldings(h);

      const codes = [...new Set(h.map((x: Holding) => x.schemeCode))] as string[];
      if (codes.length > 0) {
        const schemes = await fetch(`/api/schemes?codes=${codes.join(',')}`).then(r => r.json());
        const map: Record<string, { name: string; nav: number }> = {};
        (schemes || []).forEach((s: any) => { map[s.schemeCode] = { name: s.schemeName, nav: Number(s.latestNav) }; });
        setSchemeMeta(map);
      }
    } catch { setHoldings([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchHoldings(); }, []);

  const handleDelete = async (holdingId: string) => {
    if (!confirm('Delete this holding and all its transactions?')) return;
    await fetch(`/api/portfolio/holdings/${holdingId}`, { method: 'DELETE' });
    fetchHoldings();
  };

  const openTxForm = (id: string) => {
    setShowTxForm(id);
    setTxType('BUY');
    setTxUnits('');
    setTxAmount('');
    setTxDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddTx = async (holding: Holding) => {
    try {
      setSubmitting(holding.id);
      const res = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeCode: holding.schemeCode,
          units: txUnits,
          amount: txAmount,
          date: txDate,
          type: txType,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        try { const j = JSON.parse(err); alert(j.error || 'Failed'); } catch { alert(err); }
        return;
      }

      setShowTxForm(null);
      fetchHoldings();
    } catch {
      alert('Failed to add transaction');
    } finally {
      setSubmitting(null);
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.units * (schemeMeta[h.schemeCode]?.nav || 0), 0);
  const totalInvested = holdings.reduce((sum, h) =>
    sum + h.transactions.reduce((s, t) => s + (t.type === 'BUY' ? t.amount : -t.amount), 0), 0);

  if (loading) {
    return (
      <Card className="border-none shadow-sm bg-white max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <Loader2 className="animate-spin" size={22} />
          <span className="text-sm font-medium">Loading holdings…</span>
        </CardContent>
      </Card>
    );
  }
  if (holdings.length === 0) return null;

  return (
    <Card className="border-none shadow-sm bg-white max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Your Holdings ({holdings.length})</CardTitle>
        <div className="flex gap-6 text-sm text-slate-500">
          <span>Invested: <strong className="text-slate-800">₹{totalInvested.toLocaleString('en-IN')}</strong></span>
          <span>Current: <strong className="text-slate-800">₹{totalValue.toLocaleString('en-IN')}</strong></span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {holdings.map((h) => {
          const meta = schemeMeta[h.schemeCode] || { name: 'Unknown Fund', nav: 0 };
          const invested = h.transactions.reduce((s, t) => s + (t.type === 'BUY' ? t.amount : -t.amount), 0);
          const isOpen = expanded === h.id;
          const isFormOpen = showTxForm === h.id;

          return (
            <div key={h.id} className="border border-slate-100 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{meta.name}</p>
                  <p className="text-xs text-slate-400">{h.units.toFixed(4)} units · ₹{invested.toLocaleString('en-IN')} invested</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="xs" variant="ghost" onClick={() => setExpanded(isOpen ? null : h.id)}>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => handleDelete(h.id)}>
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="px-3 pb-3 border-t border-slate-50 pt-2 space-y-3">
                  <p className="text-xs font-medium text-slate-500">Transactions ({h.transactions.length})</p>
                  {h.transactions.length === 0 && <p className="text-xs text-slate-400">No transactions yet</p>}
                  {h.transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1 px-1 rounded hover:bg-slate-50 group">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-500 shrink-0">{new Date(t.date).toLocaleDateString('en-IN')}</span>
                        <span className={t.type === 'BUY' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {t.type === 'BUY' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-400">({t.units} units)</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Delete this transaction? Units will be adjusted.')) return;
                          await fetch(`/api/portfolio/transactions/${t.id}`, { method: 'DELETE' });
                          fetchHoldings();
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        title="Delete transaction"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-100">
                    {!isFormOpen ? (
                      <Button size="xs" variant="outline" onClick={() => openTxForm(h.id)}>
                        <Plus size={12} className="mr-1" /> Add Transaction
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button size="xs" variant={txType === 'BUY' ? 'default' : 'outline'} onClick={() => setTxType('BUY')}>Buy</Button>
                          <Button size="xs" variant={txType === 'SELL' ? 'default' : 'outline'} onClick={() => setTxType('SELL')}>Sell</Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input placeholder="Units" value={txUnits} onChange={e => setTxUnits(e.target.value)} />
                          <Input placeholder="Amount" value={txAmount} onChange={e => setTxAmount(e.target.value)} />
                          <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="xs" disabled={submitting === h.id || !txUnits || !txAmount} onClick={() => handleAddTx(h)}>
                            {submitting === h.id ? <Loader2 size={12} className="animate-spin" /> : 'Submit'}
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setShowTxForm(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
