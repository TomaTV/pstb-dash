import NextEventWidget from "./NextEventWidget";
import PollWidget from "./PollWidget";
import ClockWidget from "./ClockWidget";
import RssWidget from "./RssWidget";

export const WIDGET_COMPONENTS = {
  "next-event": NextEventWidget,
  poll: PollWidget,
  clock: ClockWidget,
  rss: RssWidget,
};

export function renderWidget(widget, mode) {
  const Component = WIDGET_COMPONENTS[widget.type];
  if (!Component) return null;
  return <Component widget={widget} mode={mode} />;
}
