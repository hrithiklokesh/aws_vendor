const fs = require('fs');
const path = require('path');

// Path to the motion-utils directory
const motionUtilsDir = path.resolve(__dirname, '../node_modules/motion-utils/dist/es');

// Check if the directory exists
if (fs.existsSync(motionUtilsDir)) {
  // Path to the missing file
  const missingFilePath = path.join(motionUtilsDir, 'globalThis-config.mjs');
  
  // Content for the missing file
  const fileContent = `// Placeholder file to satisfy import
export const MotionGlobalConfig = {
  useManualTiming: false
};`;
  
  // Create the file
  fs.writeFileSync(missingFilePath, fileContent);
  
  console.log('Created placeholder file for motion-utils globalThis-config.mjs');
} else {
  console.log('Motion-utils directory not found, skipping fix');
}