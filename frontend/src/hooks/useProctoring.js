/**
 * useProctoring — Custom hook for real-time CV proctoring using MediaPipe + TensorFlow.js.
 *
 * Detects: face presence, multiple faces, gaze direction (left/right/center/away),
 * and tab visibility changes. Fires violation callbacks.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export default function useProctoring(videoRef, onViolation) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState({
    faceDetected: false,
    gazeDirection: 'center',
    faceCount: 0,
    modelLoaded: false,
  });

  const detectorRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastViolationRef = useRef({});
  const VIOLATION_COOLDOWN = 5000; // 5 second cooldown between same violations

  // Load MediaPipe Face Detector
  const loadModels = useCallback(async () => {
    try {
      // Dynamically import TF.js and MediaPipe face detection
      const [tf, faceDetection] = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/+esm'),
        import('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.5/+esm'),
      ]);

      await tf.ready();

      const model = faceDetection.SupportedModels.MediaPipeFaceMesh;
      const detector = await faceDetection.createDetector(model, {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 3,
      });

      detectorRef.current = detector;
      setIsLoaded(true);
      setStatus((prev) => ({ ...prev, modelLoaded: true }));
      return true;
    } catch (error) {
      console.error('Failed to load proctoring models:', error);
      // Fallback: run without ML models, just use tab visibility
      setIsLoaded(true);
      setStatus((prev) => ({ ...prev, modelLoaded: false }));
      return false;
    }
  }, []);

  // Check if a violation should trigger (cooldown logic)
  const shouldTriggerViolation = useCallback((type) => {
    const now = Date.now();
    const lastTime = lastViolationRef.current[type] || 0;
    if (now - lastTime > VIOLATION_COOLDOWN) {
      lastViolationRef.current[type] = now;
      return true;
    }
    return false;
  }, []);

  // Estimate gaze direction from face landmarks
  const estimateGaze = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 468) return 'center';

    // Key landmarks: nose tip (1), left eye center (159), right eye center (386)
    const noseTip = landmarks[1];
    const leftEye = landmarks[159];
    const rightEye = landmarks[386];

    if (!noseTip || !leftEye || !rightEye) return 'center';

    // Calculate eye midpoint
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeWidth = Math.abs(rightEye.x - leftEye.x);

    // Calculate horizontal offset of nose from eye midpoint
    const noseOffsetX = (noseTip.x - eyeMidX) / (eyeWidth || 1);

    // Thresholds for gaze direction
    if (noseOffsetX < -0.15) return 'right'; // Mirrored view
    if (noseOffsetX > 0.15) return 'left';   // Mirrored view

    // Vertical check - looking up or down significantly
    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    const noseOffsetY = (noseTip.y - eyeMidY) / (eyeWidth || 1);

    if (noseOffsetY > 0.8) return 'down';
    if (noseOffsetY < 0.2) return 'up';

    return 'center';
  }, []);

  // Detection loop
  const detectFaces = useCallback(async () => {
    if (!videoRef?.current || !detectorRef.current) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    try {
      const faces = await detectorRef.current.estimateFaces(video, {
        flipHorizontal: false,
      });

      const faceCount = faces.length;
      let gazeDirection = 'center';
      let faceDetected = faceCount > 0;

      if (faceCount === 1 && faces[0].keypoints) {
        gazeDirection = estimateGaze(faces[0].keypoints);
      }

      setStatus({
        faceDetected,
        gazeDirection,
        faceCount,
        modelLoaded: true,
      });

      // Check violations
      if (!faceDetected && shouldTriggerViolation('no_face')) {
        onViolation?.({
          type: 'no_face',
          message: 'No face detected — please face the camera',
        });
      }

      if (faceCount > 1 && shouldTriggerViolation('multiple_faces')) {
        onViolation?.({
          type: 'multiple_faces',
          message: `${faceCount} faces detected — only candidate should be visible`,
        });
      }

      if (faceDetected && gazeDirection !== 'center' && shouldTriggerViolation('looking_away')) {
        onViolation?.({
          type: 'looking_away',
          message: `Looking ${gazeDirection} — please focus on the screen`,
        });
      }
    } catch (error) {
      // Silently continue on detection errors
    }

    if (isRunning) {
      // Run at ~2fps (500ms) for performance
      setTimeout(() => {
        animFrameRef.current = requestAnimationFrame(detectFaces);
      }, 500);
    }
  }, [videoRef, isRunning, estimateGaze, shouldTriggerViolation, onViolation]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && shouldTriggerViolation('tab_switch')) {
        onViolation?.({
          type: 'tab_switch',
          message: 'Tab switch detected — please stay on this page',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [shouldTriggerViolation, onViolation]);

  // Start proctoring
  const startProctoring = useCallback(async () => {
    if (!isLoaded) {
      await loadModels();
    }
    setIsRunning(true);
  }, [isLoaded, loadModels]);

  // Effect to start detection loop when running
  useEffect(() => {
    if (isRunning && isLoaded && detectorRef.current) {
      detectFaces();
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRunning, isLoaded, detectFaces]);

  // Stop proctoring
  const stopProctoring = useCallback(() => {
    setIsRunning(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  return {
    isLoaded,
    isRunning,
    status,
    startProctoring,
    stopProctoring,
    loadModels,
  };
}
