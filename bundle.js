const fs = require('fs');
const path = require('path');

const dir = __dirname;
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'css', 'style.css'), 'utf8');
const threeJs = fs.readFileSync(path.join(dir, 'libs', 'three.min.js'), 'utf8');
const audioJs = fs.readFileSync(path.join(dir, 'js', 'audio.js'), 'utf8');
const photoJs = fs.readFileSync(path.join(dir, 'js', 'photo.js'), 'utf8');
const worldJs = fs.readFileSync(path.join(dir, 'js', 'world.js'), 'utf8');
const playerJs = fs.readFileSync(path.join(dir, 'js', 'player.js'), 'utf8');
const eventsJs = fs.readFileSync(path.join(dir, 'js', 'events.js'), 'utf8');
const mainJs = fs.readFileSync(path.join(dir, 'js', 'main.js'), 'utf8');

let bundle = html;

// Replace CSS
bundle = bundle.replace('<link rel="stylesheet" href="css/style.css">', `<style>\n${css}\n</style>`);

// Remove external library script tag
bundle = bundle.replace('<script src="libs/three.min.js"></script>', '');

// Bundle scripts
const scriptsBlock = `
<script>
/* --- THREE.JS STANDALONE --- */
${threeJs}
</script>
<script>
/* --- AUDIO ENGINE --- */
${audioJs}
</script>
<script>
/* --- POLAROID SYSTEM --- */
${photoJs}
</script>
<script>
/* --- 3D MINE WORLD --- */
${worldJs}
</script>
<script>
/* --- PLAYER CONTROLLER --- */
${playerJs}
</script>
<script>
/* --- EVENTS & MINIGAME --- */
${eventsJs}
</script>
<script>
/* --- MAIN ORCHESTRATOR --- */
${mainJs}
</script>
`;

bundle = bundle.replace(
    /<!-- Game Scripts in strict dependency order[\s\S]*?<\/body>/,
    `${scriptsBlock}\n</body>`
);

fs.writeFileSync(path.join(dir, 'canary_standalone.html'), bundle, 'utf8');
console.log('SUCCESS: canary_standalone.html created successfully!');

