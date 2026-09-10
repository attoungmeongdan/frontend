// 푸터
function Footer() {
  return (
    <footer className="border-border-footer flex flex-col gap-2.5 border-t pt-4 pb-3">
      <p className="text-text-secondary text-lg font-semibold">Fittle</p>
      <p className="text-text-secondary text-[11px]">
        소개 &nbsp;|&nbsp; FAQ &nbsp;|&nbsp; 이용약관 &nbsp;|&nbsp; 개인정보처리방침
      </p>
      <p className="text-caption text-text-secondary">메일: help@fittle.example</p>
      <p className="text-caption text-text-secondary">사업자 등록번호: 000-00-00000</p>
    </footer>
  );
}

export default Footer;
