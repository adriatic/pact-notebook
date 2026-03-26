export function getPromptLabel(cell: any): string {
  const textBlock = cell.content?.find((b: any) => b.type === "text");

  const firstLine = textBlock?.value?.split("\n")[0] || "Untitled";

  const shortId = cell.cell_id?.slice(0, 8);

  return `${truncate(firstLine, 60)} [${shortId}]`;
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}