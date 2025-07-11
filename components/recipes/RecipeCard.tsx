import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export interface RecipeComponent {
  type: "ingredient" | "batch";
  name: string;
  quantity: number;
  unit: string;
  available: boolean;
}

export interface RecipeCardProps {
  id?: string;
  name: string;
  description?: string;
  restaurant?: string;
  price?: number;
  components: RecipeComponent[];
  available: boolean;
  onDelete?: (id: string) => void;
  onViewDetails?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ id, name, description, restaurant, price, components, available, onDelete, onViewDetails }) => {
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onViewDetails?.();
  };

  return (
    <Card 
      className={`flex flex-col h-full transition-all duration-200 ${
        onViewDetails ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
            <CardTitle className="text-xl font-semibold mb-1 truncate">{name}</CardTitle>
            {typeof price === 'number' && (
              <span className="inline-block bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full">
                {price.toFixed(2)}
              </span>
            )}
          </div>
          {onDelete && id && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto flex-shrink-0"
              aria-label="Delete recipe"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {restaurant && (
            <Badge variant="outline" className="text-xs">
              {restaurant}
            </Badge>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground mb-2">{description}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="mb-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">Components:</div>
          <ul className="space-y-1">
            {components.map((comp, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Badge variant={comp.type === "batch" ? "secondary" : "outline"}>
                  {comp.type === "batch" ? "Batch" : "Ingredient"}
                </Badge>
                <span className="font-medium">{comp.name}</span>
                <span className="text-xs text-muted-foreground">{comp.quantity} {comp.unit}</span>
                {!comp.available && <span className="text-xs text-red-500 ml-2">Out of stock</span>}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 