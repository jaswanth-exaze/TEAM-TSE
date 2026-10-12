export function getQuestionTakeaway(question) {
  if (question?.takeaway) return question.takeaway
  const explanation = String(question?.explanation || '').trim()
  if (!explanation) return ''
  for (const match of explanation.matchAll(/[.!?](?=\s|$)/g)) {
    const sentence = explanation.slice(0, match.index + 1).trim()
    if (/\b(?:e\.g|i\.e|etc|vs|mr|mrs|ms|dr)\.$/i.test(sentence)) continue
    if (sentence.length <= 190) return sentence
    break
  }
  if (explanation.length <= 190) return explanation
  const compact = explanation.slice(0, 184).replace(/\s+\S*$/, '').trimEnd()
  return `${compact || explanation.slice(0, 184).trimEnd()}…`
}
