import NextEventWidget from "./NextEventWidget";
import PollWidget from "./PollWidget";
import ClockWidget from "./ClockWidget";
import RssWidget from "./RssWidget";
import ShowcaseWidget from "./ShowcaseWidget";
import IframeWidget from "./IframeWidget";
import QuoteWidget from "./QuoteWidget";
import WeatherWidget from "./WeatherWidget";
import PuzzleWidget from "./PuzzleWidget";
import BusinessCardWidget from "./BusinessCardWidget";
import GalleryWidget from "./GalleryWidget";
import SpoWidget from "./SpoWidget";
import WordWidget from "./WordWidget";
import WordleWidget from "./WordleWidget";
import TransportWidget from "./TransportWidget";
import SocialWidget from "./SocialWidget";
import JobsWidget from "./JobsWidget";
import StudentWidget from "./StudentWidget";
import CryptoWidget from "./CryptoWidget";
import CountdownWidget from "./CountdownWidget";
import GithubTrendingWidget from "./GithubTrendingWidget";
import HubWidget from "./HubWidget";
import NetworkStatusWidget from "./NetworkStatusWidget";
import CampusMapWidget from "./CampusMapWidget";
import SpoVideoWidget from "./SpoVideoWidget";
import VideoWidget from "./VideoWidget";
import BFMStreamWidget from "./BFMStreamWidget";

export const WIDGET_COMPONENTS = {
  "next-event": NextEventWidget,
  poll: PollWidget,
  clock: ClockWidget,
  rss: RssWidget,
  showcase: ShowcaseWidget,
  iframe: IframeWidget,
  quote: QuoteWidget,
  weather: WeatherWidget,
  puzzle: PuzzleWidget,
  business: BusinessCardWidget,
  gallery: GalleryWidget,
  spo: SpoWidget,
  word: WordWidget,
  wordle: WordleWidget,
  transport: TransportWidget,
  social: SocialWidget,
  jobs: JobsWidget,
  student: StudentWidget,
  crypto: CryptoWidget,
  countdown: CountdownWidget,
  "github-trending": GithubTrendingWidget,
  hub: HubWidget,
  "network-status": NetworkStatusWidget,
  "campus-map": CampusMapWidget,
  "spo-video": SpoVideoWidget,
  video: VideoWidget,
  "bfm-stream": BFMStreamWidget,
};

export function renderWidget(widget, mode) {
  const Component = WIDGET_COMPONENTS[widget.type];
  if (!Component) return null;
  return <Component widget={widget} mode={mode} />;
}
