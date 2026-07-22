"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Barcode, X } from "lucide-react";
import type { FoodSearchResult } from "@/lib/food/open-food-facts";

// Minimal typing for the browser-native Barcode Detection API (Chrome/Edge/
// Android). Not in TS lib yet, and absent on iOS Safari — we feature-detect
// and fall back to manual search there.
type DetectedBarcode = { rawValue: string };
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike;
}

export function FoodSearchPanel({ onSelect }: { onSelect: (r: FoodSearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setNote(null);
    setResults([]);
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const r = (data?.results ?? []) as FoodSearchResult[];
      if (r.length === 0) setNote("No matches — try a different name, or log it manually.");
      setResults(r);
    } catch {
      setNote("Search failed — check your connection.");
    } finally {
      setSearching(false);
    }
  }

  function stopScan() {
    if (scanLoopRef.current != null) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function lookupBarcode(code: string) {
    stopScan();
    setSearching(true);
    setNote(null);
    try {
      const res = await fetch(`/api/food-search/barcode?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data?.result) {
        onSelect(data.result as FoodSearchResult);
      } else {
        setNote(`No product found for barcode ${code}. Try searching by name.`);
      }
    } catch {
      setNote("Barcode lookup failed — try searching by name.");
    } finally {
      setSearching(false);
    }
  }

  async function startScan() {
    const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!Ctor) {
      setNote("Barcode scanning isn't supported on this browser — search by name instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
      const detector = new Ctor({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });

      // Wait for the video element to mount, then attach the stream.
      setTimeout(async () => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});

        const tick = async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              await lookupBarcode(codes[0].rawValue);
              return;
            }
          } catch {
            // transient detect error — keep looping
          }
          scanLoopRef.current = requestAnimationFrame(tick);
        };
        scanLoopRef.current = requestAnimationFrame(tick);
      }, 50);
    } catch {
      setNote("Couldn't access the camera — search by name instead.");
      setScanning(false);
    }
  }

  useEffect(() => stopScan, []);

  return (
    <div>
      <div className="flex gap-2">
        <Input
          placeholder="Search foods (e.g. banana, Greek yogurt)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runSearch())}
        />
        <Button type="button" variant="secondary" disabled={searching || !query.trim()} onClick={runSearch}>
          <Search size={14} />
        </Button>
        <Button type="button" variant="secondary" disabled={searching} onClick={startScan} title="Scan barcode">
          <Barcode size={14} />
        </Button>
      </div>

      {scanning && (
        <div className="relative mt-2 overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="w-full" playsInline muted />
          <button
            type="button"
            onClick={stopScan}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
          >
            <X size={14} />
          </button>
          <p className="bg-surface px-2 py-1 text-center text-xs text-subtle">Point at a barcode…</p>
        </div>
      )}

      {note && <p className="mt-2 text-xs text-subtle">{note}</p>}

      {results.length > 0 && (
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={`${r.name}-${i}`}
              type="button"
              onClick={() => onSelect(r)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-sm transition-colors hover:border-accent"
            >
              <span className="min-w-0">
                <span className="block truncate text-foreground">
                  {r.name}
                  {r.brand && <span className="text-subtle"> · {r.brand}</span>}
                </span>
                <span className="text-xs text-subtle">
                  per {r.basis === "serving" ? r.servingSize : "100 g"}
                </span>
              </span>
              <span className="shrink-0 pl-2 text-xs text-subtle">{r.calories} kcal</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
