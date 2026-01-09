import { Check, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price_cents: number;
}

interface AddOnSelectorProps {
  addOns: AddOn[];
  selectedAddOns: AddOn[];
  onSelectAddOns: (addOns: AddOn[]) => void;
}

export default function AddOnSelector({ addOns, selectedAddOns, onSelectAddOns }: AddOnSelectorProps) {
  const isSelected = (addOn: AddOn) => selectedAddOns.some((a) => a.id === addOn.id);

  const toggleAddOn = (addOn: AddOn) => {
    if (isSelected(addOn)) {
      onSelectAddOns(selectedAddOns.filter((a) => a.id !== addOn.id));
    } else {
      onSelectAddOns([...selectedAddOns, addOn]);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Add-ons</h3>
        <p className="text-sm text-muted-foreground">Enhance your order with extras</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {addOns.map((addOn) => {
          const selected = isSelected(addOn);

          return (
            <Card
              key={addOn.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selected && "ring-2 ring-primary bg-primary/5"
              )}
              onClick={() => toggleAddOn(addOn)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => toggleAddOn(addOn)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{addOn.name}</span>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      +{formatPrice(addOn.price_cents)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{addOn.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
