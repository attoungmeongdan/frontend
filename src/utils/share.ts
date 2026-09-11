export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch {
    return false;
  }
}

export async function shareText(text: string): Promise<"shared" | "copied" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share({ text });

      return "shared";
    } catch {
      return "failed";
    }
  }

  return (await copyText(text)) ? "copied" : "failed";
}
