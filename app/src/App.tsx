import type { FC } from "react";

import { MotionDetector } from "./components/MotionDetector";

interface AppProps {}

const App: FC<AppProps> = () => {
  return <MotionDetector />;
};

export default App;
