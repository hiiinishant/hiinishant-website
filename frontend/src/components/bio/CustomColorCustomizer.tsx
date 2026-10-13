"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CustomColorPalette,
  ColorPalettePreset,
  COLOR_PALETTE_PRESETS,
  isValidHexColor,
  getContrastRatio,
  BioThemeId,
  BIO_THEMES,
} from "@/types/bio";
import {
  Palette,
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Layers,
  Wand2,
} from "lucide-react";

interface CustomColorCustomizerProps {
  currentTheme: BioThemeId;
  customColors?: CustomColorPalette;
  useCustomColors?: boolean;
  saving?: boolean;
  onChange: (colors: CustomColorPalette, useCustom: boolean) => void;
  onSave: (colors: CustomColorPalette, useCustom: boolean) => void;
}

export default function CustomColorCustomizer({
  currentTheme,
  customColors,
  useCustomColors = false,
  saving = false,
  onChange,
  onSave,
}: CustomColorCustomizerProps) {
  const themeFallback = useMemo(() => {
    return BIO_THEMES[currentTheme] || BIO_THEMES["dark-modern"];
  }, [currentTheme]);

  // Working state
  const [enabled, setEnabled] = useState<boolean>(useCustomColors);
  const [backgroundColor, setBackgroundColor] = useState<string>(
    customColors?.backgroundColor || themeFallback.previewBg || "#09090b"
  );
  const [useGradient, setUseGradient] = useState<boolean>(
    Boolean(customColors?.backgroundGradient)
  );
  const [gradientEndColor, setGradientEndColor] = useState<string>("#1e1b4b");
  const [buttonColor, setButtonColor] = useState<string>(
    customColors?.buttonColor || "#1e293b"
  );
  const [buttonTextColor, setButtonTextColor] = useState<string>(
    customColors?.buttonTextColor || "#ffffff"
  );
  const [textColor, setTextColor] = useState<string>(
    customColors?.textColor || "#f8fafc"
  );
  const [accentColor, setAccentColor] = useState<string>(
    customColors?.accentColor || themeFallback.previewAccent || "#f59e0b"
  );
  const [hexErrors, setHexErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    setEnabled(useCustomColors);
    if (customColors) {
      if (customColors.backgroundColor) setBackgroundColor(customColors.backgroundColor);
      if (customColors.buttonColor) setButtonColor(customColors.buttonColor);
      if (customColors.buttonTextColor) setButtonTextColor(customColors.buttonTextColor);
      if (customColors.textColor) setTextColor(customColors.textColor);
      if (customColors.accentColor) setAccentColor(customColors.accentColor);
      if (customColors.backgroundGradient) {
        setUseGradient(true);
      }
    }
  }, [customColors, useCustomColors]);

  // Compute active background gradient string if toggled
  const currentGradient = useMemo(() => {
    if (!useGradient) return undefined;
    return `linear-gradient(135deg, ${backgroundColor} 0%, ${gradientEndColor} 100%)`;
  }, [useGradient, backgroundColor, gradientEndColor]);

  // Compute full palette snapshot
  const activePalette = useMemo<CustomColorPalette>(() => {
    return {
      backgroundColor,
      backgroundGradient: currentGradient,
      buttonColor,
      buttonTextColor,
      textColor,
      accentColor,
    };
  }, [backgroundColor, currentGradient, buttonColor, buttonTextColor, textColor, accentColor]);

  // Contrast calculations
  const buttonContrast = useMemo(() => {
    return getContrastRatio(buttonColor, buttonTextColor);
  }, [buttonColor, buttonTextColor]);

  const pageContrast = useMemo(() => {
    return getContrastRatio(backgroundColor, textColor);
  }, [backgroundColor, textColor]);

  // Propagate changes live to parent preview
  const handleUpdate = (updatedColors: CustomColorPalette, isCustom: boolean) => {
    onChange(updatedColors, isCustom);
  };

  const handleToggleCustom = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    handleUpdate(activePalette, newEnabled);
  };

  const handleApplyPreset = (preset: ColorPalettePreset) => {
    const p = preset.palette;
    if (p.backgroundColor) setBackgroundColor(p.backgroundColor);
    if (p.buttonColor) setButtonColor(p.buttonColor);
    if (p.buttonTextColor) setButtonTextColor(p.buttonTextColor);
    if (p.textColor) setTextColor(p.textColor);
    if (p.accentColor) setAccentColor(p.accentColor);
    setUseGradient(Boolean(p.backgroundGradient));
    setEnabled(true);
    handleUpdate(p, true);
  };

  const handleResetToTheme = () => {
    const defaultPalette: CustomColorPalette = {
      backgroundColor: themeFallback.previewBg,
      backgroundGradient: undefined,
      buttonColor: "#18181b",
      buttonTextColor: "#ffffff",
      textColor: "#ffffff",
      accentColor: themeFallback.previewAccent,
    };
    setBackgroundColor(defaultPalette.backgroundColor || "#09090b");
    setButtonColor(defaultPalette.buttonColor || "#18181b");
    setButtonTextColor(defaultPalette.buttonTextColor || "#ffffff");
    setTextColor(defaultPalette.textColor || "#ffffff");
    setAccentColor(defaultPalette.accentColor || "#f59e0b");
    setUseGradient(false);
    setEnabled(false);
    handleUpdate(defaultPalette, false);
  };

  const handleColorFieldChange = (
    field: "bg" | "bgEnd" | "btn" | "btnText" | "text" | "accent",
    value: string
  ) => {
    let cleanVal = value.trim();
    if (!cleanVal.startsWith("#") && cleanVal.length > 0) {
      cleanVal = "#" + cleanVal;
    }

    if (isValidHexColor(cleanVal)) {
      setHexErrors((prev) => ({ ...prev, [field]: "" }));
    } else {
      setHexErrors((prev) => ({ ...prev, [field]: "Enter valid HEX (e.g. #3b82f6)" }));
    }

    let updatedPalette = { ...activePalette };

    switch (field) {
      case "bg":
        setBackgroundColor(cleanVal);
        updatedPalette.backgroundColor = cleanVal;
        if (useGradient) {
          updatedPalette.backgroundGradient = `linear-gradient(135deg, ${cleanVal} 0%, ${gradientEndColor} 100%)`;
        }
        break;
      case "bgEnd":
        setGradientEndColor(cleanVal);
        if (useGradient) {
          updatedPalette.backgroundGradient = `linear-gradient(135deg, ${backgroundColor} 0%, ${cleanVal} 100%)`;
        }
        break;
      case "btn":
        setButtonColor(cleanVal);
        updatedPalette.buttonColor = cleanVal;
        break;
      case "btnText":
        setButtonTextColor(cleanVal);
        updatedPalette.buttonTextColor = cleanVal;
        break;
      case "text":
        setTextColor(cleanVal);
        updatedPalette.textColor = cleanVal;
        break;
      case "accent":
        setAccentColor(cleanVal);
        updatedPalette.accentColor = cleanVal;
        break;
    }

    if (enabled && isValidHexColor(cleanVal)) {
      handleUpdate(updatedPalette, true);
    }
  };

  const handleSave = () => {
    onSave(activePalette, enabled);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="rounded-3xl bg-zinc-900/60 border border-white/10 p-6 space-y-6 animate-fadeIn">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-accent" />
            <span>Custom Colors &amp; Styling</span>
          </h3>
          <p className="text-xs text-brand-400 mt-1">
            Personalize your background, buttons, text, and accents inspired by Linktree.
          </p>
        </div>

        {/* Enable Custom Palette Toggle */}
        <label className="inline-flex items-center gap-3 cursor-pointer self-start sm:self-auto bg-black/40 px-3.5 py-2 rounded-xl border border-white/10">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggleCustom(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent relative" />
          <span className="text-xs font-semibold text-white">
            {enabled ? "Custom Colors Active" : "Use Preset Theme"}
          </span>
        </label>
      </div>

      {/* Preset Palettes Quick Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-accent" />
            <span>Preset Color Palettes</span>
          </span>
          <span className="text-[11px] text-brand-400">Click to instantly apply</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {COLOR_PALETTE_PRESETS.map((preset) => {
            const p = preset.palette;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="p-2.5 rounded-2xl border border-white/10 hover:border-white/30 bg-zinc-950/60 hover:bg-zinc-900 transition-all text-left group cursor-pointer"
                title={preset.description}
              >
                {/* Visualizer Swatch */}
                <div
                  className="h-10 rounded-xl mb-2 p-1.5 flex flex-col justify-between border border-white/10 relative overflow-hidden"
                  style={{
                    background: p.backgroundGradient || p.backgroundColor,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.accentColor }}
                    />
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.textColor }}
                    />
                  </div>
                  <div
                    className="w-full h-2 rounded-sm opacity-90"
                    style={{ backgroundColor: p.buttonColor }}
                  />
                </div>
                <div className="text-[11px] font-bold text-white truncate">{preset.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Individual Color Pickers Grid */}
      <div className="space-y-4 pt-2">
        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-accent" />
          <span>Detailed Color Customizer</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Page Background Color */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-300">Page Background</label>
              <div
                className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                style={{ backgroundColor }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isValidHexColor(backgroundColor) ? backgroundColor : "#000000"}
                onChange={(e) => handleColorFieldChange("bg", e.target.value)}
                className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => handleColorFieldChange("bg", e.target.value)}
                placeholder="#09090b"
                maxLength={7}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-accent uppercase"
              />
            </div>
            {hexErrors.bg && <p className="text-[10px] text-red-400">{hexErrors.bg}</p>}

            {/* Gradient Background Toggle */}
            <div className="pt-2 border-t border-white/10">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] text-brand-300">
                <input
                  type="checkbox"
                  checked={useGradient}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setUseGradient(next);
                    if (enabled) {
                      const updated = {
                        ...activePalette,
                        backgroundGradient: next
                          ? `linear-gradient(135deg, ${backgroundColor} 0%, ${gradientEndColor} 100%)`
                          : undefined,
                      };
                      handleUpdate(updated, true);
                    }
                  }}
                  className="rounded bg-zinc-800 border-white/20 text-accent focus:ring-accent w-3.5 h-3.5"
                />
                <span>Enable Two-Tone Gradient</span>
              </label>

              {useGradient && (
                <div className="flex items-center gap-2 mt-2 pt-1 animate-fadeIn">
                  <input
                    type="color"
                    value={isValidHexColor(gradientEndColor) ? gradientEndColor : "#1e1b4b"}
                    onChange={(e) => handleColorFieldChange("bgEnd", e.target.value)}
                    className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={gradientEndColor}
                    onChange={(e) => handleColorFieldChange("bgEnd", e.target.value)}
                    placeholder="#1e1b4b"
                    maxLength={7}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-white font-mono text-[11px] focus:outline-none focus:border-accent uppercase"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Button Background Color */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-300">Button Background</label>
              <div
                className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                style={{ backgroundColor: buttonColor }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isValidHexColor(buttonColor) ? buttonColor : "#1e293b"}
                onChange={(e) => handleColorFieldChange("btn", e.target.value)}
                className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={buttonColor}
                onChange={(e) => handleColorFieldChange("btn", e.target.value)}
                placeholder="#1e293b"
                maxLength={7}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-accent uppercase"
              />
            </div>
            {hexErrors.btn && <p className="text-[10px] text-red-400">{hexErrors.btn}</p>}
            <p className="text-[10px] text-brand-500">Color applied to link buttons</p>
          </div>

          {/* 3. Button Text Color */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-300">Button Text Color</label>
              <div
                className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                style={{ backgroundColor: buttonTextColor }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isValidHexColor(buttonTextColor) ? buttonTextColor : "#ffffff"}
                onChange={(e) => handleColorFieldChange("btnText", e.target.value)}
                className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={buttonTextColor}
                onChange={(e) => handleColorFieldChange("btnText", e.target.value)}
                placeholder="#ffffff"
                maxLength={7}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-accent uppercase"
              />
            </div>
            {hexErrors.btnText && <p className="text-[10px] text-red-400">{hexErrors.btnText}</p>}
            <p className="text-[10px] text-brand-500">Labels &amp; icons inside buttons</p>
          </div>

          {/* 4. Page Text Color */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-300">Headings &amp; Bio Text</label>
              <div
                className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                style={{ backgroundColor: textColor }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isValidHexColor(textColor) ? textColor : "#f8fafc"}
                onChange={(e) => handleColorFieldChange("text", e.target.value)}
                className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => handleColorFieldChange("text", e.target.value)}
                placeholder="#f8fafc"
                maxLength={7}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-accent uppercase"
              />
            </div>
            {hexErrors.text && <p className="text-[10px] text-red-400">{hexErrors.text}</p>}
            <p className="text-[10px] text-brand-500">Display name &amp; bio text</p>
          </div>

          {/* 5. Accent Color */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-300">Accent &amp; Highlights</label>
              <div
                className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                style={{ backgroundColor: accentColor }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isValidHexColor(accentColor) ? accentColor : "#f59e0b"}
                onChange={(e) => handleColorFieldChange("accent", e.target.value)}
                className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => handleColorFieldChange("accent", e.target.value)}
                placeholder="#f59e0b"
                maxLength={7}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-accent uppercase"
              />
            </div>
            {hexErrors.accent && <p className="text-[10px] text-red-400">{hexErrors.accent}</p>}
            <p className="text-[10px] text-brand-500">Avatar border glow &amp; handle</p>
          </div>

          {/* 6. Live Contrast & Accessibility Monitor */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-brand-300">Readability &amp; Contrast</span>
                <span className="text-[10px] font-mono text-brand-400">WCAG Guidelines</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-brand-400">Button Contrast:</span>
                  <span
                    className={`font-mono font-bold ${
                      buttonContrast >= 4.5
                        ? "text-emerald-400"
                        : buttonContrast >= 3
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {buttonContrast.toFixed(1)}:1
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-400">Page Contrast:</span>
                  <span
                    className={`font-mono font-bold ${
                      pageContrast >= 4.5
                        ? "text-emerald-400"
                        : pageContrast >= 3
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {pageContrast.toFixed(1)}:1
                  </span>
                </div>
              </div>
            </div>

            {buttonContrast < 3 ? (
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-1.5 text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span>Low contrast: Button text may be hard to read.</span>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1.5 text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>Good readability ratio.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleResetToTheme}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-brand-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Theme Default</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span>Saving Palette...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Color Palette</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
