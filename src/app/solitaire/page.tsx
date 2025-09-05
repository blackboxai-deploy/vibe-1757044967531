"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GameCard from "@/components/game/Card";
import BannerAd from "@/components/ads/BannerAd";
import InterstitialAd from "@/components/ads/InterstitialAd";
import { useGame } from "@/components/providers/GameProvider";
import { Card, createDeck, shuffleDeck, isValidSolitaireSequence, canPlaceOnFoundation, areOppositeColors, isRankOneLess } from "@/lib/cardTypes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SolitaireState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];  // 4 foundation piles
  tableau: Card[][];     // 7 tableau columns
  selectedCards: Card[];
  selectedPile: string | null;
  moves: number;
  score: number;
  gameWon: boolean;
  startTime: number;
}

const initialSolitaireState = (): SolitaireState => {
  const deck = shuffleDeck(createDeck());
  
  // Deal cards to tableau
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let deckIndex = 0;
  
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[deckIndex++];
      card.faceUp = row === col; // Only top card is face up
      tableau[col].push(card);
    }
  }
  
  // Remaining cards go to stock
  const stock = deck.slice(deckIndex).map(card => ({ ...card, faceUp: false }));
  
  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    selectedCards: [],
    selectedPile: null,
    moves: 0,
    score: 0,
    gameWon: false,
    startTime: Date.now(),
  };
};

