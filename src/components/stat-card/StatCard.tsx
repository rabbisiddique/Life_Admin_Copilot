import { Card, CardContent } from "../ui/card";

// StatCard.tsx
interface StatCardProps {
  label: string;
  shortLabel: string;
  value: number;
  color?: string;
}

const StatCard = ({ label, shortLabel, value, color = "" }: StatCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="px-1 py-1.5 sm:px-1.5 sm:py-2 md:px-2 md:py-1.5 flex flex-col items-center justify-center text-center">
        <div
          className={`text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 ${color}`}
        >
          {value}
        </div>
        <div className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground">
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
