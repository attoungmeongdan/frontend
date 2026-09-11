/**
 * 선택 영역을 만들어 복사하는 옛 방식.
 * navigator.clipboard 는 HTTPS·localhost 에서만 존재해서,
 * 폰에서 개발 서버를 LAN 주소로 열었을 때는 이 경로로 떨어진다.
 */
function copyWithSelection(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  // 화면에 보이지 않게 두되, 포커스가 이동하며 화면이 튀지 않도록 고정 위치로 둔다
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);

  try {
    area.select();
    area.setSelectionRange(0, text.length);

    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(area);
  }
}

/** 클립보드 복사. 성공 여부를 돌려준다 */
export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);

      return true;
    } catch {
      // 권한 거부·비보안 컨텍스트면 아래 방식으로 한 번 더 시도한다
    }
  }

  return copyWithSelection(text);
}

/**
 * 시스템 공유 시트를 연다. 지원하지 않는 브라우저에서는 복사로 대신한다.
 * 사용자가 공유를 취소하면 아무 일도 없었던 것으로 둔다.
 */
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
