/**
 * VoiceVisualizer — Animated audio bars that respond to listening state.
 */
export default function VoiceVisualizer({ isListening, barCount = 7 }) {
  return (
    <div className={`voice-bars ${isListening ? 'active' : ''}`} id="voice-visualizer">
      {Array.from({ length: barCount }, (_, i) => (
        <div
          key={i}
          className="bar"
          style={{
            height: isListening ? undefined : '4px',
            animationDelay: isListening ? `${(i * 0.08) % 0.5}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}
