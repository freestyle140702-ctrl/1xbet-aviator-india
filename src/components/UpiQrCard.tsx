import React, { useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import originalQrImage from '../assets/images/IMG_20261018_221509.jpg';

export interface UpiQrCardProps {
  upiId?: string;
  upiName?: string;
  amount?: number;
  qrImage?: string;
  qrImageSrc?: string;
  onCopySuccess?: (upiId: string) => void;
  className?: string;
}

export const UpiQrCard: React.FC<UpiQrCardProps> = ({
  upiId = '14dharmesh@fam',
  upiName = 'Dharmesh (FamPay)',
  amount = 500,
  qrImage: customQrImage,
  qrImageSrc,
  onCopySuccess,
  className = '',
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedMsg, setCopiedMsg] = useState<string>('');
  const activeQrSrc = customQrImage || qrImageSrc || originalQrImage || '/images/IMG_20261018_221509.jpg';

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = upiId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setCopiedMsg(`UPI ID "${upiId}" copied to clipboard!`);
    onCopySuccess?.(upiId);

    setTimeout(() => {
      setCopied(false);
      setCopiedMsg('');
    }, 3500);
  };

  return (
    <div
      className={`bg-[#0f111a] border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center shadow-xl select-none ${className}`}
    >
      {/* Top Heading */}
      <div className="w-full pb-3 border-b border-zinc-800/80 flex items-center justify-between">
        <span className="text-sm font-black text-white font-['Outfit'] tracking-wider uppercase flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          SCAN TO PAY
        </span>
        {amount > 0 && (
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            ₹{amount}
          </span>
        )}
      </div>

      {/* Clean White Display Area with Quiet Space for 100% Reliable Optical Scanning */}
      <div className="my-5 p-5 sm:p-6 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.12)] max-w-[280px] sm:max-w-[320px] w-full flex items-center justify-center">
        <img
          src={activeQrSrc}
          alt="Scan To Pay QR Code: 14dharmesh@fam"
          className="w-full h-auto aspect-square object-contain block mx-auto select-none"
          loading="eager"
        />
      </div>

      <p className="text-xs text-zinc-400 font-medium">
        Scan with any UPI app to transfer {amount > 0 ? `₹${amount}` : 'funds'}
      </p>

      {/* Supported Apps Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5 text-[11px] text-zinc-400">
        <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">PhonePe</span>
        <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">GPay</span>
        <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">Paytm</span>
        <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">FamPay</span>
        <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">BHIM</span>
      </div>

      {/* UPI ID Details & Working Copy Button */}
      <div className="mt-5 w-full bg-[#090a0f] border border-zinc-800/90 rounded-xl p-3.5 text-left space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
            UPI ID
          </span>
          <span className="text-[10px] text-rose-400 font-mono font-semibold">
            Verified Destination
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 bg-[#12141c] p-2 rounded-lg border border-zinc-800">
          <span className="font-mono text-sm sm:text-base text-white font-bold tracking-tight select-all">
            {upiId}
          </span>

          <button
            type="button"
            onClick={handleCopyUpi}
            className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs shrink-0 tracking-wider uppercase"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY UPI ID</span>
              </>
            )}
          </button>
        </div>

        {/* Clear Copy Confirmation Message */}
        {copiedMsg && (
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 pt-0.5 animate-fadeIn font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>{copiedMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpiQrCard;
