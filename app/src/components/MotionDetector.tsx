import type { FC } from "react";

import { useMotionDetection } from "../hooks/useMotionDetection";

import styles from "./MotionDetector.module.css";

interface MotionDetectorProps {}

// smoothedCentroid (0..1) → translate オフセット (vw/vh)。x は映像ミラーに合わせて反転
function toStyle(
  c: { x: number; y: number },
  scaleX: number,
  scaleY: number,
): { transform: string } {
  const x = -(c.x - 0.5) * scaleX;
  const y = (c.y - 0.5) * scaleY;
  return { transform: `translate(calc(-50% + ${x}vw), calc(-50% + ${y}vh))` };
}

export const MotionDetector: FC<MotionDetectorProps> = () => {
  const { videoRef, overlayRef, motion, error } = useMotionDetection();
  const c = motion.smoothedCentroid;
  const eyeStyle = toStyle(c, 40, 10);
  const mouthStyle = toStyle(c, 20, 4);

  if (error) {
    return (
      <div className={styles.errorView}>
        <p>カメラにアクセスできませんでした</p>
        <small>{error}</small>
      </div>
    );
  }

  return (
    <div className={styles.detector}>
      <div className={styles.videoWrap}>
        <video ref={videoRef} muted playsInline />
        <canvas ref={overlayRef} width={640} height={360} />
        <div
          className={`${styles.eye} ${styles.eyeLeft}${motion.isMoving ? ` ${styles.eyeActive}` : ""}`}
          style={eyeStyle}
        />
        <div
          className={`${styles.eye} ${styles.eyeRight}${motion.isMoving ? ` ${styles.eyeActive}` : ""}`}
          style={eyeStyle}
        />
        <div
          className={`${styles.mouth}${motion.isMoving ? ` ${styles.mouthOpen}` : ""}`}
          style={mouthStyle}
        />
        {motion.isMoving && <div className={styles.motionBadge}>動き検出中</div>}
      </div>
      <div className={styles.statusBar}>
        <span className={`${styles.statusDot}${motion.isMoving ? ` ${styles.statusDotOn}` : ""}`} />
        <span className={styles.statusText}>
          {motion.centroid
            ? `x: ${Math.round(motion.centroid.x * 100)}%  y: ${Math.round(motion.centroid.y * 100)}%`
            : "動きなし"}
        </span>
        <span className={styles.statusRatio}>{(motion.ratio * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};
