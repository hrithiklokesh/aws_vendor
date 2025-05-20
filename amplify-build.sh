#!/bin/bash

# Create the missing file for motion-utils
mkdir -p node_modules/motion-utils/dist/es
cat > node_modules/motion-utils/dist/es/globalThis-config.mjs << 'EOF'
// Placeholder file to satisfy import
export const MotionGlobalConfig = {
  useManualTiming: false
};
EOF

# Run the build
npm run build