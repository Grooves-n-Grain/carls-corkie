import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroScene } from "./scenes/IntroScene";
import { PinsAppearScene } from "./scenes/PinsAppearScene";
import { BoardAliveScene } from "./scenes/BoardAliveScene";
import { FocusModeScene } from "./scenes/FocusModeScene";
import { OutroScene } from "./scenes/OutroScene";

const TRANSITION_FRAMES = 15;

export const CorkieDemo: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: Intro — 3.5s */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        presentation={fade()}
      />

      {/* Scene 2: AI Posts Pins — 9s */}
      <TransitionSeries.Sequence durationInFrames={270}>
        <PinsAppearScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        presentation={fade()}
      />

      {/* Scene 3: Board Alive — 7s */}
      <TransitionSeries.Sequence durationInFrames={210}>
        <BoardAliveScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        presentation={fade()}
      />

      {/* Scene 4: Focus Mode — 4s */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <FocusModeScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        presentation={fade()}
      />

      {/* Scene 5: Outro — 4.5s */}
      <TransitionSeries.Sequence durationInFrames={135}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
