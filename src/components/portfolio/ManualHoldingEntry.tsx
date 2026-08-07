"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';

export default function ManualHoldingEntry({ onSuccess }: { onSuccess?: () => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ schemeName: string; schemeCode: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFund, setSelectedFund] = useState<{ schemeName: string; schemeCode: string } | null>(null);
  const [formData, setFormData] = useState({
    units: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Proxy through /api/funds/search — mfapi.in has no CORS headers, so calling
  // searchSchemes() directly from the browser fails in production.
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`);
          const results = await res.json();
          setSuggestions(Array.isArray(results) ? results : []);
        } catch (e) {
          console.error("Search failed", e);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFund = (fund: { schemeName: string; schemeCode: string }) => {
    setSelectedFund(fund);
    setQuery(fund.schemeName);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    if (!selectedFund?.schemeCode) {
      setMessage({ type: 'error', text: 'Please select a fund from the suggestions.' });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      schemeCode: String(selectedFund.schemeCode),
      units: formData.units,
      amount: formData.amount,
      date: formData.date,
      type: 'BUY',
    };

    try {
      const response = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error || `Request failed (${response.status})`);
      }

      setMessage({ type: 'success', text: 'Holding added successfully!' });
      toast.success('Holding added successfully');
      setFormData({ units: '', amount: '', date: new Date().toISOString().split('T')[0] });
      setSelectedFund(null);
      setQuery('');
      onSuccess?.();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="surface-card border-none shadow-sm max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-heading">Manual Fund Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Search Mutual Fund</label>
            <div className="relative">
              <Input
                placeholder="e.g. HDFC Index Fund..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedFund(null);
                }}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              {isLoading && <Loader2 className="absolute right-3 top-2.5 text-slate-400 animate-spin" size={18} />}
            </div>

            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {suggestions.map((fund) => (
                  <div
                    key={fund.schemeCode}
                    onClick={() => handleSelectFund(fund)}
                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900">{fund.schemeName}</p>
                    <p className="text-[10px] text-slate-500">Code: {fund.schemeCode}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Units</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.units}
                onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Amount (₹)</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' && <CheckCircle2 size={14} />}
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            disabled={!selectedFund || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
          >
            {isSubmitting ? 'Processing...' : 'Add to Holdings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
