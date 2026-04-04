import "./index.css";
import "./fonts.ts";
import { Composition } from "remotion";
import { CorkieDemo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CorkieDemo"
        component={CorkieDemo}
        durationInFrames={840}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
