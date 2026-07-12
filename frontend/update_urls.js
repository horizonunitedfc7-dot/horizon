const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // 1. Replace single-quoted strings: 'http://localhost:5000/api/fees'
      // -> `${process.env.NEXT_PUBLIC_API_URL || 'https://horizon-backend-production-4f7a.up.railway.app'}/api/fees`
      const singleQuoteRegex = /'http:\/\/localhost:5000([^']*)'/g;
      if (singleQuoteRegex.test(content)) {
        content = content.replace(singleQuoteRegex, '`${process.env.NEXT_PUBLIC_API_URL || "https://horizon-backend-production-4f7a.up.railway.app"}$1`');
        modified = true;
      }

      // 2. Replace double-quoted strings: "http://localhost:5000/api/fees"
      const doubleQuoteRegex = /"http:\/\/localhost:5000([^"]*)"/g;
      if (doubleQuoteRegex.test(content)) {
        content = content.replace(doubleQuoteRegex, '`${process.env.NEXT_PUBLIC_API_URL || "https://horizon-backend-production-4f7a.up.railway.app"}$1`');
        modified = true;
      }

      // 3. Replace inside existing backticks: `http://localhost:5000/api/fees`
      // Here we just replace the text since it's already a template literal
      const backtickRegex = /http:\/\/localhost:5000/g;
      // Note: This might replace inside already modified template strings if we're not careful,
      // but since we just replaced single/double quotes, the remaining "http://localhost:5000"
      // are either inside backticks or somewhere else.
      if (backtickRegex.test(content)) {
        content = content.replace(backtickRegex, '${process.env.NEXT_PUBLIC_API_URL || "https://horizon-backend-production-4f7a.up.railway.app"}');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
