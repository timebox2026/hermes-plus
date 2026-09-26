import type React from "react";
import { Monitor, Smartphone } from "lucide-react";
import "./SuiteSwitcher.css";

export interface SuiteSwitcherProps {
  activeSuite: "hermes" | "phone";
  onChange: (suite: "hermes" | "phone") => void;
  collapsed?: boolean;
}

export function SuiteSwitcher({
  activeSuite,
  onChange,
  collapsed = false,
}: SuiteSwitcherProps): React.JSX.Element {
  return (
    <div className={`phone-suite-switcher ${collapsed ? "collapsed" : ""}`}>
      <div className={`phone-suite-capsule active-${activeSuite}`}>
        <div className="phone-suite-slider" />
        <button
          type="button"
          className={`phone-suite-tab ${activeSuite === "hermes" ? "active" : ""}`}
          onClick={() => onChange("hermes")}
          title="电脑模式"
          aria-label="电脑模式"
        >
          <Monitor className="phone-suite-tab-icon" size={15} strokeWidth={2.2} />
          {!collapsed && <span className="phone-suite-tab-label">电脑</span>}
        </button>
        <button
          type="button"
          className={`phone-suite-tab ${activeSuite === "phone" ? "active" : ""}`}
          onClick={() => onChange("phone")}
          title="手机模式"
          aria-label="手机模式"
        >
          <Smartphone className="phone-suite-tab-icon" size={15} strokeWidth={2.2} />
          {!collapsed && <span className="phone-suite-tab-label">手机</span>}
        </button>
      </div>
    </div>
  );
}
