import { interpolate, useCurrentFrame } from "remotion";
import { CorkBackground } from "../components/CorkBackground";
import { PinCard, getRotation } from "../components/PinCard";
import { TaskPin } from "../components/pins/TaskPin";
import { AlertPin } from "../components/pins/AlertPin";
import { GitHubPin } from "../components/pins/GitHubPin";
import { EventPin } from "../components/pins/EventPin";
import { TrackingPin } from "../components/pins/TrackingPin";
import { IdeaPin } from "../components/pins/IdeaPin";
import { TextOverlay } from "../components/TextOverlay";

export const BoardAliveScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Subtle parallax drift on the whole board
  const boardDrift = interpolate(frame, [0, 210], [0, -8], { extrapolateRight: "clamp" });

  // GitHub pin lift (frames 110–150)
  const githubLift = interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

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

        <div style={{ transform: `translateY(${boardDrift}px)` }}>
          {/* Task pin — animates checklist at frame 10 */}
          <div style={{ position: "absolute", left: 80, top: 60 }}>
            <PinCard rotation={getRotation("t1")}>
              <TaskPin
                title="Review launch checklist"
                content="[ ] Update README\n[x] Push to GitHub\n[ ] Post on Twitter"
                priority={1}
                checkItemAtFrame={10}
              />
            </PinCard>
          </div>

          {/* Alert pin — pulsing */}
          <div style={{ position: "absolute", left: 360, top: 80 }}>
            <PinCard rotation={getRotation("a1")}>
              <AlertPin
                title="API rate limit at 94%"
                content="OpenRouter throttling detected"
                pulse
              />
            </PinCard>
          </div>

          {/* GitHub pin — lifts on hover */}
          <div style={{ position: "absolute", left: 620, top: 55 }}>
            <PinCard rotation={getRotation("g1")} lifted={githubLift > 0.5}>
              <GitHubPin
                repo="carl/carls-corkie"
                stars={42}
                forks={7}
                description="AI-powered real-time corkboard for ADHD brains"
              />
            </PinCard>
          </div>

          {/* Event pin */}
          <div style={{ position: "absolute", left: 120, top: 290 }}>
            <PinCard rotation={getRotation("e1")}>
              <EventPin
                title="Demo call with investor"
                date="Fri, Mar 28"
                time="2:00 PM"
                soon
              />
            </PinCard>
          </div>

          {/* Tracking pin */}
          <div style={{ position: "absolute", left: 390, top: 280 }}>
            <PinCard rotation={getRotation("tr1")}>
              <TrackingPin
                title="Mechanical keyboard"
                carrier="FedEx"
                trackingNumber="7489 2301 8847"
                status="out-for-delivery"
                arrivingToday
              />
            </PinCard>
          </div>

          {/* Idea pin */}
          <div style={{ position: "absolute", left: 670, top: 275 }}>
            <PinCard rotation={getRotation("i1")}>
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
            </PinCard>
          </div>
        </div>

        <TextOverlay
          text="Tasks, alerts, and 14 pin types"
          startFrame={10}
          holdFrames={60}
          fadeFrames={10}
          size={26}
        />
        <TextOverlay
          text="The board stays alive"
          startFrame={120}
          holdFrames={60}
          fadeFrames={10}
          size={26}
        />
      </CorkBackground>
    </div>
  );
};
