export function getDativeSuffix(name: string): string {
  const lastVowel = name.match(/[aıoueiöü]/gi)?.pop()?.toLowerCase();
  
  // Back vowels
  if (lastVowel && ['a', 'ı', 'o', 'u'].includes(lastVowel)) {
    return "'a";
  }

  // Front vowels (default)
  return "'e";
}
