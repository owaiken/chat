const { execSync } = require('child_process');
const fs = require('fs');

// Check if TypeScript is installed
try {
  // Try to install TypeScript and React types explicitly
  console.log('Installing TypeScript dependencies...');
  execSync('npm install --save-dev typescript@5.3.3 @types/react@18.2.48 @types/react-dom@18.2.18', { 
    stdio: 'inherit'
  });
  
  console.log('TypeScript dependencies installed successfully.');
} catch (error) {
  console.error('Failed to install TypeScript dependencies:', error);
  process.exit(1);
}

// Check if tsconfig.json exists
if (!fs.existsSync('./tsconfig.json')) {
  console.log('Creating tsconfig.json...');
  
  const tsConfig = {
    "compilerOptions": {
      "target": "es5",
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "forceConsistentCasingInFileNames": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "node",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [
        {
          "name": "next"
        }
      ],
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  };
  
  fs.writeFileSync('./tsconfig.json', JSON.stringify(tsConfig, null, 2));
  console.log('tsconfig.json created successfully.');
}

console.log('Dependencies setup completed.');
