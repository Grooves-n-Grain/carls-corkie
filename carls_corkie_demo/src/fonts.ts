import { loadFont as loadPatrickHand } from "@remotion/google-fonts/PatrickHand";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const { fontFamily: handwritten } = loadPatrickHand();
export const { fontFamily: ui } = loadInter("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});
