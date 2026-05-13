"use client";

import { THEMES, THEME_KEYS } from "@/lib/themes";
import { useThemeStore } from "@/lib/store";
import { motion } from "framer-motion";

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeStore();
  const theme = THEMES[activeTheme];

  return (
    <div className="space-y-3">
      {/* Scrollable theme tab row */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2 min-w-max">
          {THEME_KEYS.map((key) => {
            const t = THEMES[key];
            const isActive = key === activeTheme;
            return (
              <button
                key={key}
                onClick={() => setActiveTheme(key)}
                className={`
                  relative flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium
                  transition-all duration-200 whitespace-nowrap border
                  ${
                    isActive
                      ? "text-[hsl(var(--background))] border-transparent"
                      : "text-muted-foreground border-[hsl(var(--border))] hover:text-foreground hover:border-[hsl(var(--muted-foreground))]"
                  }
                `}
                style={
                  isActive
                    ? { backgroundColor: t.color, borderColor: t.color }
                    : {}
                }
              >
                <span className="text-sm leading-none">{t.icon}</span>
                <span>{t.shortLabel}</span>
                {isActive && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="absolute inset-0 rounded"
                    style={{ backgroundColor: t.color, zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active theme info card */}
      <motion.div
        key={activeTheme}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="card-dark p-4 flex flex-col sm:flex-row sm:items-start gap-3"
        style={{ borderColor: `${theme.color}40` }}
      >
        <span className="text-3xl leading-none">{theme.icon}</span>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-bold text-base text-foreground">
              {theme.label}
            </h2>
            <div className="flex flex-wrap gap-1">
              {theme.criteria.map((c) => (
                <span
                  key={c}
                  className="tag-theme text-[10px]"
                  style={{ color: theme.color, borderColor: `${theme.color}40`, backgroundColor: `${theme.color}10` }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono leading-relaxed">
            {theme.description}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
