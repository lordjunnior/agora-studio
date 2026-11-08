import { Config } from "@remotion/cli/config";

// WebGL estável no Windows/Mac/Linux para cenas three.js
Config.setChromiumOpenGlRenderer("angle");
