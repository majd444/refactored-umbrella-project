import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  buttonVariant?: "default" | "outline" | "premium";
  popular?: boolean;
  className?: string;
  onClick?: () => void;
}

export function PricingCard({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant = "default",
  popular = false,
  className,
  onClick,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-elegant hover:-translate-y-1",
        popular && "ring-2 ring-primary bg-gradient-popular",
        className
      )}
    >
      {popular && (
        <Badge className="absolute top-[25px] left-1/2 -translate-x-1/2 bg-gradient-primary border-0 text-primary-foreground font-semibold px-4 py-1">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-8 pt-8">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-muted-foreground ml-1">/{period}</span>}
        </div>
        <CardDescription className="mt-2 text-base">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div
                className={cn(
                  "rounded-full p-1 flex-shrink-0",
                  feature.included
                    ? "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Check className="h-3 w-3" />
              </div>
              <span
                className={cn(
                  "text-sm",
                  feature.included ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
        
        <Button 
          className={cn(
            "w-full font-semibold transition-all duration-200",
            buttonVariant === "premium" && "bg-gradient-primary hover:shadow-elegant border-0"
          )}
          variant={buttonVariant === "premium" ? "default" : buttonVariant}
          size="lg"
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}