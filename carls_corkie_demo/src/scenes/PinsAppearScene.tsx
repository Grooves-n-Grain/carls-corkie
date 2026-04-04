import { Sequence } from "remotion";
import { CorkBackground } from "../components/CorkBackground";
import { PinCard, getRotation } from "../components/PinCard";
import { TaskPin } from "../components/pins/TaskPin";
import { AlertPin } from "../components/pins/AlertPin";
import { GitHubPin } from "../components/pins/GitHubPin";
import { EventPin } from "../components/pins/EventPin";
import { TrackingPin } from "../components/pins/TrackingPin";
import { IdeaPin } from "../components/pins/IdeaPin";
import { TextOverlay } from "../components/TextOverlay";


const PINS: {
  id: string;
  delay: number;
  x: number;
  y: number;
  component: React.ReactNode;
}[] = [
  {
    id: "t1",
    delay: 15,
    x: 80,
    y: 60,
    component: (
      <TaskPin
        title="Review launch checklist"
        content="[ ] Update README\n[x] Push to GitHub\n[ ] Post on Twitter"
        priority={1}
      />
    ),
  },
  {
    id: "a1",
    delay: 55,
    x: 360,
    y: 80,
    component: (
      <AlertPin
        title="API rate limit at 94%"
        content="OpenRouter throttling detected"
      />
    ),
  },
  {
    id: "g1",
    delay: 95,
    x: 620,
    y: 55,
    component: (
      <GitHubPin
        repo="carl/carls-corkie"
        stars={42}
        forks={7}
        description="AI-powered real-time corkboard for ADHD brains"
      />
    ),
  },
  {
    id: "e1",
    delay: 135,
    x: 120,
    y: 280,
    component: (
      <EventPin
        title="Demo call with investor"
        date="Fri, Mar 28"
        time="2:00 PM"
        soon
      />
    ),
  },
  {
    id: "tr1",
    delay: 175,
    x: 390,
    y: 270,
    component: (
      <TrackingPin
        title="Mechanical keyboard"
        carrier="FedEx"
        trackingNumber="7489 2301 8847"
        status="out-for-delivery"
        arrivingToday
      />
    ),
  },
  {
    id: "i1",
    delay: 215,
    x: 670,
    y: 265,
    component: (
      <IdeaPin
        title="AI-generated weekly briefings"
        verdict="hot"
        summary="Summarize the week's pins into a morning briefing card."
        scores={[
          { label: "Viability", score: 9 },
          { label: "Effort", score: 4 },
          { label: "Market fit", score: 8 },
        ]}
      />
    ),
  },
];

export const PinsAppearScene: React.FC = () => {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CorkBackground>
        {/* Branding watermark */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 24,
            fontSize: 18,
            color: "rgba(168,155,140,0.4)",
            fontFamily: "Patrick Hand, cursive",
          }}
        >
          carl's corkie
        </div>

        {PINS.map((pin) => (
          <Sequence key={pin.id} from={pin.delay} layout="none">
            <div
              style={{
                position: "absolute",
                left: pin.x,
                top: pin.y,
              }}
            >
              <PinCard rotation={getRotation(pin.id)} delay={0}>
                {pin.component}
              </PinCard>
            </div>
          </Sequence>
        ))}

        <TextOverlay
          text="Your AI posts what needs attention"
          startFrame={30}
          holdFrames={80}
          size={26}
        />
      </CorkBackground>
    </div>
  );
};
