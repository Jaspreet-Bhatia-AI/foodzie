'use client';

interface DietaryIconProps {
  isVegetarian: boolean;
  className?: string;
}

export function DietaryIcon({ isVegetarian, className = "" }: DietaryIconProps) {
  return (
    <div 
      className={`w-4 h-4 flex items-center justify-center border-2 rounded-sm ${
        isVegetarian 
          ? "border-green-600 dark:border-green-500" 
          : "border-red-700 dark:border-red-600"
      } ${className}`}
      title={isVegetarian ? "Vegetarian" : "Non-Vegetarian"}
    >
      <div 
        className={`w-1.5 h-1.5 rounded-full ${
          isVegetarian 
            ? "bg-green-600 dark:bg-green-500" 
            : "bg-red-700 dark:bg-red-600"
        }`}
      />
    </div>
  );
}
