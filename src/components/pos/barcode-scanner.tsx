"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const detectorRef = useRef<unknown>(null);
  const lastCodeRef = useRef("");
  const lastTimeRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const scan = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) return;
    try {
      const results = await (detectorRef.current as {
        detect(v: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
      }).detect(videoRef.current);
      if (results.length > 0) {
        const code = results[0].rawValue;
        const now = Date.now();
        if (code !== lastCodeRef.current || now - lastTimeRef.current > 2500) {
          lastCodeRef.current = code;
          lastTimeRef.current = now;
          onScan(code);
        }
      }
    } catch {
      // detector may fail on partial frames — ignore
    }
    rafRef.current = requestAnimationFrame(scan);
  }, [onScan]);

  useEffect(() => {
    if (!("BarcodeDetector" in window)) {
      setError("Camera barcode scanning is not supported on this browser. Use manual entry below.");
      return;
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        detectorRef.current = new (window as unknown as { BarcodeDetector: new(o: object) => unknown }).BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"],
        });
        setReady(true);
        rafRef.current = requestAnimationFrame(scan);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("allowed") || msg.toLowerCase().includes("denied")) {
          setError("Camera permission denied. Enable camera access in your browser settings.");
        } else {
          setError("Could not open camera. Use manual entry below.");
        }
      }
    }

    start();

    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [scan]);

  function submitManual() {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    onScan(code);
    setManualCode("");
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe py-3 shrink-0 bg-black/80">
        <div>
          <p className="text-white font-bold text-sm">Scan Product</p>
          <p className="text-white/50 text-xs">Point camera at barcode or QR code</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Camera feed */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video
          ref={videoRef}
          className={ready ? "absolute inset-0 h-full w-full object-cover" : "hidden"}
          playsInline
          muted
          autoPlay
        />

        {/* Scan frame overlay */}
        {ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 w-72 h-40">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 h-8 w-8 border-t-[3px] border-l-[3px] border-orange-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 h-8 w-8 border-t-[3px] border-r-[3px] border-orange-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-orange-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-orange-400 rounded-br-lg" />
              {/* Animated scan line */}
              <div
                className="absolute left-2 right-2 h-0.5 bg-orange-400/80"
                style={{ animation: "scan-line 2s ease-in-out infinite", top: "50%" }}
              />
            </div>
            <p className="absolute bottom-24 text-white/60 text-xs">Align barcode within the frame</p>
          </div>
        )}

        {/* No camera / error state */}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="h-12 w-12 text-white/20 animate-pulse" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center gap-3">
            <Camera className="h-12 w-12 text-white/20" />
            <p className="text-white/60 text-sm leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      {/* Manual entry */}
      <div className="shrink-0 px-4 py-4 bg-zinc-900 border-t border-white/10">
        <p className="text-white/50 text-xs mb-2 font-medium">Or enter product SKU manually:</p>
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            placeholder="e.g. CC-330-REG or LM-PC-ORI"
            autoCapitalize="characters"
            spellCheck={false}
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={submitManual}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-4 text-sm font-bold transition-all"
          >
            Add
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0%, 100% { transform: translateY(-32px); opacity: 0.5; }
          50% { transform: translateY(32px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
