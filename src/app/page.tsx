"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameType, useGame } from "@/components/providers/GameProvider";
import BannerAd from "@/components/ads/BannerAd";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface GameInfo {
  id: GameType;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedTime: string;
  players: string;
  image: string;
}

const games: GameInfo[] = [
  {
    id: "solitaire",
    title: "Classic Solitaire",
    description: "The timeless Klondike Solitaire. Build foundation piles from Ace to King.",
    difficulty: "Medium",
    estimatedTime: "5-15 min",
    players: "1 Player",
    image: "https://placehold.co/400x300?text=Classic+Solitaire+Card+Game+with+Traditional+Layout"
  },
  {
    id: "hearts",
    title: "Hearts",
    description: "Avoid penalty cards and try to shoot the moon in this classic trick-taking game.",
    difficulty: "Hard",
    estimatedTime: "15-30 min",
    players: "4 Players",
    image: "https://placehold.co/400x300?text=Hearts+Card+Game+with+Four+Players+Layout"
  },
  {
    id: "blackjack",
    title: "BlackJack 21",
    description: "Beat the dealer by getting as close to 21 as possible without going over.",
    difficulty: "Easy",
    estimatedTime: "2-5 min",
    players: "1 Player",
    image: "https://placehold.co/400x300?text=BlackJack+21+Casino+Card+Game+Table"
  },
  {
    id: "war",
    title: "War",
    description: "Simple and fun card game. Higher card wins! Perfect for quick gaming sessions.",
    difficulty: "Easy",
    estimatedTime: "1-3 min",
    players: "1 Player",
    image: "https://placehold.co/400x300?text=War+Card+Game+Simple+Battle+Layout"
  }
];

export default function HomePage() {
  const { state, dispatch } = useGame();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  const handleGameStart = (gameType: GameType) => {
    dispatch({ type: "START_GAME", gameType });
    toast.success(`Starting ${games.find(g => g.id === gameType)?.title}...`);
    router.push(`/${gameType}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500";
      case "Medium": return "bg-yellow-500";
      case "Hard": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getPlayerLevel = () => {
    const exp = state.player.experience;
    return Math.floor(exp / 100) + 1;
  };

  const getExpProgress = () => {
    const exp = state.player.experience;
    return (exp % 100);
  };

  return (
    <div className="min-h-screen">
      {/* Header with Banner Ad */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <BannerAd />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Player Stats Header */}
        <div className="mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    Welcome, {state.player.name}!
                  </CardTitle>
                  <CardDescription>
                    Level {getPlayerLevel()} • {state.player.coins} Coins
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-2">
                    XP: {state.player.experience}
                  </Badge>
                  <Progress value={getExpProgress()} className="w-32" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Game Selection */}
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="games">Play Games</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {games.map((game) => (
                <Card 
                  key={game.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                    selectedGame === game.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedGame(game.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="aspect-video w-full overflow-hidden rounded-lg mb-4">
                      <img 
                        src={game.image} 
                        alt={game.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.backgroundColor = "#f3f4f6";
                          img.style.display = "flex";
                          img.style.alignItems = "center";
                          img.style.justifyContent = "center";
                          img.innerHTML = game.title;
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl">{game.title}</CardTitle>
                      <Badge className={`${getDifficultyColor(game.difficulty)} text-white`}>
                        {game.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {game.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{game.estimatedTime}</span>
                      <span>{game.players}</span>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGameStart(game.id);
                      }}
                    >
                      Play Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {games.map((game) => {
                const stats = state.player.stats[game.id];
                const winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed * 100).toFixed(1) : "0";
                
                return (
                  <Card key={game.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{game.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Games Played:</span>
                          <span className="font-semibold">{stats.gamesPlayed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Games Won:</span>
                          <span className="font-semibold">{stats.gamesWon}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Win Rate:</span>
                          <span className="font-semibold">{winRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Best Time:</span>
                          <span className="font-semibold">
                            {stats.bestTime === Infinity ? "N/A" : `${Math.floor(stats.bestTime / 60)}:${(stats.bestTime % 60).toString().padStart(2, "0")}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Streak:</span>
                          <span className="font-semibold">{stats.currentStreak}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Best Streak:</span>
                          <span className="font-semibold">{stats.bestStreak}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Banner Ad */}
      <div className="bg-white dark:bg-gray-800 shadow-sm mt-8">
        <BannerAd />
      </div>
    </div>
  );
}