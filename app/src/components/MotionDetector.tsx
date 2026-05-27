import type { FC } from "react";

import { useMotionDetection } from "../hooks/useMotionDetection";

import styles from "./MotionDetector.module.css";

interface MotionDetectorProps {}

export const MotionDetector: FC<MotionDetectorProps> = () => {
  const { videoRef, overlayRef, motion, error } = useMotionDetection();

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
