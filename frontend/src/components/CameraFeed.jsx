import { useEffect } from 'react';

export default function CameraFeed({ videoRef, stream, proctoringStatus }) {
  useEffect(() => {
    if (videoRef?.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stream]);

  const statusColor = () => {
    if (!proctoringStatus.faceDetected) return 'bg-red-500';
    if (proctoringStatus.faceCount > 1) return 'bg-red-500';
    if (proctoringStatus.gazeDirection !== 'center') return 'bg-amber-500';
    return 'bg-green-500';
  };

  const statusText = () => {
    if (!proctoringStatus.faceDetected) return 'No Face';
    if (proctoringStatus.faceCount > 1) return `${proctoringStatus.faceCount} Faces`;
    if (proctoringStatus.gazeDirection !== 'center') return `Looking ${proctoringStatus.gazeDirection}`;
    return 'Monitoring';
  };

  return (
    <div className="camera-box">
      <video ref={videoRef} autoPlay playsInline muted className="bg-stone-100" />

      {stream && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
          <span className={`w-2 h-2 rounded-full animate-pulse ${statusColor()}`} />
          {statusText()}
        </div>
      )}

      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400">
          <span className="text-4xl">📷</span>
          <span className="text-sm">Starting camera...</span>
        </div>
      )}
    </div>
  );
}
