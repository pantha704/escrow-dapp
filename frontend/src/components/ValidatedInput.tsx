import React, { useState, useEffect } from "react";
import type { ValidationResult } from "../utils/validation";

interface ValidatedInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  validator?: (value: string) => ValidationResult;
  type?: "text" | "number";
  disabled?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  placeholder,
  value,
  onChange,
  validator,
  type = "text",
  disabled = false,
}) => {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
  });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (validator && touched) {
      setValidation(validator(value));
    }
  }, [value, validator, touched]);

  const handleBlur = () => {
    setTouched(true);
    if (validator) {
      setValidation(validator(value));
    }
  };

  const borderColor =
    touched && !validation.isValid
      ? "border-red-500/50"
      : "border-purple-500/30 focus:border-purple-400";

  return (
    <div className="space-y-1">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-gray-700/50 rounded-lg border ${borderColor} focus:outline-none text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
      />
      {touched && !validation.isValid && (
        <p className="text-red-400 text-sm">{validation.error}</p>
      )}
    </div>
  );
};
