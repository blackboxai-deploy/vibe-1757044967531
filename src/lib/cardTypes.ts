// Card game types and utilities

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
  faceUp: boolean;
}

export interface CardPosition {
  x: number;
  y: number;
  zIndex: number;
}

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const SUIT_COLORS = {
  hearts: "red",
  diamonds: "red", 
  clubs: "black",
  spades: "black",
} as const;

export const SUIT_SYMBOLS = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
} as const;

export const RANK_VALUES = {
  "A": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  "J": 11,
  "Q": 12,
  "K": 13,
} as const;

// Create a standard 52-card deck
export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`,
        faceUp: false,
      });
    }
  }
  
  return deck;
}

// Shuffle deck using Fisher-Yates algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Check if two cards have opposite colors
export function areOppositeColors(card1: Card, card2: Card): boolean {
  return SUIT_COLORS[card1.suit] !== SUIT_COLORS[card2.suit];
}

// Check if card1 rank is one less than card2 rank
export function isRankOneLess(card1: Card, card2: Card): boolean {
  return RANK_VALUES[card1.rank] === RANK_VALUES[card2.rank] - 1;
}

// Check if card1 rank is one more than card2 rank
export function isRankOneMore(card1: Card, card2: Card): boolean {
  return RANK_VALUES[card1.rank] === RANK_VALUES[card2.rank] + 1;
}

// Get card value for Blackjack (Ace can be 1 or 11)
export function getBlackjackValue(cards: Card[]): number {
  let value = 0;
  let aces = 0;
  
  for (const card of cards) {
    if (card.rank === "A") {
      aces++;
      value += 11;
    } else if (["J", "Q", "K"].includes(card.rank)) {
      value += 10;
    } else {
      value += RANK_VALUES[card.rank];
    }
  }
  
  // Convert Aces from 11 to 1 if needed
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

// Check if cards form a valid sequence for Solitaire
export function isValidSolitaireSequence(cards: Card[]): boolean {
  if (cards.length <= 1) return true;
  
  for (let i = 0; i < cards.length - 1; i++) {
    const current = cards[i];
    const next = cards[i + 1];
    
    if (!areOppositeColors(current, next) || !isRankOneLess(next, current)) {
      return false;
    }
  }
  
  return true;
}

// Check if card can be placed on foundation pile (Ace to King, same suit)
export function canPlaceOnFoundation(card: Card, foundationCards: Card[]): boolean {
  if (foundationCards.length === 0) {
    return card.rank === "A";
  }
  
  const topCard = foundationCards[foundationCards.length - 1];
  return card.suit === topCard.suit && isRankOneMore(card, topCard);
}