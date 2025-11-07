"use client";

import { useState } from "react";
import { CiBatteryEmpty, CiBatteryFull } from "react-icons/ci";
import { TbAccessPoint } from "react-icons/tb";
import { TbAccessPointOff } from "react-icons/tb";

export const dynamic = "force-dynamic";

export default function Page() {
  const [showPass, setShowPass] = useState(true);
  const [showPower, setShowPower] = useState(true);
  return (
    <div>
      <button type="button" onClick={() => setShowPass(!showPass)}>
        {showPass ? (
          <TbAccessPoint className="w-10 h-10" />
        ) : (
          <TbAccessPointOff className="w-10 h-10" />
        )}
      </button>

      <button type="button" onClick={() => setShowPower(!showPower)}>
        {showPower ? (
          <CiBatteryEmpty className="w-10 h-10" />
        ) : (
          <CiBatteryFull className="w-10 h-10" />
        )}
      </button>
    </div>
  );
}
