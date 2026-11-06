const categoryWords = {
  Academic: ['assignment', 'lecture', 'syllabus', 'semester', 'course', 'exam', 'thesis', 'homework', 'tutorial', 'research'],
  Finance: ['invoice', 'receipt', 'bill', 'tax', 'bank', 'salary', 'payment', 'budget', 'statement'],
  Personal: ['resume', 'passport', 'medical', 'health', 'personal', 'family', 'travel', 'photo']
};

export function suggestCategory(fileName) {
  const words = new Set(String(fileName || '').toLowerCase().replace(/\.[^.]+$/, '').split(/[^a-z]+/).filter(Boolean));
  const scores = Object.entries(categoryWords).map(([category, hints]) => ({
    category, score: hints.filter(hint => words.has(hint)).length
  })).sort((a, b) => b.score - a.score);
  if (!scores[0]?.score || scores[0].score === scores[1]?.score) return '';
  return scores[0].category;
}
