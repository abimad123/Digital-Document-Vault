function featuresFor(name, mime) {
  const base = String(name || '').toLowerCase();
  const stem = base.replace(/\.[^.]+$/, '');
  const words = stem.match(/[a-z]{3,}/g) || [];
  return new Set([
    `mime=${String(mime || 'unknown').toLowerCase()}`,
    `extension=${base.includes('.') ? base.split('.').pop() : 'none'}`,
    ...words.map(word => `word=${word}`)
  ]);
}

function predictCategory(model, name, mime) {
  if (!model?.trees?.length || !model?.classes?.length) return null;
  const features = featuresFor(name, mime);
  const scores = Array(model.classes.length).fill(0);
  for (const tree of model.trees) {
    let node = 0;
    while (tree.left[node] !== -1) {
      const value = features.has(model.features[tree.feature[node]]) ? 1 : 0;
      node = value <= tree.threshold[node] ? tree.left[node] : tree.right[node];
    }
    const votes = tree.value[node];
    const total = votes.reduce((sum, vote) => sum + vote, 0);
    if (total) votes.forEach((vote, index) => { scores[index] += vote / total; });
  }
  const index = scores.indexOf(Math.max(...scores));
  return { category: model.classes[index], confidence: Math.round(scores[index] / model.trees.length * 100) / 100 };
}

module.exports = { featuresFor, predictCategory };
