import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { WithdrawalRequest } from '../types/index.ts';
import { Wallet, AlertTriangle, CheckCircle2, Clock, XCircle, ArrowRight, Building, Smartphone } from 'lucide-react';

export const WithdrawalPage: React.FC = () => {
  const { user, config, refreshUser, showToast } = useAuth();

  const [amount, setAmount] = useState<number>(500);
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>(user?.name || '');
  const [bankName, setBankName] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([]);

  const loadWithdrawals = async () => {
    try {
      const res = await api.transactions.getHistory();
      setWithdrawalsList(res.withdrawals);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (user) {
      loadWithdrawals();
    }
  }, [user]);

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      setErrorMsg('Please log in to submit a withdrawal request.');
      return;
    }

    const minWth = config?.minWithdrawal || 100;
    const maxWth = config?.maxWithdrawal || 25000;

    if (!amount || amount < minWth) {
      setErrorMsg(`Minimum withdrawal amount is ₹${minWth}.`);
      return;
    }

    if (amount > maxWth) {
      setErrorMsg(`Maximum withdrawal per request is ₹${maxWth}.`);
      return;
    }

    if (user.balance < amount) {
      setErrorMsg(`Insufficient balance. Your current balance is ₹${user.balance.toFixed(2)}.`);
      return;
    }

    if (payoutMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        setErrorMsg('Please enter a valid UPI ID (e.g. name@okhdfcbank).');
        return;
      }
    } else {
      if (!accountNumber || !ifscCode || !accountHolderName) {
        setErrorMsg('Please fill in Account Number, IFSC Code, and Account Holder Name.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await api.transactions.submitWithdrawal({
        amount,
        payoutMethod,
        upiId: payoutMethod === 'upi' ? upiId.trim() : undefined,
        accountNumber: payoutMethod === 'bank' ? accountNumber.trim() : undefined,
        ifscCode: payoutMethod === 'bank' ? ifscCode.trim().toUpperCase() : undefined,
        accountHolderName: payoutMethod === 'bank' ? accountHolderName.trim() : undefined,
        bankName: payoutMethod === 'bank' ? bankName.trim() : undefined,
      });

      setSuccessMsg(
        `Withdrawal request for ₹${amount} submitted successfully! Transaction Ref: ${res.withdrawal.transactionRef}. Status: PENDING review.`
      );
      showToast('Withdrawal submitted! Status: PENDING review.', 'info');
      await refreshUser();
      await loadWithdrawals();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      {/* Title Header */}
      <div className="bg-[#0f111a] border border-red-950/40 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-bold uppercase tracking-wider mb-1">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Withdrawal Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
              WITHDRAW BALANCE
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Request payout of your virtual funds via UPI transfer or direct bank NEFT/IMPS.
            </p>
          </div>

          <div className="bg-[#090a0f] border border-zinc-800 rounded-xl p-3 flex flex-col items-start sm:items-end">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Available for Payout</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              ₹{(user?.balance ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Withdrawal Form Card */}
      <div className="bg-[#0f111a] border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Amount field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Withdrawal Amount (₹)</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Available: ₹{(user?.balance ?? 0).toFixed(2)}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min={config?.minWithdrawal || 100}
                max={Math.min(config?.maxWithdrawal || 25000, user?.balance ?? 0)}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none transition"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              {[100, 500, 1000, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-mono transition cursor-pointer"
                >
                  ₹{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(Math.floor(user?.balance ?? 0))}
                className="px-2.5 py-1 bg-rose-950/60 border border-rose-800/40 text-rose-300 rounded text-xs font-semibold hover:bg-rose-900/60 transition cursor-pointer"
              >
                Max
              </button>
            </div>
          </div>

          {/* Payout Method Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Choose Payout Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayoutMethod('upi')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition cursor-pointer ${
                  payoutMethod === 'upi'
                    ? 'bg-rose-950/40 border-rose-500 text-white shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 text-rose-400" />
                <div className="text-left">
                  <div className="font-bold text-xs">UPI Transfer</div>
                  <div className="text-[10px] text-zinc-400">Direct to UPI handle</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('bank')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition cursor-pointer ${
                  payoutMethod === 'bank'
                    ? 'bg-rose-950/40 border-rose-500 text-white shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4 text-rose-400" />
                <div className="text-left">
                  <div className="font-bold text-xs">Bank Transfer</div>
                  <div className="text-[10px] text-zinc-400">NEFT / IMPS account</div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Method Inputs */}
          {payoutMethod === 'upi' ? (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Your UPI ID (VPA)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. mobile@okhdfcbank or user@paytm"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none transition"
                required
              />
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Full name as in bank passbook"
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India, HDFC"
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 5010049281729"
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="e.g. SBIN0001234"
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2 text-xs font-mono uppercase text-white focus:outline-none transition"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submission Notice */}
          <div className="p-3 bg-[#090a0f] border border-zinc-800 rounded-xl text-[11px] text-zinc-400 space-y-1">
            <span className="text-zinc-200 font-semibold block">Withdrawal Verification Policy:</span>
            <p>
              Requested amounts are immediately reserved from your available balance. Each request is verified by
              administration. If rejected, funds are automatically refunded to your virtual balance.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (user?.balance ?? 0) < (config?.minWithdrawal || 100)}
            className="w-full py-3 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-500/50 transition active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Processing Request...</span>
            ) : (
              <>
                <span>Submit Withdrawal Request</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Withdrawal Requests History */}
      {user && (
        <div className="bg-[#0f111a] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-base font-bold text-white">Withdrawal History</h3>
            <span className="text-xs text-zinc-400">{withdrawalsList.length} Records</span>
          </div>

          {withdrawalsList.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No withdrawal requests recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Reference / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {withdrawalsList.map((wth) => (
                    <tr key={wth.id} className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                        {new Date(wth.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                        ₹{wth.amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-zinc-300 whitespace-nowrap">
                        {wth.payoutMethod === 'upi' ? `UPI (${wth.payoutDetails.upiId})` : `Bank (${wth.payoutDetails.ifscCode})`}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {wth.status === 'successful' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3" /> SUCCESSFUL
                          </span>
                        ) : wth.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/50">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 text-xs">
                        {wth.status === 'successful'
                          ? `Processed: ${wth.transactionRef || 'NEFT Reference'}`
                          : wth.status === 'rejected'
                          ? `Declined: ${wth.rejectionReason} (Balance Refunded)`
                          : `Ref: ${wth.transactionRef} (Under administrative review)`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
