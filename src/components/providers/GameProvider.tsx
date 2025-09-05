"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";

// Game types
export type GameType = "solitaire" | "hearts" | "blackjack" | "war";
export type GameDifficulty = "easy" | "medium" | "hard";

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number;
  currentStreak: number;
  bestStreak: number;
}

export interface PlayerData {
  name: string;
  level: number;
  experience: number;
  coins: number;
  achievements: string[];
  stats: Record<GameType, GameStats>;
}

export interface GameSettings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  autoCompleteEnabled: boolean;
  difficulty: GameDifficulty;
  cardBack: string;
  theme: "light" | "dark" | "system";
}

export interface GameState {
  player: PlayerData;
  settings: GameSettings;
  currentGame: GameType | null;
  isPlaying: boolean;
  isPaused: boolean;
  gameTime: number;
  score: number;
}

type GameAction =
  | { type: "START_GAME"; gameType: GameType }
  | { type: "END_GAME"; won: boolean; time: number }
  | { type: "PAUSE_GAME" }
  | { type: "RESUME_GAME" }
  | { type: "UPDATE_SCORE"; score: number }
  | { type: "UPDATE_TIME"; time: number }
  | { type: "UPDATE_SETTINGS"; settings: Partial<GameSettings> }
  | { type: "RESET_GAME" }
  | { type: "LOAD_SAVED_STATE"; state: GameState };

const defaultStats: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestTime: Infinity,
  currentStreak: 0,
  bestStreak: 0,
};

const initialState: GameState = {
  player: {
    name: "Player",
    level: 1,
    experience: 0,
    coins: 100,
    achievements: [],
    stats: {
      solitaire: { ...defaultStats },
      hearts: { ...defaultStats },
      blackjack: { ...defaultStats },
      war: { ...defaultStats },
    },
  },
  settings: {
    soundEnabled: true,
    animationsEnabled: true,
    autoCompleteEnabled: true,
    difficulty: "medium",
    cardBack: "classic",
    theme: "system",
  },
  currentGame: null,
  isPlaying: false,
  isPaused: false,
  gameTime: 0,
  score: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...state,
        currentGame: action.gameType,
        isPlaying: true,
        isPaused: false,
        gameTime: 0,
        score: 0,
      };

    case "END_GAME": {
      if (!state.currentGame) return state;

      const currentStats = state.player.stats[state.currentGame];
      const newStats = {
        ...currentStats,
        gamesPlayed: currentStats.gamesPlayed + 1,
        gamesWon: action.won ? currentStats.gamesWon + 1 : currentStats.gamesWon,
        bestTime: action.won && action.time < currentStats.bestTime ? action.time : currentStats.bestTime,
        currentStreak: action.won ? currentStats.currentStreak + 1 : 0,
        bestStreak: action.won && currentStats.currentStreak + 1 > currentStats.bestStreak 
          ? currentStats.currentStreak + 1 
          : currentStats.bestStreak,
      };

      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        player: {
          ...state.player,
          experience: state.player.experience + (action.won ? 50 : 10),
          coins: state.player.coins + (action.won ? 20 : 5),
          stats: {
            ...state.player.stats,
            [state.currentGame]: newStats,
          },
        },
      };
    }

    case "PAUSE_GAME":
      return { ...state, isPaused: true };

    case "RESUME_GAME":
      return { ...state, isPaused: false };

    case "UPDATE_SCORE":
      return { ...state, score: action.score };

    case "UPDATE_TIME":
      return { ...state, gameTime: action.time };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
      };

    case "RESET_GAME":
      return {
        ...state,
        currentGame: null,
        isPlaying: false,
        isPaused: false,
        gameTime: 0,
        score: 0,
      };

    case "LOAD_SAVED_STATE":
      return action.state;

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem("cardGameState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({ type: "LOAD_SAVED_STATE", state: parsed });
      } catch (error) {
        console.error("Failed to load saved game state:", error);
      }
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    localStorage.setItem("cardGameState", JSON.stringify(state));
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};