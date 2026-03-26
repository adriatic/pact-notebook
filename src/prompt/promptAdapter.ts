export function extractText(cell: any): string {
  return (cell.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.value)
    .join("\n\n");
}