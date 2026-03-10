"use client";

import { useState, useCallback } from "react";

const CONTROL_IDS = ["shadowDepth", "styleIntensity", "skinNaturalness"] as const;
const DEFAULT_VALUES: Record<string, number> = {
  shadowDepth: 0.5,
  styleIntensity: 0.7,
  skinNaturalness: 0.8,
};

const LABELS: Record<string, string> = {
  shadowDepth: "Shadow depth",
  styleIntensity: "Style intensity",
  skinNaturalness: "Skin naturalness",
};

export function PrecisionControlStrip({
  projectId,
  initialValues,
  onChange,
}: {
  projectId: string;
  initialValues?: Record<string, number>;
  onChange?: (values: Record<string, number>) => void;
}) {
  const [values, setValues] = useState<Record<string, number>>(() => ({
    ...DEFAULT_VALUES,
    ...initialValues,
  }));

  const persist = useCallback(
    (next: Record<string, number>) => {
      if (!projectId) return;
      fetch(`/api/projects/${projectId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ precisionSettings: next }),
      }).catch(() => {});
      onChange?.(next);
    },
    [projectId, onChange]
  );

  const handleChange = useCallback(
    (id: string, value: number) => {
      const next = { ...values, [id]: value };
      setValues(next);
      persist(next);
    },
    [values, persist]
  );

  return (
    <div className="space-y-4 pt-4 border-t border-white/5">
      <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
        Precision
      </p>
      {CONTROL_IDS.map((id) => (
        <div key={id} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] uppercase opacity-60">{LABELS[id]}</span>
            <span className="font-mono text-[10px] text-primary">
              {Math.round((values[id] ?? DEFAULT_VALUES[id]) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={values[id] ?? DEFAULT_VALUES[id]}
            onChange={(e) => handleChange(id, parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-primary"
          />
        </div>
      ))}
    </div>
  );
}
