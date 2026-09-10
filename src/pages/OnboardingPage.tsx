import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import TipCard from "@/components/onboarding/TipCard";
import Button from "@/components/ui/Button";
import MascotSpeech from "@/components/ui/MascotSpeech";
import ProgressIndicator from "@/components/ui/ProgressIndicator";
import TextField from "@/components/ui/TextField";
import { ONBOARDING_STEPS } from "@/constants/onboarding";
import { useKakaoPostcode } from "@/hooks/useKakaoPostcode";
import turtleCheer from "@/assets/mascots/turtle-cheer.png";
import turtleTodayComplete from "@/assets/mascots/turtle-today-complete.png";

type Gender = "female" | "male";
type AddressStatus = "idle" | "done" | "fail";

// 숫자 아닌 값을 입력했을 때 단계별 오류 문구
const INVALID_MESSAGE = {
  age: "나이를 입력해 주세요.",
  height: "키를 입력해 주세요.",
  weight: "몸무게를 입력해 주세요.",
} as const;

const ADDRESS_HELPER: Record<AddressStatus, string> = {
  idle: "우편번호 검색으로 찾을 수 있어요.",
  done: "주소 선택이 완료됐어요. 지도에서 집 기준으로 사용돼요.",
  fail: "주소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.",
};

function isPositiveNumber(value: string) {
  return /^\d+(\.\d+)?$/.test(value.trim()) && Number(value) > 0;
}

function OnboardingPage() {
  const navigate = useNavigate();
  const openPostcode = useKakaoPostcode();

  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [addressStatus, setAddressStatus] = useState<AddressStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name] = useState("김핏틀");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [address, setAddress] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const step = ONBOARDING_STEPS[stepIndex];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  const handleSearchAddress = async () => {
    try {
      await openPostcode((selected) => {
        setAddress(selected);
        setAddressStatus("done");
      });
    } catch {
      setAddressStatus("fail");
    }
  };

  const handlePrev = () => {
    setError(null);
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      navigate(-1);
      return;
    }
    handlePrev();
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // TODO: 온보딩 저장 API 연동. 지금은 저장 없이 홈으로 이동한다.
    navigate("/", { replace: true });
  };

  const handleNext = () => {
    if (step.id === "age" && !isPositiveNumber(age)) {
      setError(INVALID_MESSAGE.age);
      return;
    }
    if (step.id === "height" && !isPositiveNumber(height)) {
      setError(INVALID_MESSAGE.height);
      return;
    }
    if (step.id === "weight" && !isPositiveNumber(weight)) {
      setError(INVALID_MESSAGE.weight);
      return;
    }

    setError(null);

    if (isLastStep) {
      handleSubmit();
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  const isNextDisabled =
    isSubmitting ||
    (step.id === "age" && age.trim() === "") ||
    (step.id === "gender" && gender === null) ||
    (step.id === "address" && address === "") ||
    (step.id === "height" && height.trim() === "") ||
    (step.id === "weight" && weight.trim() === "");

  let mascot = step.mascot;
  let message = step.message;

  if (step.id === "address" && addressStatus === "fail") {
    mascot = turtleCheer;
    message = "괜찮아요,\n천천히 다시 찾아볼까요?\n주소는 근처 운동 장소를\n찾는 데만 써요.";
  } else if (step.id === "address" && addressStatus === "done") {
    mascot = turtleCheer;
    message = "좋아요! 이제 이 주소 근처에서\n운동할 곳을 알려드릴 수 있어요.";
  } else if (error) {
    mascot = turtleCheer;
    message = "괜찮아요, 천천히 숫자만\n다시 입력해 주세요.";
  }

  if (isSubmitting) {
    mascot = turtleTodayComplete;
    message = "입력한 정보를 저장하고 있어요.\n곧 홈에서 만나요!";
  }

  return (
    <div className="flex h-full flex-col">
      <Header title="기본 정보 입력" showBack onBack={handleBack} />

      <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-5 pt-3 pb-5">
        <ProgressIndicator
          stepName={step.stepName}
          current={stepIndex + 1}
          total={ONBOARDING_STEPS.length}
          stateText="이전 단계로 돌아갈 수 있어요."
        />

        <h2 className="text-heading-2 text-text-primary whitespace-pre-line">{step.question}</h2>

        <div className="flex flex-col gap-4">
          {step.id === "name" && (
            <TextField
              label="이름"
              value={name}
              status="readonly"
              helper="소셜 프로필 정보라 수정할 수 없어요."
            />
          )}

          {step.id === "age" && (
            <TextField
              label="나이"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              unit="세"
              inputMode="numeric"
              placeholder="34"
              status={error ? "error" : "default"}
              helper={error ?? "동연령대 평균 비교에 사용돼요."}
            />
          )}

          {step.id === "gender" && (
            <div className="flex gap-3">
              {(
                [
                  ["female", "여성"],
                  ["male", "남성"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGender(value)}
                  aria-pressed={gender === value}
                  className={`rounded-input text-button h-13 flex-1 bg-white ${
                    gender === value
                      ? "border-brand-teal-strong text-brand-teal-strong border-2 font-bold"
                      : "border-field-border-strong text-text-primary border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {step.id === "address" && (
            <>
              <TextField
                label="주소"
                value={address}
                placeholder="주소를 검색해 주세요"
                readOnly
                status={
                  addressStatus === "fail"
                    ? "error"
                    : addressStatus === "done"
                      ? "success"
                      : "default"
                }
                helper={ADDRESS_HELPER[addressStatus]}
              />
              <Button variant="secondary" leadingIcon={Search} onClick={handleSearchAddress}>
                {addressStatus === "fail" ? "다시 검색하기" : "우편번호 검색"}
              </Button>
            </>
          )}

          {step.id === "height" && (
            <TextField
              label="키"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              unit="cm"
              inputMode="decimal"
              placeholder="165"
              status={error ? "error" : "default"}
              helper={error ?? "BMI 계산에 사용돼요."}
            />
          )}

          {step.id === "weight" && (
            <TextField
              label="몸무게"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              unit="kg"
              inputMode="decimal"
              placeholder="58"
              status={error ? "error" : "default"}
              helper={
                isSubmitting
                  ? "입력하신 정보를 저장하고 있어요."
                  : (error ?? "입력을 마치면 홈으로 이동해요.")
              }
            />
          )}
        </div>

        <MascotSpeech mascot={mascot} message={message} />
      </div>

      <div className="flex flex-col gap-[15px] p-5 pb-9">
        <TipCard {...step.tip} />

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="w-30"
            onClick={handlePrev}
            disabled={stepIndex === 0 || isSubmitting}
          >
            이전
          </Button>
          <Button className="flex-1" onClick={handleNext} disabled={isNextDisabled}>
            {isSubmitting ? "저장 중…" : isLastStep ? "완료" : "다음"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
