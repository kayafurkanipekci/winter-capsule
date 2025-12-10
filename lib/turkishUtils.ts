export function getDativeSuffix(name: string): string {
  const lastVowel = name.match(/[aıoueiöü]/gi)?.pop()?.toLowerCase();
  
  // Kalın sesliler
  if (lastVowel && ['a', 'ı', 'o', 'u'].includes(lastVowel)) {
    return "'a";
  }
  
  // İnce sesliler (varsayılan)
  return "'e";
}
