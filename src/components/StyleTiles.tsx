import React, { useState, useEffect } from "react";
import { styles, StyleBlock, Pair } from "@/data/examples";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HardHat,
  Sparkles,
  Search,
  Home,
  HeartPulse,
  User,
  ImageOff,
} from "lucide-react";

const styleIcons: Record<StyleBlock["id"], React.ReactNode> = {
  tradie: <HardHat className="h-8 w-8" />,
  dreamscene: <Sparkles className="h-8 w-8" />,
  jobseeker: <Search className="h-8 w-8" />,
  realestate: <Home className="h-8 w-8" />,
  health: <HeartPulse className="h-8 w-8" />,
};

const styleGradients: Record<StyleBlock["id"], string> = {
  tradie: "from-orange-500/20 to-amber-600/20",
  dreamscene: "from-purple-500/20 to-pink-500/20",
  jobseeker: "from-blue-500/20 to-slate-600/20",
  realestate: "from-emerald-500/20 to-teal-600/20",
  health: "from-cyan-500/20 to-blue-500/20",
};

export default function StyleTiles() {
  const [selectedStyle, setSelectedStyle] = useState<StyleBlock | null>(null);
  const [defaultTab, setDefaultTab] = useState<"male" | "female">("male");

  const openModal = (style: StyleBlock) => {
    // Default to the tab that has content
    if (style.male.length > 0) {
      setDefaultTab("male");
    } else if (style.female.length > 0) {
      setDefaultTab("female");
    }
    setSelectedStyle(style);
  };

  const closeModal = () => setSelectedStyle(null);

  // Preload first after image when modal opens
  useEffect(() => {
    if (!selectedStyle) return;
    const pairs =
      defaultTab === "male" ? selectedStyle.male : selectedStyle.female;
    if (pairs.length > 0) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = pairs[0].after;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [selectedStyle, defaultTab]);

  return (
    <section className="py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        Explore by <span className="text-gradient-gold">Style</span>
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
        Click a style to see real before & after transformations for men and
        women.
      </p>

      {/* Masonry Style Tiles */}
      <div className="columns-2 md:columns-3 lg:columns-5 gap-4 space-y-4">
        {styles.map((style, index) => {
          // Alternate heights for masonry effect
          const heightClass = index % 3 === 0 ? "h-48" : index % 3 === 1 ? "h-64" : "h-56";
          return (
            <button
              key={style.id}
              onClick={() => openModal(style)}
              aria-label={`View ${style.label} examples`}
              className={`group relative w-full ${heightClass} break-inside-avoid flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-border bg-gradient-to-br ${styleGradients[style.id]} hover:border-primary/50 hover:scale-[1.02] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
            >
              <div className="text-primary group-hover:scale-110 transition-transform">
                {styleIcons[style.id]}
              </div>
              <span className="font-semibold text-foreground">{style.label}</span>
              <span className="text-xs text-muted-foreground">
                {style.male.length + style.female.length} example
                {style.male.length + style.female.length !== 1 ? "s" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedStyle} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          {selectedStyle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <span className="text-primary">
                    {styleIcons[selectedStyle.id]}
                  </span>
                  {selectedStyle.label} Examples
                </DialogTitle>
              </DialogHeader>

              <Tabs
                defaultValue={defaultTab}
                className="mt-4"
                onValueChange={(v) => setDefaultTab(v as "male" | "female")}
              >
                <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 mb-6">
                  <TabsTrigger
                    value="male"
                    disabled={selectedStyle.male.length === 0}
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <User className="h-4 w-4" />
                    Male
                    {selectedStyle.male.length === 0 && (
                      <span className="text-xs opacity-50">(none)</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="female"
                    disabled={selectedStyle.female.length === 0}
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <User className="h-4 w-4" />
                    Female
                    {selectedStyle.female.length === 0 && (
                      <span className="text-xs opacity-50">(none)</span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="male">
                  <SliderGrid pairs={selectedStyle.male} />
                </TabsContent>

                <TabsContent value="female">
                  <SliderGrid pairs={selectedStyle.female} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function SliderGrid({ pairs }: { pairs: Pair[] }) {
  if (pairs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ImageOff className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No examples available for this category yet.</p>
        <p className="text-sm mt-2">Check back soon!</p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 ${
        pairs.length === 1
          ? "grid-cols-1 max-w-md mx-auto"
          : pairs.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      }`}
    >
      {pairs.map((pair, index) => (
        <BeforeAfterSlider
          key={index}
          before={pair.before}
          after={pair.after}
          alt={pair.alt}
        />
      ))}
    </div>
  );
}
