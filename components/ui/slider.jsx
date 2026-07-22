import React, { useState, useEffect } from "react";

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 0,
  onChange,
  className = "",
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (onChange) onChange(value);
  }, [value]);

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <span className="text-sm text-gray-600 mt-1">{value}</span>
    </div>
  );
}