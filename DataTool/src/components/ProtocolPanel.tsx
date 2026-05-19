export function ProtocolPanel() {
  return (
    <section className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Collection Protocol</p>
          <h2>Team workflow</h2>
        </div>
      </div>

      <div className="split-grid">
        <div>
          <h3>Collection protocol</h3>
          <ol>
            <li>Enter anonymous Person ID, for example P001.</li>
            <li>Enter Session ID, for example S001.</li>
            <li>Select camera angle.</li>
            <li>Select posture label.</li>
            <li>Sit in the selected posture before recording starts.</li>
            <li>Press Start Recording.</li>
            <li>Hold the posture until recording ends.</li>
            <li>Repeat for all five labels.</li>
            <li>Use front and one angled camera view if possible.</li>
            <li>Export JSON, CSV, and manifest after collection.</li>
            <li>Run validate_dataset.py before using the data.</li>
            <li>Run prepare_dataset.py to create train/val/test files.</li>
          </ol>
          <p className="warning-text">Do not record names, images, or videos.</p>
        </div>

        <div>
          <h3>Realistic dataset target</h3>
          <p>
            Minimum useful target: 4 people, 2 sessions per person, 5 labels, 2 camera angles,
            15 seconds per recording, 5 FPS sampling.
          </p>
          <p>
            Better target: 5 people, 2 sessions per person, 5 labels, 2 camera angles,
            20 seconds per recording, 5 FPS sampling.
          </p>
        </div>
      </div>
    </section>
  );
}
