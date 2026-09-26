import React from "react";
import type { PhoneNavId } from "../components/PhoneSidebarNav";
import { DevicesView } from "./DevicesView";
import { GatewayView } from "./GatewayView";
import { TouchKeysDemo } from "./TouchKeysDemo";
import { AppControlDemo } from "./AppControlDemo";
import { SystemPrivDemo } from "./SystemPrivDemo";
import { ScreenshotDemo } from "./ScreenshotDemo";
import { EventStreamDemo } from "./EventStreamDemo";

interface PhoneMainViewProps {
  activeNav: PhoneNavId;
}

export function PhoneMainView({ activeNav }: PhoneMainViewProps): React.JSX.Element {
  switch (activeNav) {
    case "my-phones":
      return <DevicesView />;
    case "gateway":
      return <GatewayView />;
    case "touch-keys":
      return <TouchKeysDemo />;
    case "app-control":
      return <AppControlDemo />;
    case "system-priv":
      return <SystemPrivDemo />;
    case "screenshot":
      return <ScreenshotDemo />;
    case "event-stream":
      return <EventStreamDemo />;
    case "new-work":
      return <DevicesView />;
    default:
      return <DevicesView />;
  }
}
