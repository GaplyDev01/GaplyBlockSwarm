import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { EyeOff, GripVertical } from 'lucide-react';

interface DashboardCard {
  id: string;
  title: string;
  type: 'wallet' | 'transactions' | 'token' | 'market' | 'ai' | 'signals' | 'token-search' | 'token-details';
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  content?: React.ReactNode;
  tokenMint?: string;
}

interface DashboardGridProps {
  cards: DashboardCard[];
  onCardsReorder: (cards: DashboardCard[]) => void;
  onToggleVisibility: (id: string) => void;
  renderCardContent: (card: DashboardCard) => React.ReactNode;
  getCardSizeClass: (size: DashboardCard['size']) => string;
  className?: string;
}

export function DashboardGrid({
  cards,
  onCardsReorder,
  onToggleVisibility,
  renderCardContent,
  getCardSizeClass,
  className = '',
}: DashboardGridProps) {
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedCard(id);
    e.dataTransfer.setData('text/plain', id);
    
    // Set ghost image for dragging
    const ghostEl = document.createElement('div');
    ghostEl.classList.add('w-12', 'h-12', 'bg-emerald-500/50', 'rounded-lg', 'flex', 'items-center', 'justify-center');
    ghostEl.innerText = '↕︎';
    document.body.appendChild(ghostEl);
    e.dataTransfer.setDragImage(ghostEl, 6, 6);
    setTimeout(() => {
      document.body.removeChild(ghostEl);
    }, 0);
    
    // Add styling to the dragged card
    const cardEl = cardRefs.current.get(id);
    if (cardEl) {
      cardEl.classList.add('opacity-50', 'border-emerald-500', 'border-2');
    }
  };

  // Handle drag over - this is needed for drop to work
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle drop - reorder cards
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId === targetId) return;
    
    // Find the indices of the dragged and target cards
    const visibleCards = cards.filter(card => card.visible);
    const draggedIndex = visibleCards.findIndex(c => c.id === draggedId);
    const targetIndex = visibleCards.findIndex(c => c.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Create a new array with the reordered cards
    const newCards = [...cards];
    const allCards = [...newCards];
    
    // Count visible cards before the draggedIndex to get its position in the original array
    const originalDraggedIndex = allCards.findIndex(c => c.id === draggedId);
    const originalTargetIndex = allCards.findIndex(c => c.id === targetId);
    
    // Remove the dragged card
    const [draggedCard] = newCards.splice(originalDraggedIndex, 1);
    
    // Insert it at the target position
    // If we're moving a card from above to below, we need to adjust for the removed item
    const adjustedTargetIndex = originalDraggedIndex < originalTargetIndex 
      ? originalTargetIndex - 1 
      : originalTargetIndex;
    
    newCards.splice(adjustedTargetIndex, 0, draggedCard);
    
    // Update the parent component
    onCardsReorder(newCards);
  };

  // Reset dragged card styling on drag end
  const handleDragEnd = () => {
    if (draggedCard) {
      const cardEl = cardRefs.current.get(draggedCard);
      if (cardEl) {
        cardEl.classList.remove('opacity-50', 'border-emerald-500', 'border-2');
      }
      setDraggedCard(null);
    }
  };

  return (
    <div className={`grid grid-cols-12 gap-4 md:gap-6 ${className}`}>
      {cards
        .filter(card => card.visible)
        .map(card => (
          <div 
            key={card.id} 
            className={`${getCardSizeClass(card.size)}`}
            ref={el => {
              if (el) cardRefs.current.set(card.id, el);
              else cardRefs.current.delete(card.id);
            }}
            draggable={true}
            onDragStart={e => handleDragStart(e, card.id)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, card.id)}
            onDragEnd={handleDragEnd}
          >
            <Card className="h-full relative overflow-hidden backdrop-blur-sm bg-card/70 hover:bg-card/80 transition-all duration-300">
              <div className="absolute left-2 top-2 h-8 w-8 cursor-move opacity-30 hover:opacity-70 flex items-center justify-center rounded-md">
                <GripVertical size={16} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 opacity-60 hover:opacity-100"
                onClick={() => onToggleVisibility(card.id)}
              >
                <EyeOff size={16} />
              </Button>
              <CardHeader className="pt-8">
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent>{renderCardContent(card)}</CardContent>
            </Card>
          </div>
        ))}
    </div>
  );
}