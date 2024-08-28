import { Button, Input } from "@nextui-org/react";
import React, { useState } from "react";

export function PasswordInput({ label, value, placeholder, isRequired, onValueChange }: { label: string, value: string, onValueChange: (v: string) => void, placeholder?: string, isRequired?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input label={label} value={value} type={showPassword ? "text" : "password"} onValueChange={onValueChange}
      placeholder={placeholder}
      isRequired={isRequired}
      endContent={
        <Button isIconOnly variant="light" size="sm" onClick={() => setShowPassword(!showPassword)}>
          <span className="material-symbols-outlined">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </Button>
      }
      autoComplete="off"
    />
  )
}