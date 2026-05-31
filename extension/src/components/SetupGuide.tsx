import { BRAND_IMAGES } from "../utils/brandAssets";

type SetupGuideProps = {
  step: 1 | 2 | 3;
};

const STEPS = [
  {
    text: "Start monitoring and allow your camera.",
    hint: "Don't worry — we won't judge (much).",
    tone: "mint",
    art: BRAND_IMAGES.setupStart
  },
  {
    text: "Sit normally, then calibrate your baseline posture.",
    hint: "Pretend you're a classy shrimp.",
    tone: "lavender",
    art: BRAND_IMAGES.setupCalibrate
  },
  {
    text: "Keep this tab open while you work — we'll nudge you if you slouch.",
    hint: "We're annoying for your own good.",
    tone: "peach",
    art: BRAND_IMAGES.setupMonitor
  }
] as const;

export function SetupGuide({ step }: SetupGuideProps) {
  return (
    <ol className="setup-guide">
      {STEPS.map((stepItem, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === step;
        const isDone = stepNumber < step;

        return (
          <li
            key={stepItem.text}
            className={`setup-step setup-step-${stepItem.tone}${isActive ? " active" : ""}${isDone ? " done" : ""}`}
          >
            <span className="setup-step-number">{stepNumber}</span>
            <div className="setup-step-copy">
              <span className="setup-step-text">{stepItem.text}</span>
              <span className="setup-step-hint">{stepItem.hint}</span>
            </div>
            <img className="setup-step-shrimp" src={stepItem.art} alt="" aria-hidden="true" />
          </li>
        );
      })}
    </ol>
  );
}
