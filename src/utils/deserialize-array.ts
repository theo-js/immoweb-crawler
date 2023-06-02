export function deserializeArray(serializedArray: string): string[] {
  return serializedArray.split("\n");
}
