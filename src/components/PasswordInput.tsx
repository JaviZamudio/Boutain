import { Button, Input } from "@nextui-org/react";
import React, { useState } from "react";

export function PasswordInput({ label, value, onValueChange }: { label: string, value: string, onValueChange: (v: string) => void }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input label={label} value={value} type={showPassword ? "text" : "password"} onValueChange={onValueChange} endContent={
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