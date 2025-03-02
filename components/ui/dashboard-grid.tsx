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

// This version of the dashboard grid removes drag-and-drop for more stability
export function DashboardGrid({
  cards,
  onCardsReorder,
  onToggleVisibility,
  renderCardContent,
  getCardSizeClass,
  className = '',
}: DashboardGridProps) {
  // Determine if we should use simplified view based on URL parameter or error detection
  const [useSimplifiedView, setUseSimplifiedView] = useState(false);
  
  // Check for simplified view parameter on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Check URL for simplified parameter or detect if there were previous errors
        const urlParams = new URLSearchParams(window.location.search);
        const shouldUseSimplified = 
          urlParams.get('simplified') === 'true' || 
          urlParams.get('static') === 'true' ||
          localStorage.getItem('dashboard-had-errors') === 'true';
        
        setUseSimplifiedView(shouldUseSimplified);
      }
    } catch (err) {
      // If there's an error accessing localStorage, use simplified view
      console.error('Error checking for simplified view:', err);
      setUseSimplifiedView(true);
    }
  }, []);

  // Handle client-side errors in our component
  useEffect(() => {
    try {
      const handleError = () => {
        // On any error, try to save that we had problems
        localStorage.setItem('dashboard-had-errors', 'true');
        // And switch to simplified view
        setUseSimplifiedView(true);
      };
      
      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    } catch (err) {
      // If we can't even set up the error handler, ensure simplified view
      setUseSimplifiedView(true);
    }
  }, []);

  // Simplified view rendering - no drag and drop, just static cards
  if (useSimplifiedView) {
    return (    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 ${className}`}>
        {cards
          .filter(card => card.visible)
          .map(card => (    <div 
              key={card.id} 
              className={`col-span-1`}
            >    
        <Card className="h-full relative overflow-hidden backdrop-blur-sm bg-card/70">    
        <CardHeader>    
        <CardTitle>{card.title}</CardTitle>
                </CardHeader>    <CardContent>{renderCardContent(card)}</CardContent>
              </Card>
            </div>
          ))}
      </div>
    );
  }

  // Standard view with drag-and-drop functionality
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    try {
      setDraggedCard(id);
      e.dataTransfer.setData('text/plain', id);
      
      // Add styling to the dragged card
      const cardEl = cardRefs.current.get(id);
      if (cardEl) {
        cardEl.classList.add('opacity-50', 'border-emerald-500', 'border-2');
      }
    } catch (error) {
      console.error('Error in drag start:', error);
      setUseSimplifiedView(true);
    }
  };

  // Handle drag over - this is needed for drop to work
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle drop - reorder cards
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    try {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      
      if (draggedId === targetId) return;
      
      // Create a new array with the reordered cards
      const newCards = [...cards];
      const draggedIndex = newCards.findIndex(c => c.id === draggedId);
      const targetIndex = newCards.findIndex(c => c.id === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = newCards.splice(draggedIndex, 1);
        newCards.splice(targetIndex, 0, removed);
        onCardsReorder(newCards);
      }
    } catch (error) {
      console.error('Error in drop handling:', error);
      setUseSimplifiedView(true);
    }
  };

  // Reset dragged card styling on drag end
  const handleDragEnd = () => {
    try {
      if (draggedCard) {
        const cardEl = cardRefs.current.get(draggedCard);
        if (cardEl) {
          cardEl.classList.remove('opacity-50', 'border-emerald-500', 'border-2');
        }
        setDraggedCard(null);
      }
    } catch (error) {
      console.error('Error in drag end:', error);
      setUseSimplifiedView(true);
    }
  };

  return (    <div className={`grid grid-cols-12 gap-4 md:gap-6 ${className}`}>
      {cards
        .filter(card => card.visible)
        .map(card => (    <div 
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
          >    <Card className="h-full relative overflow-hidden backdrop-blur-sm bg-card/70 hover:bg-card/80 transition-all duration-300">    
        <div className="absolute left-2 top-2 h-8 w-8 cursor-move opacity-30 hover:opacity-70 flex items-center justify-center rounded-md">    
        <GripVertical size={16} />
              </div>    <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 opacity-60 hover:opacity-100"
                onClick={() => onToggleVisibility(card.id)}
              >    <EyeOff size={16} />
              </Button>    <CardHeader className="pt-8">    
        <CardTitle>{card.title}</CardTitle>
              </CardHeader>    <CardContent>{renderCardContent(card)}</CardContent>
            </Card>
          </div>
        ))}
    </div>
  );
}