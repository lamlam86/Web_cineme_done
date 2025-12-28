const fs = require('fs');
const path = require('path');

const extensions = ['.js', '.jsx'];
const excludeDirs = ['node_modules', '.next', '.git', 'backend'];

function removeComments(content) {
  let result = content;
  result = result.replace(/\/\/.*$/gm, '');
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/^\s*[\r\n]/gm, '\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = removeComments(content);
    if (content !== cleaned) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      console.log('Cleaned:', filePath);
    }
  } catch (err) {
    console.error('Error processing:', filePath, err.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        walkDir(filePath);
      }
    } else if (extensions.includes(path.extname(file))) {
      processFile(filePath);
    }
  }
}

const rootDir = process.argv[2] || '.';
console.log('Removing comments from:', rootDir);
walkDir(rootDir);
console.log('Done!');