export default function SolitairePage() {
  const { dispatch } = useGame();
  const router = useRouter();
  const [solitaire, setSolitaire] = useState<SolitaireState>(initialSolitaireState);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [gameTime, setGameTime] = useState(0);

  // Timer effect
  useEffect(() => {
    if (!solitaire.gameWon) {
      const timer = setInterval(() => {
        setGameTime(Math.floor((Date.now() - solitaire.startTime) / 1000));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [solitaire.gameWon, solitaire.startTime]);

  // Check for win condition
  useEffect(() => {
    const foundationCount = solitaire.foundations.reduce((sum, pile) => sum + pile.length, 0);
    if (foundationCount === 52 && !solitaire.gameWon) {
      setSolitaire(prev => ({ ...prev, gameWon: true }));
      const finalTime = Math.floor((Date.now() - solitaire.startTime) / 1000);
      dispatch({ type: "END_GAME", won: true, time: finalTime });
      toast.success("Congratulations! You won Solitaire!", {
        description: `Time: ${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, "0")}`
      });
      setShowInterstitial(true);
    }
  }, [solitaire.foundations, solitaire.gameWon, solitaire.startTime, dispatch]);

  const handleStockClick = () => {
    setSolitaire(prev => {
      if (prev.stock.length === 0) {
        // Reset stock from waste
        const newStock = [...prev.waste].reverse().map(card => ({ ...card, faceUp: false }));
        return {
          ...prev,
          stock: newStock,
          waste: [],
          moves: prev.moves + 1,
        };
      } else {
        // Draw 3 cards from stock to waste
        const cardsToDraw = Math.min(3, prev.stock.length);
        const drawnCards = prev.stock.slice(-cardsToDraw).map(card => ({ ...card, faceUp: true }));
        const remainingStock = prev.stock.slice(0, -cardsToDraw);
        
        return {
          ...prev,
          stock: remainingStock,
          waste: [...prev.waste, ...drawnCards],
          moves: prev.moves + 1,
        };
      }
    });
  };

  const handleCardClick = (card: Card, source: string, index?: number) => {
    setSolitaire(prev => {
      // Clear selection if clicking the same card
      if (prev.selectedCards.length === 1 && prev.selectedCards[0].id === card.id) {
        return {
          ...prev,
          selectedCards: [],
          selectedPile: null,
        };
      }

      // Select card(s) from tableau
      if (source.startsWith("tableau-") && card.faceUp) {
        const colIndex = parseInt(source.split("-")[1]);
        const cardIndex = index!;
        const column = prev.tableau[colIndex];
        const cardsToSelect = column.slice(cardIndex);
        
        // Check if selected cards form valid sequence
        if (isValidSolitaireSequence(cardsToSelect)) {
          return {
            ...prev,
            selectedCards: cardsToSelect,
            selectedPile: source,
          };
        }
      }

      // Select card from waste
      if (source === "waste" && prev.waste.length > 0) {
        const topCard = prev.waste[prev.waste.length - 1];
        if (card.id === topCard.id) {
          return {
            ...prev,
            selectedCards: [card],
            selectedPile: source,
          };
        }
      }

      return prev;
    });
  };

  const handleFoundationClick = (foundationIndex: number) => {
    if (solitaire.selectedCards.length !== 1) return;

    const card = solitaire.selectedCards[0];
    const foundation = solitaire.foundations[foundationIndex];

    if (canPlaceOnFoundation(card, foundation)) {
      setSolitaire(prev => {
        const newState = { ...prev };
        
        // Remove card from source
        if (prev.selectedPile === "waste") {
          newState.waste = prev.waste.slice(0, -1);
        } else if (prev.selectedPile?.startsWith("tableau-")) {
          const colIndex = parseInt(prev.selectedPile.split("-")[1]);
          newState.tableau[colIndex] = prev.tableau[colIndex].slice(0, -1);
          
          // Flip top card if exists
          const topCard = newState.tableau[colIndex][newState.tableau[colIndex].length - 1];
          if (topCard && !topCard.faceUp) {
            topCard.faceUp = true;
          }
        }
        
        // Add card to foundation
        newState.foundations[foundationIndex] = [...foundation, card];
        newState.selectedCards = [];
        newState.selectedPile = null;
        newState.moves++;
        newState.score += 10;
        
        return newState;
      });
    }
  };

  const handleTableauClick = (colIndex: number) => {
    if (solitaire.selectedCards.length === 0) return;

    const column = solitaire.tableau[colIndex];
    const topCard = column[column.length - 1];
    const selectedCard = solitaire.selectedCards[0];

    // Check if cards can be placed (King on empty column, or alternating colors descending)
    const canPlace = !topCard ? selectedCard.rank === "K" : 
      areOppositeColors(selectedCard, topCard) && isRankOneLess(selectedCard, topCard);

    if (canPlace) {
      setSolitaire(prev => {
        const newState = { ...prev };
        
        // Remove cards from source
        if (prev.selectedPile === "waste") {
          newState.waste = prev.waste.slice(0, -1);
        } else if (prev.selectedPile?.startsWith("tableau-")) {
          const sourceColIndex = parseInt(prev.selectedPile.split("-")[1]);
          newState.tableau[sourceColIndex] = prev.tableau[sourceColIndex].slice(0, -prev.selectedCards.length);
          
          // Flip top card if exists
          const topCard = newState.tableau[sourceColIndex][newState.tableau[sourceColIndex].length - 1];
          if (topCard && !topCard.faceUp) {
            topCard.faceUp = true;
          }
        }
        
        // Add cards to target column
        newState.tableau[colIndex] = [...column, ...prev.selectedCards];
        newState.selectedCards = [];
        newState.selectedPile = null;
        newState.moves++;
        newState.score += 5;
        
        return newState;
      });
    }
  };

  const handleNewGame = () => {
    setSolitaire(initialSolitaireState());
    dispatch({ type: "RESET_GAME" });
    setGameTime(0);
  };

  const handleGoBack = () => {
    dispatch({ type: "RESET_GAME" });
    router.push("/");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with ads */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <BannerAd />
      </div>

      {/* Game Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={handleGoBack}>
            ← Back to Games
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary">Score: {solitaire.score}</Badge>
            <Badge variant="secondary">Moves: {solitaire.moves}</Badge>
            <Badge variant="secondary">Time: {formatTime(gameTime)}</Badge>
          </div>
          
          <Button onClick={handleNewGame}>
            New Game
          </Button>
        </div>

        {/* Foundation piles */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            {solitaire.foundations.map((foundation, index) => (
              <div
                key={index}
                className="w-20 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white/50 cursor-pointer hover:bg-white/70 transition-colors"
                onClick={() => handleFoundationClick(index)}
              >
                {foundation.length > 0 ? (
                  <GameCard card={foundation[foundation.length - 1]} />
                ) : (
                  <span className="text-gray-400 text-sm">A</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stock and Waste */}
        <div className="flex justify-center mb-6 gap-4">
          <div 
            className="w-20 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white/50 cursor-pointer hover:bg-white/70 transition-colors"
            onClick={handleStockClick}
          >
            {solitaire.stock.length > 0 ? (
              <GameCard card={solitaire.stock[solitaire.stock.length - 1]} />
            ) : (
              <span className="text-gray-400 text-sm">↻</span>
            )}
          </div>

          <div className="w-20 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white/50">
            {solitaire.waste.length > 0 && (
              <GameCard 
                card={solitaire.waste[solitaire.waste.length - 1]}
                onClick={() => handleCardClick(solitaire.waste[solitaire.waste.length - 1], "waste")}
                isSelected={solitaire.selectedCards.some(c => c.id === solitaire.waste[solitaire.waste.length - 1]?.id)}
              />
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="flex justify-center gap-2 mb-8">
          {solitaire.tableau.map((column, colIndex) => (
            <div
              key={colIndex}
              className="w-20 min-h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white/20 cursor-pointer hover:bg-white/30 transition-colors p-1"
              onClick={() => handleTableauClick(colIndex)}
            >
              <div className="relative">
                {column.map((card, cardIndex) => (
                  <div
                    key={card.id}
                    className="absolute"
                    style={{ top: cardIndex * 20, zIndex: cardIndex }}
                  >
                    <GameCard
                      card={card}
                      onClick={() => handleCardClick(card, `tableau-${colIndex}`, cardIndex)}
                      isSelected={solitaire.selectedCards.some(c => c.id === card.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interstitial Ad Modal */}
      <InterstitialAd 
        isOpen={showInterstitial} 
        onClose={() => setShowInterstitial(false)}
        onContinue={() => {
          setShowInterstitial(false);
          handleNewGame();
        }}
      />
    </div>
  );
}