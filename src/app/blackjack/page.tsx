"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import GameCard from "@/components/game/Card";
import BannerAd from "@/components/ads/BannerAd";
import InterstitialAd from "@/components/ads/InterstitialAd";
import { useGame } from "@/components/providers/GameProvider";
import { Card as CardType, createDeck, shuffleDeck, getBlackjackValue } from "@/lib/cardTypes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BlackjackState {
  deck: CardType[];
  playerHand: CardType[];
  dealerHand: CardType[];
  gamePhase: "betting" | "playing" | "dealer" | "finished";
  playerScore: number;
  dealerScore: number;
  bet: number;
  chips: number;
  gameResult: "win" | "lose" | "push" | "blackjack" | null;
  canDoubleDown: boolean;
  gameCount: number;
}

const initialBlackjackState = (): BlackjackState => ({
  deck: shuffleDeck(createDeck()),
  playerHand: [],
  dealerHand: [],
  gamePhase: "betting",
  playerScore: 0,
  dealerScore: 0,
  bet: 10,
  chips: 1000,
  gameResult: null,
  canDoubleDown: false,
  gameCount: 0,
});

export default function BlackjackPage() {
  const { dispatch } = useGame();
  const router = useRouter();
  const [blackjack, setBlackjack] = useState<BlackjackState>(initialBlackjackState);
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Calculate scores when hands change
  useEffect(() => {
    const playerScore = getBlackjackValue(blackjack.playerHand);
    const dealerScore = getBlackjackValue(blackjack.dealerHand);
    
    setBlackjack(prev => ({
      ...prev,
      playerScore,
      dealerScore,
    }));

    // Check for automatic win/loss conditions
    if (blackjack.gamePhase === "playing" && playerScore > 21) {
      endGame("lose");
    } else if (blackjack.gamePhase === "playing" && playerScore === 21 && blackjack.playerHand.length === 2) {
      if (dealerScore === 21 && blackjack.dealerHand.length === 2) {
        endGame("push");
      } else {
        endGame("blackjack");
      }
    }
  }, [blackjack.playerHand, blackjack.dealerHand, blackjack.gamePhase]);

  const dealCard = (fromDeck: CardType[], toDeck: CardType[], faceUp: boolean = true): [CardType[], CardType[]] => {
    if (fromDeck.length === 0) {
      // Reshuffle if deck is empty
      const newDeck = shuffleDeck(createDeck());
      const card = { ...newDeck[0], faceUp };
      return [newDeck.slice(1), [...toDeck, card]];
    }
    
    const card = { ...fromDeck[0], faceUp };
    return [fromDeck.slice(1), [...toDeck, card]];
  };

  const startNewRound = () => {
    if (blackjack.chips < blackjack.bet) {
      toast.error("Not enough chips to bet!");
      return;
    }

    setBlackjack(prev => {
      let newDeck = prev.deck;
      
      // Reshuffle if low on cards
      if (newDeck.length < 10) {
        newDeck = shuffleDeck(createDeck());
      }

      // Deal initial cards
      let playerHand: CardType[] = [];
      let dealerHand: CardType[] = [];

      // Player gets 2 cards face up
      const [deck1, player1] = dealCard(newDeck, playerHand);
      const [deck2, player2] = dealCard(deck1, player1);

      // Dealer gets 1 card face up, 1 face down
      const [deck3, dealer1] = dealCard(deck2, dealerHand);
      const [deck4, dealer2] = dealCard(deck3, dealer1, false);

      return {
        ...prev,
        deck: deck4,
        playerHand: player2,
        dealerHand: dealer2,
        gamePhase: "playing",
        chips: prev.chips - prev.bet,
        gameResult: null,
        canDoubleDown: true,
        gameCount: prev.gameCount + 1,
      };
    });
  };

  const hit = () => {
    setBlackjack(prev => {
      const [newDeck, newPlayerHand] = dealCard(prev.deck, prev.playerHand);
      return {
        ...prev,
        deck: newDeck,
        playerHand: newPlayerHand,
        canDoubleDown: false,
      };
    });
  };

  const stand = () => {
    setBlackjack(prev => ({ ...prev, gamePhase: "dealer" }));
    
    // Reveal dealer's hidden card
    setTimeout(() => {
      setBlackjack(prev => ({
        ...prev,
        dealerHand: prev.dealerHand.map(card => ({ ...card, faceUp: true })),
      }));
      
      // Dealer hits until 17 or busts
      dealerPlay();
    }, 500);
  };

  const doubleDown = () => {
    if (blackjack.chips < blackjack.bet) {
      toast.error("Not enough chips to double down!");
      return;
    }

    setBlackjack(prev => {
      const [newDeck, newPlayerHand] = dealCard(prev.deck, prev.playerHand);
      return {
        ...prev,
        deck: newDeck,
        playerHand: newPlayerHand,
        chips: prev.chips - prev.bet,
        bet: prev.bet * 2,
        canDoubleDown: false,
        gamePhase: "dealer",
      };
    });

    setTimeout(() => {
      setBlackjack(prev => ({
        ...prev,
        dealerHand: prev.dealerHand.map(card => ({ ...card, faceUp: true })),
      }));
      dealerPlay();
    }, 500);
  };

  const dealerPlay = () => {
    const dealerHit = () => {
      setBlackjack(prev => {
        const dealerScore = getBlackjackValue(prev.dealerHand);
        
        if (dealerScore < 17) {
          const [newDeck, newDealerHand] = dealCard(prev.deck, prev.dealerHand);
          const newScore = getBlackjackValue(newDealerHand);
          
          if (newScore >= 17) {
            setTimeout(() => determineWinner(prev.playerScore, newScore), 1000);
          } else {
            setTimeout(dealerHit, 1000);
          }
          
          return {
            ...prev,
            deck: newDeck,
            dealerHand: newDealerHand,
          };
        } else {
          setTimeout(() => determineWinner(prev.playerScore, dealerScore), 1000);
          return prev;
        }
      });
    };

    setTimeout(dealerHit, 1000);
  };

  const determineWinner = (playerScore: number, dealerScore: number) => {
    let result: "win" | "lose" | "push" | "blackjack";

    if (dealerScore > 21) {
      result = "win";
    } else if (playerScore > dealerScore) {
      result = "win";
    } else if (playerScore < dealerScore) {
      result = "lose";
    } else {
      result = "push";
    }

    endGame(result);
  };

  const endGame = (result: "win" | "lose" | "push" | "blackjack") => {
    setBlackjack(prev => {
      let chipsWon = 0;
      
      switch (result) {
        case "blackjack":
          chipsWon = Math.floor(prev.bet * 2.5);
          break;
        case "win":
          chipsWon = prev.bet * 2;
          break;
        case "push":
          chipsWon = prev.bet;
          break;
        case "lose":
          chipsWon = 0;
          break;
      }

      // Show result toast
      const messages = {
        blackjack: "Blackjack! You win!",
        win: "You win!",
        lose: "Dealer wins!",
        push: "Push! It's a tie!",
      };
      
      toast.success(messages[result], {
        description: result === "lose" ? `Lost $${prev.bet}` : `Won $${chipsWon - prev.bet}`,
      });

      // Show interstitial every 5 games
      if (prev.gameCount % 5 === 0) {
        setShowInterstitial(true);
      }

      return {
        ...prev,
        chips: prev.chips + chipsWon,
        gameResult: result,
        gamePhase: "finished",
      };
    });

    // Update game stats
    dispatch({ type: "END_GAME", won: result === "win" || result === "blackjack", time: 60 });
  };

  const handleBetChange = (amount: number) => {
    setBlackjack(prev => ({
      ...prev,
      bet: Math.max(10, Math.min(prev.chips, prev.bet + amount)),
    }));
  };

  const handleNewGame = () => {
    setBlackjack(initialBlackjackState());
    dispatch({ type: "RESET_GAME" });
  };

  const handleGoBack = () => {
    dispatch({ type: "RESET_GAME" });
    router.push("/");
  };

  const getResultColor = () => {
    switch (blackjack.gameResult) {
      case "blackjack":
      case "win":
        return "text-green-600";
      case "lose":
        return "text-red-600";
      case "push":
        return "text-yellow-600";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with ads */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <BannerAd />
      </div>

      {/* Game Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={handleGoBack}>
            ← Back to Games
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary">Chips: ${blackjack.chips}</Badge>
            <Badge variant="secondary">Bet: ${blackjack.bet}</Badge>
            <Badge variant="secondary">Games: {blackjack.gameCount}</Badge>
          </div>
          
          <Button onClick={handleNewGame}>
            New Game
          </Button>
        </div>

        {/* Dealer Section */}
        <Card className="mb-6 p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-2">Dealer</h3>
            <div className="flex justify-center gap-2 mb-2">
              {blackjack.dealerHand.map((card) => (
                <GameCard key={card.id} card={card} />
              ))}
            </div>
            <Badge variant="outline">
              Score: {blackjack.gamePhase === "playing" && blackjack.dealerHand.length > 0 ? "?" : blackjack.dealerScore}
            </Badge>
          </div>
        </Card>

        {/* Player Section */}
        <Card className="mb-6 p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-2">Your Hand</h3>
            <div className="flex justify-center gap-2 mb-2">
              {blackjack.playerHand.map((card) => (
                <GameCard key={card.id} card={card} />
              ))}
            </div>
            <Badge variant="outline" className={blackjack.playerScore > 21 ? "bg-red-100 text-red-800" : ""}>
              Score: {blackjack.playerScore}
            </Badge>
          </div>
        </Card>

        {/* Game Controls */}
        <div className="text-center mb-8">
          {blackjack.gamePhase === "betting" && (
            <div className="space-y-4">
              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleBetChange(-10)}
                  disabled={blackjack.bet <= 10}
                >
                  -$10
                </Button>
                <span className="text-lg font-semibold">Bet: ${blackjack.bet}</span>
                <Button
                  variant="outline"
                  onClick={() => handleBetChange(10)}
                  disabled={blackjack.bet >= blackjack.chips}
                >
                  +$10
                </Button>
              </div>
              <Button
                onClick={startNewRound}
                disabled={blackjack.chips < blackjack.bet}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
              >
                Deal Cards
              </Button>
            </div>
          )}

          {blackjack.gamePhase === "playing" && (
            <div className="flex justify-center gap-4">
              <Button onClick={hit} variant="default">
                Hit
              </Button>
              <Button onClick={stand} variant="outline">
                Stand
              </Button>
              {blackjack.canDoubleDown && blackjack.chips >= blackjack.bet && (
                <Button onClick={doubleDown} variant="secondary">
                  Double Down
                </Button>
              )}
            </div>
          )}

          {blackjack.gamePhase === "dealer" && (
            <div className="text-center">
              <p className="text-lg">Dealer is playing...</p>
            </div>
          )}

          {blackjack.gamePhase === "finished" && (
            <div className="space-y-4">
              <div className={`text-2xl font-bold ${getResultColor()}`}>
                {blackjack.gameResult === "blackjack" && "BLACKJACK!"}
                {blackjack.gameResult === "win" && "YOU WIN!"}
                {blackjack.gameResult === "lose" && "DEALER WINS!"}
                {blackjack.gameResult === "push" && "PUSH!"}
              </div>
              <Button
                onClick={() => setBlackjack(prev => ({ ...prev, gamePhase: "betting" }))}
                disabled={blackjack.chips < 10}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                {blackjack.chips < 10 ? "Game Over - No Chips Left" : "Next Round"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Interstitial Ad Modal */}
      <InterstitialAd 
        isOpen={showInterstitial} 
        onClose={() => setShowInterstitial(false)}
        title="Nice Playing!"
        description="Take a quick break and then continue your winning streak!"
        onContinue={() => {
          setShowInterstitial(false);
          setBlackjack(prev => ({ ...prev, gamePhase: "betting" }));
        }}
      />
    </div>
  );
}