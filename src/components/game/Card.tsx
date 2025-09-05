"use client";

import React from "react";
import { Card as CardType, SUIT_COLORS, SUIT_SYMBOLS } from "@/lib/cardTypes";
import { cn } from "@/lib/utils";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isDragging?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const Card: React.FC<CardProps> = ({
  card,
  onClick,
  onDoubleClick,
  isDragging = false,
  isSelected = false,
  isHighlighted = false,
  className,
  style,
  draggable = true,
  onDragStart,
  onDragEnd,
}) => {
  const isRed = SUIT_COLORS[card.suit] === "red";
  const symbol = SUIT_SYMBOLS[card.suit];

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e);
    }
    e.dataTransfer.setData("text/plain", card.id);
  };

  if (!card.faceUp) {
    return (
      <div
        className={cn(
          "relative w-16 h-24 md:w-20 md:h-28 rounded-lg border-2 border-gray-300",
          "bg-gradient-to-br from-blue-600 to-blue-800",
          "cursor-pointer select-none transition-all duration-200",
          "hover:scale-105 hover:shadow-lg",
          isDragging && "opacity-50 scale-95",
          isSelected && "ring-2 ring-yellow-400",
          isHighlighted && "ring-2 ring-green-400",
          className
        )}
        style={style}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
      >
        {/* Card back design */}
        <div className="absolute inset-1 rounded-md bg-white/10">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white/30 text-2xl">♠</div>
          </div>
          <div className="absolute inset-1 border border-white/20 rounded-sm">
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-16 h-24 md:w-20 md:h-28 rounded-lg border-2",
        "bg-white dark:bg-gray-100 shadow-md",
        "cursor-pointer select-none transition-all duration-200",
        "hover:scale-105 hover:shadow-lg",
        isRed ? "border-red-300 text-red-600" : "border-gray-400 text-gray-800",
        isDragging && "opacity-50 scale-95",
        isSelected && "ring-2 ring-yellow-400 shadow-yellow-200",
        isHighlighted && "ring-2 ring-green-400 shadow-green-200",
        className
      )}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Top-left corner */}
      <div className="absolute top-1 left-1 flex flex-col items-center text-xs md:text-sm font-bold leading-none">
        <span>{card.rank}</span>
        <span>{symbol}</span>
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className="absolute bottom-1 right-1 flex flex-col items-center text-xs md:text-sm font-bold leading-none rotate-180">
        <span>{card.rank}</span>
        <span>{symbol}</span>
      </div>

      {/* Center symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg md:text-2xl font-bold opacity-70">
          {symbol}
        </span>
      </div>

      {/* Additional symbols for number cards */}
      {["2", "3", "4", "5", "6", "7", "8", "9", "10"].includes(card.rank) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-1 opacity-50">
            {Array.from({ length: Math.min(8, parseInt(card.rank) || 0) }).map((_, i) => (
              <span key={i} className="text-xs">
                {symbol}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Shine effect for face cards */}
      {["J", "Q", "K", "A"].includes(card.rank) && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default Card;