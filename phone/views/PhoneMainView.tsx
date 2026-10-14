import React from "react";
import type { PhoneNavId } from "../components/PhoneSidebarNav";
import { DevicesView } from "./DevicesView";
import { GatewayView } from "./GatewayView";
import { TouchKeysDemo } from "./TouchKeysDemo";
import { AppControlDemo } from "./AppControlDemo";
import { SystemPrivDemo } from "./SystemPrivDemo";
import { ScreenshotDemo } from "./ScreenshotDemo";
import { EventStreamDemo } from "./EventStreamDemo";
import { NewWorkView } from "./NewWorkView";

interface PhoneMainViewProps {
  activeNav: PhoneNavId;
  onNavigate?: (nav: PhoneNavId) => void;
}

export function PhoneMainView({
  activeNav,
  onNavigate,
}: PhoneMainViewProps): React.JSX.Element {
  const goToDevices = () => {
    if (onNavigate) onNavigate("my-phones");
  };
  const goToGateway = () => {
    if (onNavigate) onNavigate("gateway");
  };

  switch (activeNav) {
    case "my-phones":
      return <DevicesView />;
    case "gateway":
      return <GatewayView />;
    case "touch-keys":
      return <TouchKeysDemo onNavigateToDevices={goToDevices} />;
    case "app-control":
      return <AppControlDemo onNavigateToDevices={goToDevices} />;
    case "system-priv":
      return <SystemPrivDemo onNavigateToDevices={goToDevices} />;
    case "screenshot":
      return <ScreenshotDemo onNavigateToDevices={goToDevices} />;
    case "event-stream":
      return <EventStreamDemo onNavigateToGateway={goToGateway} />;
    case "new-work":
      return <NewWorkView />;
    default:
      return <DevicesView />;
  }
}

