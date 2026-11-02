import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { DepositRequest } from '../types/index.ts';
import { QrCode, Copy, Check, Clock, AlertTriangle, ShieldCheck, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import originalQrCode from '../assets/images/IMG_20261018_221509.jpg';
import { UpiQrCard } from '../components/UpiQrCard.tsx';

const OFFICIAL_UPI_ID = '14dharmesh@fam';

export const DepositPage: React.FC = () => {
  const { user, config, refreshUser, showToast } = useAuth();

  const [amount, setAmount] = useState<number>(500);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedFeedbackMsg, setCopiedFeedbackMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [depositsList, setDepositsList] = useState<DepositRequest[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<string>('');

  const displayedUpiId = OFFICIAL_UPI_ID;

  // Load user's recent deposits
  const loadDeposits = async () => {
    try {
      const res = await api.transactions.getHistory();
      setDepositsList(res.deposits);
    } catch {
      // Ignore if not logged in
    }
  };

  useEffect(() => {
    if (user) {
      loadDeposits();
    }
  }, [user]);

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(displayedUpiId);
      setCopiedUpi(true);
      setCopiedFeedbackMsg(`UPI ID "${displayedUpiId}" copied to clipboard!`);
      showToast(`UPI ID ${displayedUpiId} copied to clipboard!`, 'success');
      setTimeout(() => {
        setCopiedUpi(false);
        setCopiedFeedbackMsg('');
      }, 3500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = displayedUpiId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedUpi(true);
      setCopiedFeedbackMsg(`UPI ID "${displayedUpiId}" copied to clipboard!`);
      showToast(`UPI ID ${displayedUpiId} copied to clipboard!`, 'success');
      setTimeout(() => {
        setCopiedUpi(false);
        setCopiedFeedbackMsg('');
      }, 3500);
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfo('');

    if (!user) {
      setErrorMsg('Please log in or create an account to submit a deposit request.');
      return;
    }

    const minDep = config?.minDeposit || 100;
    const maxDep = config?.maxDeposit || 50000;

    if (!amount || isNaN(amount) || amount < minDep) {
      setErrorMsg(`Minimum deposit amount is ₹${minDep}.`);
      return;
    }

    if (amount > maxDep) {
      setErrorMsg(`Maximum deposit amount cannot exceed ₹${maxDep}.`);
      return;
    }

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      setErrorMsg('Please enter a valid 12-digit UPI Transaction Reference (UTR) number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.transactions.submitDeposit({
        amount,
        utrNumber: cleanUtr,
      });

      setSuccessInfo(
        `Payment reference submitted! Reference: ${res.deposit.utrNumber} for ₹${amount}. Status: PENDING review by administrator.`
      );
      setUtrNumber('');
      showToast('Payment reference recorded! Status: PENDING verification.', 'info');
      await loadDeposits();
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit payment reference.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetAmounts = [100, 300, 500, 1000, 2000, 5000];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      {/* Title Header */}
      <div className="bg-[#0f111a] border border-red-950/40 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-bold uppercase tracking-wider mb-1">
              <QrCode className="w-4 h-4 text-rose-500" />
              <span>UPI Payment Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
              DEPOSIT VIRTUAL CREDITS
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Scan the official payment QR code using Google Pay, PhonePe, Paytm, or any UPI app, then submit your transaction reference.
            </p>
          </div>

          <div className="bg-[#090a0f] border border-zinc-800 rounded-xl p-3 flex flex-col items-start sm:items-end">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Current Balance</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              ₹{(user?.balance ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Payment Section: Center QR Code and Payment Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Center QR Code Showcase using UpiQrCard */}
        <div className="md:col-span-6">
          <UpiQrCard
            upiId={displayedUpiId}
            amount={amount}
            onCopySuccess={(id) => {
              showToast(`UPI ID ${id} copied to clipboard!`, 'success');
            }}
          />
        </div>

        {/* Right: Payment Reference Submission Form */}
        <div className="md:col-span-6 space-y-5">
          <form
            onSubmit={handleSubmitDeposit}
            className="bg-[#0f111a] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Step 2: Enter Payment Reference</span>
            </h3>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successInfo && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successInfo}</span>
              </div>
            )}

            {/* Amount Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Deposit Amount (₹)
              </label>

              {/* Preset Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {presetAmounts.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-lg text-xs font-mono font-bold transition border ${
                      amount === val
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    } cursor-pointer`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              {/* Custom Amount Field */}
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={config?.minDeposit || 100}
                  max={config?.maxDeposit || 50000}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  placeholder="Enter amount"
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none transition"
                  required
                />
              </div>
              <span className="text-[11px] text-zinc-400">
                Min: ₹{config?.minDeposit || 100} · Max: ₹{config?.maxDeposit || 50000}
              </span>
            </div>

            {/* 12-Digit UTR Reference Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>12-Digit UPI Transaction Ref / UTR</span>
                <span className="text-[11px] text-rose-400 font-normal">Required</span>
              </label>
              <input
                type="text"
                maxLength={24}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 428938174920"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none transition uppercase"
                required
              />
              <p className="text-[11px] text-zinc-400 leading-tight">
                Enter the 12-digit UTR/Ref number from your UPI app completed payment receipt.
              </p>
            </div>

            {/* Strict Payment Verification Notice */}
            <div className="bg-[#090a0f] border border-zinc-800/80 rounded-xl p-3.5 text-[11px] text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Genuine Verification Policy</span>
              </div>
              <p className="leading-relaxed">
                Submitting a transaction reference registers your payment with status <strong>PENDING</strong>.
                Payments are verified manually by system administrators against official banking records.
                A UTR entry or button click is never treated as automatic proof of payment.
              </p>
            </div>

            {/* Submit Payment Reference Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-500/50 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Verifying and Submitting...</span>
              ) : (
                <>
                  <span>Submit Payment Reference</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Payment Steps Guide */}
          <div className="bg-[#0f111a] border border-zinc-800/80 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How To Complete Payment</span>
            </h4>
            <ol className="space-y-2 text-xs text-zinc-400 list-decimal list-inside leading-relaxed">
              <li>Scan the <strong>SCAN TO PAY</strong> QR code with PhonePe, GPay, Paytm, or FamPay.</li>
              <li>Or transfer directly to UPI ID: <strong className="text-white font-mono">{displayedUpiId}</strong>.</li>
              <li>Enter payment amount: <strong className="text-white font-mono">₹{amount}</strong> and complete the transaction.</li>
              <li>Copy the 12-digit UTR/Reference number from your transaction details.</li>
              <li>Enter the UTR in the form and click <strong>Submit Payment Reference</strong>.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* User Deposit Requests History Table */}
      {user && (
        <div className="bg-[#0f111a] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-base font-bold text-white">Your Deposit Requests History</h3>
            <span className="text-xs text-zinc-400">{depositsList.length} Requests</span>
          </div>

          {depositsList.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No deposit requests recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">UTR Reference</th>
                    <th className="py-2.5 px-3">Destination UPI</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {depositsList.map((dep) => (
                    <tr key={dep.id} className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                        {new Date(dep.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                        ₹{dep.amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300 whitespace-nowrap">
                        {dep.utrNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap text-[11px]">
                        {dep.upiId || displayedUpiId}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {dep.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                          </span>
                        ) : dep.status === 'rejected' ? (
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
                        {dep.status === 'verified'
                          ? `Credited by Admin (${dep.verifiedBy || 'System'})`
                          : dep.rejectionReason || 'Awaiting administrator verification'}
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
