import {
  Activity,
  CalendarDays,
  Dumbbell,
  MapPin,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import turtleCelebrate from "@/assets/mascots/turtle-celebrate.png";
import turtleGuide from "@/assets/mascots/turtle-guide.png";

export type OnboardingStepId = "name" | "age" | "gender" | "address" | "height" | "weight";

export interface OnboardingStep {
  id: OnboardingStepId;
  stepName: string;
  question: string;
  mascot: string;
  message: string;
  tip: {
    icon: LucideIcon;
    title: string;
    description: string;
  };
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "name",
    stepName: "이름",
    question: "어떤 이름으로 부를까요?",
    mascot: turtleGuide,
    message:
      "안녕하세요! \n저는 꾸준한 거북이,꾸북이예요. \nFittle에서는 간단히 체력을 재고, 꾸준히 기록을 쌓을 수 있어요.",
    tip: {
      icon: Dumbbell,
      title: "자유 운동",
      description:
        "원하는 운동을 고르면 카메라로 동작을 인식해서 횟수를 세어줘요. \n운동을 마무리하면 캘린더에 운동 여부가 체크 돼요. ",
    },
  },
  {
    id: "age",
    stepName: "나이",
    question: "나이를 알려주세요",
    mascot: turtleGuide,
    message: "나이를 알려주시면\n같은 연령대 평균과 비교해서\n결과를 보여드려요.",
    tip: {
      icon: Activity,
      title: "운동 수행 능력 측정",
      description:
        "4가지 동작으로 동연령대 평균과 비교해서 \n내 체력이 어느정도인지 가늠할 수 있어요.",
    },
  },
  {
    id: "gender",
    stepName: "성별",
    question: "성별을 선택해 주세요",
    mascot: turtleGuide,
    message: "성별에 따라\n비교 기준이 달라져요.\n더 정확한 비교를 위해 필요해요.",
    tip: {
      icon: TrendingUp,
      title: "체력 측정 추이",
      description: "측정 기록이 쌓이면 홈에서 변화 그래프를 보여드려요",
    },
  },
  {
    id: "address",
    stepName: "주소",
    question: "집 주소를 알려주세요",
    mascot: turtleGuide,
    message: "집 주소를 알려주시면\n근처의 공공 체육시설을\n지도에서 찾아드릴게요.",
    tip: {
      icon: CalendarDays,
      title: "캘린더",
      description: "운동한 날이 체크로 쌓여요. 이번 달 실행률도 함께 보여드려요",
    },
  },
  {
    id: "height",
    stepName: "키",
    question: "키를 알려주세요",
    mascot: turtleGuide,
    message: "키와 몸무게로 BMI를 계산해서,\n지금 몸에 맞는 추천 운동을\n골라드려요.",
    tip: {
      icon: MapPin,
      title: "지도",
      description: "집 주변 공공 체육시설을 알려드려요",
    },
  },
  {
    id: "weight",
    stepName: "몸무게",
    question: "몸무게를 알려주세요",
    mascot: turtleCelebrate,
    message: "마지막이에요! 준비 끝나면\n이제 꾸북이랑 꾸준히 운동해봐요!",
    tip: {
      icon: UserRound,
      title: "마이페이지",
      description: "BMI에 맞는 추천 운동을 보여드려요",
    },
  },
];
