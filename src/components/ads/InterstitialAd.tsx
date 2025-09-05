"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  title?: string;
  description?: string;
}

const InterstitialAd: React.FC<InterstitialAdProps> = ({
  isOpen,
  onClose,
  onContinue,
  title = "Congratulations!",
  description = "Great job completing the game!",
}) => {
  useEffect(() => {
    if (isOpen) {
      // In production, this would load actual interstitial ads
      // For now, we'll simulate a 3-second ad display
      const timer = setTimeout(() => {
        // Auto-close after ad display
      }, 3000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Ad Space */}
        <div className="flex flex-col items-center justify-center py-8">
          {/* Development placeholder */}
          <div className="w-full max-w-sm h-64 bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📺</div>
              <div className="text-sm font-semibold text-gray-600 mb-1">
                Interstitial Advertisement
              </div>
              <div className="text-xs text-gray-500">
                This space would show video/display ads
              </div>
              <div className="text-xs text-gray-400 mt-2">
                AdSense Interstitial Unit
              </div>
            </div>
          </div>

          {/* In production, this would be the actual AdSense code */}
          {/*
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX"
            data-ad-slot="XXXXXXXXXX"
            data-ad-format="interstitial"
            data-full-width-responsive="true"
          />
          */}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onContinue && (
            <Button onClick={onContinue} className="bg-blue-600 hover:bg-blue-700">
              Play Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterstitialAd;